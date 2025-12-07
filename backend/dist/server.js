import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, runMigrations } from './db/index.js';
import { prompts, comparisons, workflows } from './db/schema.js';
import { eq, desc } from 'drizzle-orm';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
// Debug: Check if API key is loaded
console.log('🔑 API Key loaded:', process.env.XAI_API_KEY ? 'YES (length: ' + process.env.XAI_API_KEY.length + ')' : 'NO');
console.log('🔑 API Key prefix:', process.env.XAI_API_KEY?.substring(0, 10) + '...');
// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Initialize OpenAI client for xAI
const xaiClient = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
    timeout: 360000, // 6 minutes for reasoning models
});
// Run database migrations
runMigrations();
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Get all prompts
app.get('/api/prompts', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const allPrompts = await db.select().from(prompts).orderBy(desc(prompts.timestamp)).limit(limit);
        res.json(allPrompts);
    }
    catch (error) {
        console.error('Error fetching prompts:', error);
        res.status(500).json({ error: 'Failed to fetch prompts' });
    }
});
// Get single prompt
app.get('/api/prompts/:id', async (req, res) => {
    try {
        const [prompt] = await db.select().from(prompts).where(eq(prompts.id, req.params.id));
        if (!prompt) {
            return res.status(404).json({ error: 'Prompt not found' });
        }
        res.json(prompt);
    }
    catch (error) {
        console.error('Error fetching prompt:', error);
        res.status(500).json({ error: 'Failed to fetch prompt' });
    }
});
// Create and execute prompt (using xAI Responses API for agentic tools)
app.post('/api/prompts', async (req, res) => {
    try {
        const startTime = Date.now();
        const promptId = randomUUID();
        const { model, systemPrompt, userPrompt, temperature, maxTokens, topP, toolsEnabled, searchParameters, images, } = req.body;
        // Determine if we should use Responses API (for agentic tools) or Chat Completions API
        const hasAgenticTools = toolsEnabled && (toolsEnabled.includes('web_search') ||
            toolsEnabled.includes('x_search') ||
            toolsEnabled.includes('code_execution') ||
            toolsEnabled.includes('collections_search'));
        let completion;
        let serverSideToolUsage = null;
        let allToolCalls = [];
        let citations = [];
        if (hasAgenticTools) {
            // Use xAI Responses API for agentic server-side tools
            const input = [];
            if (systemPrompt) {
                input.push({ role: 'system', content: systemPrompt });
            }
            // Handle images if present
            if (images && images.length > 0) {
                const content = [];
                images.forEach((img) => {
                    content.push({
                        type: 'image_url',
                        image_url: { url: img, detail: 'high' }
                    });
                });
                content.push({ type: 'text', text: userPrompt });
                input.push({ role: 'user', content });
            }
            else {
                input.push({ role: 'user', content: userPrompt });
            }
            // Build tools array for Responses API
            const tools = [];
            if (toolsEnabled.includes('web_search')) {
                const webSearchTool = { type: 'web_search' };
                // Add search parameters if configured
                if (searchParameters?.web_search) {
                    const params = searchParameters.web_search;
                    if (params.allowed_domains) {
                        webSearchTool.allowed_domains = params.allowed_domains.split(',').map((d) => d.trim());
                    }
                    if (params.excluded_domains) {
                        webSearchTool.excluded_domains = params.excluded_domains.split(',').map((d) => d.trim());
                    }
                    if (params.enable_image_understanding) {
                        webSearchTool.enable_image_understanding = true;
                    }
                }
                tools.push(webSearchTool);
            }
            if (toolsEnabled.includes('x_search')) {
                const xSearchTool = { type: 'x_search' };
                // Add X search parameters if configured
                if (searchParameters?.x_search) {
                    const params = searchParameters.x_search;
                    if (params.allowed_x_handles) {
                        xSearchTool.allowed_x_handles = params.allowed_x_handles.split(',').map((h) => h.trim());
                    }
                    if (params.excluded_x_handles) {
                        xSearchTool.excluded_x_handles = params.excluded_x_handles.split(',').map((h) => h.trim());
                    }
                    if (params.from_date) {
                        xSearchTool.from_date = params.from_date;
                    }
                    if (params.to_date) {
                        xSearchTool.to_date = params.to_date;
                    }
                    if (params.enable_image_understanding) {
                        xSearchTool.enable_image_understanding = true;
                    }
                    if (params.enable_video_understanding) {
                        xSearchTool.enable_video_understanding = true;
                    }
                }
                tools.push(xSearchTool);
            }
            if (toolsEnabled.includes('code_execution')) {
                tools.push({ type: 'code_interpreter' });
            }
            if (toolsEnabled.includes('collections_search')) {
                const collectionsSearchTool = { type: 'file_search' };
                // Add collection IDs if provided
                if (searchParameters?.collections_search?.collection_ids) {
                    collectionsSearchTool.collection_ids = searchParameters.collections_search.collection_ids;
                }
                tools.push(collectionsSearchTool);
            }
            const responsesRequest = {
                model,
                input,
                temperature: temperature ?? 0.7,
                max_output_tokens: maxTokens ?? 2000,
                top_p: topP ?? 0.9,
                tools,
            };
            // Add reasoning effort for mini models
            if (req.body.reasoningEffort) {
                responsesRequest.reasoning_effort = req.body.reasoningEffort;
            }
            console.log('📤 Agentic Request to xAI Responses API:', JSON.stringify({
                model: responsesRequest.model,
                tools: responsesRequest.tools,
                input_length: responsesRequest.input.length
            }, null, 2));
            // Call Responses API
            const response = await fetch('https://api.x.ai/v1/responses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
                },
                body: JSON.stringify(responsesRequest),
            });
            completion = await response.json();
            console.log('📥 Response from xAI Responses API:', JSON.stringify({
                output_length: completion.output?.length || 0,
                server_side_tool_usage: completion.server_side_tool_usage,
                citations_count: completion.citations?.length || 0
            }, null, 2));
            // Extract data from Responses API format
            serverSideToolUsage = completion.server_side_tool_usage || null;
            citations = completion.citations || [];
            // Extract all tool calls from output
            if (completion.output) {
                completion.output.forEach((item) => {
                    if (item.type && item.type !== 'message') {
                        allToolCalls.push({
                            id: item.id || `call_${Date.now()}`,
                            type: item.type,
                            function: {
                                name: item.type.replace('_call', ''),
                                arguments: JSON.stringify(item)
                            }
                        });
                    }
                });
            }
            // Extract final message content from Responses API format
            const finalMessage = completion.output?.find((item) => item.type === 'message');
            // Extract text and citations from the content array
            let responseContent = '';
            let annotationsCitations = [];
            if (finalMessage?.content && Array.isArray(finalMessage.content)) {
                const textContent = finalMessage.content.find((item) => item.type === 'output_text');
                responseContent = textContent?.text || '';
                // Extract annotations (inline citations from the response)
                if (textContent?.annotations && Array.isArray(textContent.annotations)) {
                    annotationsCitations = textContent.annotations;
                }
            }
            else if (typeof finalMessage?.content === 'string') {
                responseContent = finalMessage.content;
            }
            const reasoningContent = finalMessage?.reasoning_content || '';
            // Merge annotations with top-level citations
            if (annotationsCitations.length > 0) {
                citations = [...citations, ...annotationsCitations];
            }
            const responseTime = Date.now() - startTime;
            const usage = completion.usage || {};
            // Save to database - manually stringify for SQLite (Drizzle's json mode doesn't auto-serialize on insert)
            const newPrompt = {
                id: promptId,
                model,
                systemPrompt: systemPrompt || null,
                userPrompt,
                temperature: temperature ?? 0.7,
                maxTokens: maxTokens ?? 2000,
                topP: topP ?? 0.9,
                toolsEnabled: toolsEnabled && toolsEnabled.length > 0 ? JSON.stringify(toolsEnabled) : null,
                searchParameters: searchParameters && Object.keys(searchParameters).length > 0 ? JSON.stringify(searchParameters) : null,
                enableReasoning: false,
                functions: null,
                toolCalls: allToolCalls.length > 0 ? JSON.stringify(allToolCalls) : null,
                toolResults: null,
                reasoningContent: reasoningContent || null,
                encryptedContent: null,
                reasoningEffort: req.body.reasoningEffort || null,
                fileIds: req.body.fileIds && req.body.fileIds.length > 0 ? JSON.stringify(req.body.fileIds) : null,
                responseContent: responseContent || '',
                citations: citations && citations.length > 0 ? JSON.stringify(citations) : null,
                promptTokens: usage.prompt_tokens || 0,
                completionTokens: usage.completion_tokens || 0,
                reasoningTokens: usage.completion_tokens_details?.reasoning_tokens || 0,
                cachedTokens: usage.prompt_tokens_details?.cached_tokens || 0,
                totalTokens: usage.total_tokens || 0,
                toolUsage: (serverSideToolUsage && typeof serverSideToolUsage === 'object' && Object.keys(serverSideToolUsage).length > 0) ? JSON.stringify(serverSideToolUsage) : null,
                images: images && images.length > 0 ? JSON.stringify(images) : null,
                error: null,
                tags: null,
                responseTime,
            }; // Cast to any to bypass Drizzle's type checking - we're manually stringifying
            console.log('💾 Attempting to save to database...');
            // Debug: Log each field's type to find the problematic one
            try {
                const fieldTypes = {};
                for (const [key, value] of Object.entries(newPrompt)) {
                    const type = typeof value;
                    fieldTypes[key] = type;
                    // Check for invalid types
                    if (type !== 'string' && type !== 'number' && type !== 'boolean' && type !== 'bigint' && value !== null && !Buffer.isBuffer(value)) {
                        console.error(`❌ Invalid field "${key}": type=${type}, value=`, value);
                    }
                }
                console.log('📋 Field types:', fieldTypes);
                await db.insert(prompts).values(newPrompt);
                console.log('✅ Successfully saved to database');
            }
            catch (dbError) {
                console.error('❌ Database insert failed:', dbError.message);
                console.error('Full object:', JSON.stringify(newPrompt, null, 2));
                throw dbError;
            }
            res.json({
                ...newPrompt,
                // Parse JSON strings back to objects for frontend
                citations: citations || [],
                toolsEnabled: toolsEnabled || [],
                searchParameters: searchParameters || {},
                toolCalls: allToolCalls || [],
                fileIds: req.body.fileIds || [],
                images: images || [],
                serverSideToolUsage: serverSideToolUsage || {},
            });
        }
        else {
            // Use regular Chat Completions API for non-agentic requests
            const messages = [];
            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }
            // Handle images if present
            if (images && images.length > 0) {
                const content = [];
                images.forEach((img) => {
                    content.push({
                        type: 'image_url',
                        image_url: { url: img, detail: 'high' }
                    });
                });
                content.push({ type: 'text', text: userPrompt });
                messages.push({ role: 'user', content });
            }
            else {
                messages.push({ role: 'user', content: userPrompt });
            }
            const requestOptions = {
                model,
                messages,
                temperature: temperature ?? 0.7,
                max_tokens: maxTokens ?? 2000,
                top_p: topP ?? 0.9,
                stream: false,
            };
            // Add functions/tools if provided
            if (req.body.functions && req.body.functions.length > 0) {
                requestOptions.tools = req.body.functions.map((func) => ({
                    type: 'function',
                    function: {
                        name: func.name,
                        description: func.description,
                        parameters: func.parameters
                    }
                }));
                requestOptions.tool_choice = 'auto';
            }
            // Add reasoning effort
            if (req.body.reasoningEffort) {
                requestOptions.reasoning_effort = req.body.reasoningEffort;
            }
            console.log('📤 Request to xAI Chat Completions:', JSON.stringify({
                model: requestOptions.model,
                messages_length: requestOptions.messages.length,
                tools: requestOptions.tools
            }, null, 2));
            completion = await xaiClient.chat.completions.create(requestOptions);
            console.log('📥 Response from xAI:', JSON.stringify({
                tool_calls: completion.choices[0].message.tool_calls,
                content_length: completion.choices[0].message.content?.length || 0
            }, null, 2));
            const responseTime = Date.now() - startTime;
            const usage = completion.usage;
            // Save to database - manually stringify for SQLite (Drizzle's json mode doesn't auto-serialize on insert)
            const newPrompt = {
                id: promptId,
                model,
                systemPrompt: systemPrompt || null,
                userPrompt,
                temperature: temperature ?? 0.7,
                maxTokens: maxTokens ?? 2000,
                topP: topP ?? 0.9,
                toolsEnabled: toolsEnabled && toolsEnabled.length > 0 ? JSON.stringify(toolsEnabled) : null,
                searchParameters: searchParameters && Object.keys(searchParameters).length > 0 ? JSON.stringify(searchParameters) : null,
                enableReasoning: false,
                functions: req.body.functions && req.body.functions.length > 0 ? JSON.stringify(req.body.functions) : null,
                toolCalls: completion.choices[0].message.tool_calls ? JSON.stringify(completion.choices[0].message.tool_calls) : null,
                toolResults: null,
                reasoningContent: completion.choices[0].message.reasoning_content || null,
                encryptedContent: completion.encrypted_content || null,
                reasoningEffort: req.body.reasoningEffort || null,
                fileIds: req.body.fileIds && req.body.fileIds.length > 0 ? JSON.stringify(req.body.fileIds) : null,
                responseContent: completion.choices[0].message.content || '',
                citations: completion.citations && completion.citations.length > 0 ? JSON.stringify(completion.citations) : null,
                promptTokens: usage?.prompt_tokens || 0,
                completionTokens: usage?.completion_tokens || 0,
                reasoningTokens: usage?.completion_tokens_details?.reasoning_tokens || 0,
                cachedTokens: usage?.prompt_tokens_details?.cached_tokens || 0,
                totalTokens: usage?.total_tokens || 0,
                toolUsage: null,
                images: images && images.length > 0 ? JSON.stringify(images) : null,
                error: null,
                tags: null,
                responseTime,
            }; // Cast to any to bypass Drizzle's type checking - we're manually stringifying
            await db.insert(prompts).values(newPrompt);
            res.json({
                ...newPrompt,
                // Parse JSON strings back to objects for frontend
                citations: completion.citations || [],
                toolsEnabled: toolsEnabled || [],
                searchParameters: searchParameters || {},
                toolCalls: completion.choices[0].message.tool_calls || [],
                fileIds: req.body.fileIds || [],
                images: images || [],
                serverSideToolUsage: {},
            });
        }
    }
    catch (error) {
        console.error('Error executing prompt:', error);
        // Still save failed prompt to DB
        try {
            const failedPrompt = {
                id: randomUUID(),
                model: req.body.model,
                systemPrompt: req.body.systemPrompt || null,
                userPrompt: req.body.userPrompt,
                temperature: req.body.temperature ?? 0.7,
                maxTokens: req.body.maxTokens ?? 2000,
                topP: req.body.topP ?? 0.9,
                toolsEnabled: req.body.toolsEnabled && req.body.toolsEnabled.length > 0 ? JSON.stringify(req.body.toolsEnabled) : null,
                searchParameters: req.body.searchParameters && Object.keys(req.body.searchParameters).length > 0 ? JSON.stringify(req.body.searchParameters) : null,
                enableReasoning: false,
                functions: null,
                toolCalls: null,
                toolResults: null,
                reasoningContent: null,
                encryptedContent: null,
                reasoningEffort: null,
                fileIds: null,
                responseContent: null,
                citations: null,
                promptTokens: 0,
                completionTokens: 0,
                reasoningTokens: 0,
                cachedTokens: 0,
                totalTokens: 0,
                toolUsage: null,
                images: req.body.images && req.body.images.length > 0 ? JSON.stringify(req.body.images) : null,
                error: error.message,
                tags: null,
                responseTime: null,
            }; // Cast to any to bypass Drizzle's type checking - we're manually stringifying
            await db.insert(prompts).values(failedPrompt);
        }
        catch (dbError) {
            console.error('Failed to save error to DB:', dbError);
        }
        res.status(500).json({
            error: error.message,
            details: error.response?.data || error
        });
    }
});
// Stream endpoint for real-time responses
app.post('/api/prompts/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    try {
        const startTime = Date.now();
        const promptId = randomUUID();
        const { model, systemPrompt, userPrompt, temperature, maxTokens, topP, toolsEnabled, searchParameters, images, } = req.body;
        // Build messages
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        if (images && images.length > 0) {
            const content = [];
            images.forEach((img) => {
                content.push({
                    type: 'image_url',
                    image_url: { url: img, detail: 'high' }
                });
            });
            content.push({ type: 'text', text: userPrompt });
            messages.push({ role: 'user', content });
        }
        else {
            messages.push({ role: 'user', content: userPrompt });
        }
        const requestOptions = {
            model,
            messages,
            temperature: temperature ?? 0.7,
            max_tokens: maxTokens ?? 2000,
            top_p: topP ?? 0.9,
            stream: true,
        };
        // Add search parameters for live search (uses old Live Search API)
        if (toolsEnabled && toolsEnabled.includes('live_search')) {
            requestOptions.search_parameters = {
                mode: 'on',
                ...searchParameters
            };
        }
        else if (searchParameters) {
            requestOptions.search_parameters = searchParameters;
        }
        const stream = (await xaiClient.chat.completions.create(requestOptions));
        let fullContent = '';
        let usage = null;
        let citations = [];
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
                fullContent += delta.content;
                res.write(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`);
            }
            if (chunk.choices[0]?.finish_reason) {
                res.write(`data: ${JSON.stringify({ type: 'done', reason: chunk.choices[0].finish_reason })}\n\n`);
            }
            // Capture usage and citations from final chunk
            if (chunk.usage) {
                usage = chunk.usage;
            }
            if (chunk.citations) {
                citations = chunk.citations;
            }
        }
        const responseTime = Date.now() - startTime;
        // Save to database - manually stringify for SQLite (Drizzle's json mode doesn't auto-serialize on insert)
        const newPrompt = {
            id: promptId,
            model,
            systemPrompt: systemPrompt || null,
            userPrompt,
            temperature: temperature ?? 0.7,
            maxTokens: maxTokens ?? 2000,
            topP: topP ?? 0.9,
            toolsEnabled: toolsEnabled && toolsEnabled.length > 0 ? JSON.stringify(toolsEnabled) : null,
            searchParameters: searchParameters && Object.keys(searchParameters).length > 0 ? JSON.stringify(searchParameters) : null,
            enableReasoning: false,
            functions: null,
            toolCalls: null,
            toolResults: null,
            reasoningContent: null,
            encryptedContent: null,
            reasoningEffort: req.body.reasoningEffort || null,
            fileIds: null,
            responseContent: fullContent,
            citations: citations && citations.length > 0 ? JSON.stringify(citations) : null,
            promptTokens: usage?.prompt_tokens || 0,
            completionTokens: usage?.completion_tokens || 0,
            reasoningTokens: usage?.completion_tokens_details?.reasoning_tokens || 0,
            cachedTokens: usage?.prompt_tokens_details?.cached_tokens || 0,
            totalTokens: usage?.total_tokens || 0,
            toolUsage: null,
            images: images && images.length > 0 ? JSON.stringify(images) : null,
            error: null,
            tags: null,
            responseTime,
        }; // Cast to any to bypass Drizzle's type checking - we're manually stringifying
        await db.insert(prompts).values(newPrompt);
        res.write(`data: ${JSON.stringify({
            type: 'metadata',
            id: promptId,
            usage,
            citations,
            responseTime
        })}\n\n`);
        res.end();
    }
    catch (error) {
        console.error('Error streaming prompt:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
    }
});
// Delete prompt
app.delete('/api/prompts/:id', async (req, res) => {
    try {
        await db.delete(prompts).where(eq(prompts.id, req.params.id));
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting prompt:', error);
        res.status(500).json({ error: 'Failed to delete prompt' });
    }
});
// Get comparisons
app.get('/api/comparisons', async (req, res) => {
    try {
        const allComparisons = await db.select().from(comparisons).orderBy(desc(comparisons.createdAt));
        res.json(allComparisons);
    }
    catch (error) {
        console.error('Error fetching comparisons:', error);
        res.status(500).json({ error: 'Failed to fetch comparisons' });
    }
});
// Create comparison
app.post('/api/comparisons', async (req, res) => {
    try {
        const { promptAId, promptBId, notes } = req.body;
        const comparison = {
            id: randomUUID(),
            promptAId,
            promptBId,
            notes,
        };
        await db.insert(comparisons).values(comparison);
        res.json(comparison);
    }
    catch (error) {
        console.error('Error creating comparison:', error);
        res.status(500).json({ error: 'Failed to create comparison' });
    }
});
// Workflow endpoints
// Get all workflows
app.get('/api/workflows', async (req, res) => {
    try {
        const allWorkflows = await db.select().from(workflows).orderBy(desc(workflows.updatedAt));
        res.json(allWorkflows);
    }
    catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ error: 'Failed to fetch workflows' });
    }
});
// Get single workflow
app.get('/api/workflows/:id', async (req, res) => {
    try {
        const [workflow] = await db.select().from(workflows).where(eq(workflows.id, req.params.id));
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        res.json(workflow);
    }
    catch (error) {
        console.error('Error fetching workflow:', error);
        res.status(500).json({ error: 'Failed to fetch workflow' });
    }
});
// Create workflow
app.post('/api/workflows', async (req, res) => {
    try {
        const { name, description, steps } = req.body;
        const workflow = {
            id: randomUUID(),
            name,
            description: description || null,
            steps: JSON.stringify(steps),
            isPreset: false,
        };
        await db.insert(workflows).values(workflow);
        res.json({
            ...workflow,
            steps, // Return parsed steps
        });
    }
    catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'Failed to create workflow' });
    }
});
// Update workflow
app.put('/api/workflows/:id', async (req, res) => {
    try {
        const { name, description, steps } = req.body;
        const updateData = {
            name,
            description: description || null,
            steps: JSON.stringify(steps),
            updatedAt: new Date(),
        };
        await db.update(workflows)
            .set(updateData)
            .where(eq(workflows.id, req.params.id));
        const [updated] = await db.select().from(workflows).where(eq(workflows.id, req.params.id));
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({ error: 'Failed to update workflow' });
    }
});
// Delete workflow
app.delete('/api/workflows/:id', async (req, res) => {
    try {
        await db.delete(workflows).where(eq(workflows.id, req.params.id));
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({ error: 'Failed to delete workflow' });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map