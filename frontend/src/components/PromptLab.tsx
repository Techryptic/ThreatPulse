import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prompt, PromptRequest, AVAILABLE_MODELS, AVAILABLE_TOOLS, AppMode, PresetTemplate, ResearchSession, ResearchStep, AgentWorkflow, AgentExecution } from '../types';
import { formatTokens, calculateCost, formatCost, truncateText } from '../lib/utils';
import { Sun, Moon, Send, History, Sliders, Trash2, Beaker, Upload, X, Plus, Code, Sparkles } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { TestCasesPanel } from './TestCasesPanel';
import { TestCase } from '../data/testCases';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ModeSelector } from './ModeSelector';
import { PresetPicker } from './PresetPicker';
import { ResearchMode } from './ResearchMode';
import { AgentBuilder } from './AgentBuilder';
import { LiveThreatMode } from './LiveThreatMode';
import { RLThreatIntelligence } from './RLThreatIntelligence';

const API_BASE = '/api';

export function PromptLab() {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const [model, setModel] = useState('grok-4');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [topP, setTopP] = useState(0.9);
  const [toolsEnabled, setToolsEnabled] = useState<string[]>([]);
  
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [citations, setCitations] = useState<Array<string | { type: string; url: string }>>([]);
  const [usage, setUsage] = useState<any>(null);
  const [reasoningContent, setReasoningContent] = useState<string>('');
  const [toolCalls, setToolCalls] = useState<any[]>([]);
  const [serverSideToolUsage, setServerSideToolUsage] = useState<Record<string, number>>({});
  const [responseTab, setResponseTab] = useState<'response' | 'reasoning' | 'tools' | 'citations' | 'request' | 'raw-response'>('response');
  const [showTestCases, setShowTestCases] = useState(false);
  const [functions, setFunctions] = useState<any[]>([]);
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'high' | undefined>(undefined);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [useStreaming, setUseStreaming] = useState(false);
  const [showFunctionBuilder, setShowFunctionBuilder] = useState(false);
  const [webSearchParams, setWebSearchParams] = useState({
    allowed_domains: '',
    excluded_domains: '',
    enable_image_understanding: false,
  });
  const [xSearchParams, setXSearchParams] = useState({
    allowed_x_handles: '',
    excluded_x_handles: '',
    from_date: '',
    to_date: '',
    enable_image_understanding: false,
    enable_video_understanding: false,
  });
  const [collectionsSearchParams, setCollectionsSearchParams] = useState({
    collection_ids: '',
  });
  
  // New state for modes
  const [currentMode, setCurrentMode] = useState<AppMode>('standard');
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [researchSession, setResearchSession] = useState<ResearchSession | null>(null);
  const [agentExecution, setAgentExecution] = useState<AgentExecution | null>(null);
  const [rawRequest, setRawRequest] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [requestJsonError, setRequestJsonError] = useState<string>('');
  
  const { data: prompts = [] } = useQuery<Prompt[]>({
    queryKey: ['prompts'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/prompts`);
      return data;
    },
  });

  const createPromptMutation = useMutation({
    mutationFn: async (request: PromptRequest) => {
      const { data } = await axios.post(`${API_BASE}/prompts`, request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_BASE}/prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };

  const handleLoadTestCase = (testCase: TestCase) => {
    setSystemPrompt(testCase.systemPrompt);
    setUserPrompt(testCase.userPrompt);
    if (testCase.requiredSettings.model) setModel(testCase.requiredSettings.model);
    if (testCase.requiredSettings.temperature !== undefined) setTemperature(testCase.requiredSettings.temperature);
    if (testCase.requiredSettings.maxTokens) setMaxTokens(testCase.requiredSettings.maxTokens);
    setReasoningEffort(testCase.requiredSettings.enableReasoning ? 'high' : undefined);
    setToolsEnabled(testCase.requiredSettings.toolsEnabled || []);
    if (testCase.requiredSettings.functions) {
      const fns = testCase.requiredSettings.functions.map((fn: string) => {
        if (fn === 'calculator') return { name: 'calculate', description: 'Perform calculations', parameters: { type: 'object', properties: { operation: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' } }, required: ['operation', 'x', 'y'] } };
        return null;
      }).filter(Boolean);
      setFunctions(fns);
    } else {
      setFunctions([]);
    }
    setResponse('');
    setCitations([]);
    setUsage(null);
    setReasoningContent('');
    setToolCalls([]);
    setServerSideToolUsage({});
    setShowTestCases(false);
  };

  const handleSubmit = async () => {
    if (!userPrompt.trim()) return;
    setIsLoading(true);
    setResponse('');
    setCitations([]);
    setUsage(null);
    setReasoningContent('');
    setToolCalls([]);
    setRawResponse(null);

    try {
      // Generate and store raw request
      const currentRequest = generateRawRequest();
      setRawRequest(currentRequest);
      if (useStreaming) {
        // Build search parameters
        const searchParameters: any = {};
        if (toolsEnabled.includes('web_search')) {
          searchParameters.web_search = webSearchParams;
        }
        if (toolsEnabled.includes('x_search')) {
          searchParameters.x_search = xSearchParams;
        }
        if (toolsEnabled.includes('collections_search')) {
          searchParameters.collections_search = collectionsSearchParams;
        }

        // Streaming mode
        const request = {
          model,
          systemPrompt: systemPrompt || undefined,
          userPrompt,
          temperature,
          maxTokens,
          topP,
          toolsEnabled: toolsEnabled.length > 0 ? toolsEnabled : undefined,
          searchParameters: Object.keys(searchParameters).length > 0 ? searchParameters : undefined,
          images: uploadedImages.length > 0 ? uploadedImages : undefined,
        };

        const eventSource = new EventSource(`${API_BASE}/prompts/stream`);
        let streamedContent = '';

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'content') {
            streamedContent += data.content;
            setResponse(streamedContent);
          } else if (data.type === 'metadata') {
            setUsage({
              promptTokens: data.usage?.prompt_tokens || 0,
              completionTokens: data.usage?.completion_tokens || 0,
              reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens || 0,
              cachedTokens: data.usage?.prompt_tokens_details?.cached_tokens || 0,
              totalTokens: data.usage?.total_tokens || 0,
            });
            setCitations(data.citations || []);
            eventSource.close();
            setIsLoading(false);
            queryClient.invalidateQueries({ queryKey: ['prompts'] });
          } else if (data.type === 'error') {
            setResponse(`Error: ${data.error}`);
            eventSource.close();
            setIsLoading(false);
          }
        };

        // Send request to start stream
        await fetch(`${API_BASE}/prompts/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
      } else {
        // Build search parameters
        const searchParameters: any = {};
        if (toolsEnabled.includes('web_search')) {
          searchParameters.web_search = webSearchParams;
        }
        if (toolsEnabled.includes('x_search')) {
          searchParameters.x_search = xSearchParams;
        }
        if (toolsEnabled.includes('collections_search')) {
          searchParameters.collections_search = collectionsSearchParams;
        }

        // Non-streaming mode
        const request: PromptRequest = {
          model,
          systemPrompt: systemPrompt || undefined,
          userPrompt,
          temperature,
          maxTokens,
          topP,
          toolsEnabled: toolsEnabled.length > 0 ? toolsEnabled : undefined,
          functions: functions.length > 0 ? functions : undefined,
          reasoningEffort,
          searchParameters: Object.keys(searchParameters).length > 0 ? searchParameters : undefined,
          images: uploadedImages.length > 0 ? uploadedImages : undefined,
        };
        const result = await createPromptMutation.mutateAsync(request);
        
        // Store raw response
        setRawResponse(result);
        
        setResponse(result.responseContent || '');
        setCitations(result.citations || []);
        setReasoningContent(result.reasoningContent || '');
        setToolCalls(result.toolCalls || []);
        setServerSideToolUsage(result.serverSideToolUsage || {});
        setUsage({
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          reasoningTokens: result.reasoningTokens,
          cachedTokens: result.cachedTokens,
          totalTokens: result.totalTokens,
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      setResponse(`Error: ${error.response?.data?.error || error.message}`);
      setIsLoading(false);
    }
  };

  const loadPrompt = (prompt: Prompt) => {
    setSelectedPromptId(prompt.id?.toString() || null);
    setModel(prompt.model);
    setSystemPrompt(prompt.systemPrompt || prompt.system_prompt || '');
    setUserPrompt(prompt.userPrompt || prompt.user_prompt || '');
    setTemperature(prompt.temperature || 0.7);
    setMaxTokens(prompt.maxTokens || prompt.max_tokens || 2000);
    setTopP(prompt.topP || 0.9);
    
    // Parse JSON strings from database
    const parseJSON = (value: any) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value || [];
    };
    
    setToolsEnabled(parseJSON(prompt.toolsEnabled));
    setResponse(prompt.responseContent || prompt.response || '');
    setCitations(parseJSON(prompt.citations));
    setReasoningContent((prompt as any).reasoningContent || '');
    setToolCalls(parseJSON((prompt as any).toolCalls));
    setServerSideToolUsage(parseJSON((prompt as any).serverSideToolUsage) || {});
    
    if (prompt.promptTokens) {
      setUsage({
        promptTokens: prompt.promptTokens,
        completionTokens: prompt.completionTokens,
        reasoningTokens: prompt.reasoningTokens,
        cachedTokens: prompt.cachedTokens,
        totalTokens: prompt.totalTokens,
      });
    }
  };

  const toggleTool = (toolId: string) => {
    setToolsEnabled(prev => prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setUploadedImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Generate raw request object from current UI state
  const generateRawRequest = () => {
    const searchParameters: any = {};
    if (toolsEnabled.includes('web_search')) {
      searchParameters.web_search = webSearchParams;
    }
    if (toolsEnabled.includes('x_search')) {
      searchParameters.x_search = xSearchParams;
    }
    if (toolsEnabled.includes('collections_search')) {
      searchParameters.collections_search = collectionsSearchParams;
    }

    const request: any = {
      model,
      systemPrompt: systemPrompt || undefined,
      userPrompt,
      temperature,
      maxTokens,
      topP,
      toolsEnabled: toolsEnabled.length > 0 ? toolsEnabled : undefined,
      functions: functions.length > 0 ? functions : undefined,
      reasoningEffort,
      searchParameters: Object.keys(searchParameters).length > 0 ? searchParameters : undefined,
      images: uploadedImages.length > 0 ? uploadedImages.map(img => `<base64_data_truncated_for_display>`) : undefined,
    };

    // Remove undefined values for cleaner JSON
    Object.keys(request).forEach(key => {
      if (request[key] === undefined) delete request[key];
    });

    return request;
  };

  // Apply raw request JSON to UI state
  const applyRawRequest = (requestJson: string) => {
    try {
      const parsed = JSON.parse(requestJson);
      setRequestJsonError('');
      
      // Update all UI states from parsed JSON
      if (parsed.model) setModel(parsed.model);
      if (parsed.systemPrompt !== undefined) setSystemPrompt(parsed.systemPrompt);
      if (parsed.userPrompt !== undefined) setUserPrompt(parsed.userPrompt);
      if (parsed.temperature !== undefined) setTemperature(parsed.temperature);
      if (parsed.maxTokens !== undefined) setMaxTokens(parsed.maxTokens);
      if (parsed.topP !== undefined) setTopP(parsed.topP);
      if (parsed.toolsEnabled) setToolsEnabled(parsed.toolsEnabled);
      if (parsed.functions) setFunctions(parsed.functions);
      if (parsed.reasoningEffort !== undefined) setReasoningEffort(parsed.reasoningEffort);
      
      // Update search parameters
      if (parsed.searchParameters?.web_search) {
        setWebSearchParams(parsed.searchParameters.web_search);
      }
      if (parsed.searchParameters?.x_search) {
        setXSearchParams(parsed.searchParameters.x_search);
      }
      if (parsed.searchParameters?.collections_search) {
        setCollectionsSearchParams(parsed.searchParameters.collections_search);
      }
      
      return true;
    } catch (error: any) {
      setRequestJsonError(error.message);
      return false;
    }
  };

  // Mode handlers
  const handleModeChange = (mode: AppMode) => {
    setCurrentMode(mode);
    // Reset mode-specific state
    setResearchSession(null);
    setAgentExecution(null);
  };

  const handleSelectPreset = (preset: PresetTemplate) => {
    setSystemPrompt(preset.systemPrompt);
    setUserPrompt(preset.userPromptTemplate);
    if (preset.tools) {
      setToolsEnabled(preset.tools);
    }
    setCurrentMode(preset.mode);
  };

  const handleStartResearch = async () => {
    if (!userPrompt.trim()) return;
    
    setIsLoading(true);
    
    // Reset usage for new research
    setUsage(null);
    setResponse('');
    setCitations([]);
    setReasoningContent('');
    setToolCalls([]);
    setServerSideToolUsage({});

    try {
      // Build search parameters
      const searchParameters: any = {};
      if (toolsEnabled.includes('web_search')) {
        searchParameters.web_search = webSearchParams;
      }
      if (toolsEnabled.includes('x_search')) {
        searchParameters.x_search = xSearchParams;
      }
      if (toolsEnabled.includes('collections_search')) {
        searchParameters.collections_search = collectionsSearchParams;
      }

      // STEP 1: Generate Research Plan
      setResearchSession({
        question: userPrompt,
        steps: [
          {
            id: 'plan',
            type: 'analyze',
            status: 'running',
            query: 'Generating research plan...',
            timestamp: Date.now(),
          }
        ],
        startTime: Date.now(),
        totalCost: 0,
      });

      const planResponse = await axios.post(`${API_BASE}/prompts`, {
        model,
        systemPrompt: `You are a research planning assistant. Given a research question, break it down into 3-5 focused sub-questions that will help answer the main question comprehensively. 

Output ONLY a JSON array of sub-questions, nothing else. Format:
["sub-question 1", "sub-question 2", "sub-question 3"]

Make each sub-question specific and searchable.`,
        userPrompt: `Research question: ${userPrompt}\n\nBreak this into 3-5 sub-questions:`,
        temperature: 0.3,
        maxTokens: 500,
      });

      let subQuestions: string[] = [];
      try {
        const planContent = planResponse.data.responseContent.trim();
        const jsonMatch = planContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          subQuestions = JSON.parse(jsonMatch[0]);
        } else {
          subQuestions = [userPrompt];
        }
      } catch {
        subQuestions = [userPrompt];
      }

      const planCost = calculateCost(
        planResponse.data.promptTokens,
        planResponse.data.completionTokens,
        0,
        model,
        {}
      );

      // Create steps for each sub-question
      const researchSteps: ResearchStep[] = [
        {
          id: 'plan',
          type: 'analyze',
          status: 'completed',
          query: 'Research plan generated',
          results: `Research broken into ${subQuestions.length} sub-questions:\n${subQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
          timestamp: Date.now(),
          cost: planCost,
        },
        ...subQuestions.map((q, i) => ({
          id: `search-${i}`,
          type: 'search' as const,
          status: 'pending' as const,
          query: q,
          timestamp: Date.now(),
        }))
      ];

      setResearchSession({
        question: userPrompt,
        steps: researchSteps,
        startTime: Date.now(),
        totalCost: planCost,
      });

      // STEP 2: Execute each sub-question search
      let totalCost = planCost;
      let aggregatedUsage = {
        promptTokens: planResponse.data.promptTokens || 0,
        completionTokens: planResponse.data.completionTokens || 0,
        reasoningTokens: 0,
        cachedTokens: 0,
        totalTokens: planResponse.data.totalTokens || 0,
      };
      let allCitations: Array<string | { type: string; url: string }> = [];
      let allToolUsage: Record<string, number> = {};
      let allResults: string[] = [];

      for (let i = 0; i < subQuestions.length; i++) {
        const subQ = subQuestions[i];
        
        // Update step to running
        setResearchSession(prev => prev ? {
          ...prev,
          steps: prev.steps.map((s, idx) => 
            idx === i + 1 ? { ...s, status: 'running' } : s
          ),
        } : null);

        // Search for this sub-question
        const searchResponse = await axios.post(`${API_BASE}/prompts`, {
          model,
          systemPrompt: 'You are a research assistant. Provide detailed, well-researched answers with citations.',
          userPrompt: subQ,
          temperature,
          maxTokens,
          toolsEnabled: toolsEnabled.length > 0 ? toolsEnabled : ['web_search'],
          searchParameters: Object.keys(searchParameters).length > 0 ? searchParameters : undefined,
        });

        const stepCost = calculateCost(
          searchResponse.data.promptTokens,
          searchResponse.data.completionTokens,
          searchResponse.data.reasoningTokens || 0,
          model,
          {}
        );
        totalCost += stepCost;

        // Aggregate stats
        aggregatedUsage.promptTokens += searchResponse.data.promptTokens || 0;
        aggregatedUsage.completionTokens += searchResponse.data.completionTokens || 0;
        aggregatedUsage.reasoningTokens += searchResponse.data.reasoningTokens || 0;
        aggregatedUsage.cachedTokens += searchResponse.data.cachedTokens || 0;
        aggregatedUsage.totalTokens += searchResponse.data.totalTokens || 0;

        if (searchResponse.data.citations) {
          allCitations = [...allCitations, ...searchResponse.data.citations];
        }
        if (searchResponse.data.serverSideToolUsage) {
          Object.entries(searchResponse.data.serverSideToolUsage).forEach(([tool, count]) => {
            allToolUsage[tool] = (allToolUsage[tool] || 0) + (count as number);
          });
        }

        allResults.push(searchResponse.data.responseContent);

        // Update step to completed
        setResearchSession(prev => prev ? {
          ...prev,
          steps: prev.steps.map((s, idx) => 
            idx === i + 1 ? {
              ...s,
              status: 'completed',
              results: searchResponse.data.responseContent,
              cost: stepCost,
            } : s
          ),
          totalCost: totalCost,
        } : null);
      }

      // STEP 3: Add synthesis step
      setResearchSession(prev => prev ? {
        ...prev,
        steps: [
          ...prev.steps,
          {
            id: 'synthesis',
            type: 'synthesize',
            status: 'running',
            query: 'Synthesizing all findings...',
            timestamp: Date.now(),
          }
        ],
      } : null);

      // Synthesize all findings
      const synthesisPrompt = `Based on the following research findings, provide a comprehensive answer to the question: "${userPrompt}"

${allResults.map((r, i) => `\n### Finding ${i + 1} (${subQuestions[i]}):\n${r}`).join('\n\n')}

Synthesize these findings into a cohesive, well-structured answer. Include all important details and cite sources when relevant.`;

      const synthesisResponse = await axios.post(`${API_BASE}/prompts`, {
        model,
        systemPrompt: 'You are a research synthesis expert. Combine multiple research findings into a comprehensive, well-structured answer.',
        userPrompt: synthesisPrompt,
        temperature: 0.5,
        maxTokens: maxTokens * 2,
      });

      const synthesisCost = calculateCost(
        synthesisResponse.data.promptTokens,
        synthesisResponse.data.completionTokens,
        0,
        model,
        {}
      );
      totalCost += synthesisCost;

      // Final aggregation
      aggregatedUsage.promptTokens += synthesisResponse.data.promptTokens || 0;
      aggregatedUsage.completionTokens += synthesisResponse.data.completionTokens || 0;
      aggregatedUsage.totalTokens += synthesisResponse.data.totalTokens || 0;

      // Set final state
      setUsage(aggregatedUsage);
      setCitations(allCitations);
      setServerSideToolUsage(allToolUsage);
      setResponse(synthesisResponse.data.responseContent);

      setResearchSession(prev => prev ? {
        ...prev,
        steps: prev.steps.map(s => 
          s.id === 'synthesis' ? {
            ...s,
            status: 'completed',
            results: synthesisResponse.data.responseContent,
            cost: synthesisCost,
          } : s
        ),
        finalSynthesis: synthesisResponse.data.responseContent,
        endTime: Date.now(),
        totalCost: totalCost,
      } : null);
      
      setIsLoading(false);
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    } catch (error: any) {
      setResearchSession(prev => prev ? {
        ...prev,
        steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'failed' as const } : s),
        endTime: Date.now(),
      } : null);
      setResponse(`Error: ${error.response?.data?.error || error.message}`);
      setIsLoading(false);
    }
  };

  const handleRunWorkflow = async (workflow: AgentWorkflow) => {
    // For workflows with variables, we don't necessarily need a userPrompt
    // Use a default if empty
    const workflowInput = userPrompt.trim() || 'Running workflow';
    
    setIsLoading(true);
    setAgentExecution({
      workflowId: workflow.id,
      steps: workflow.steps.map(step => ({
        stepId: step.id,
        status: 'pending',
        timestamp: Date.now(),
      })),
      startTime: Date.now(),
      totalCost: 0,
    });

    // Reset usage for new workflow
    setUsage(null);
    setResponse('');
    setCitations([]);
    setReasoningContent('');
    setToolCalls([]);
    setServerSideToolUsage({});

    try {
      // Create variable replacement map
      const variableMap: Record<string, string> = {};
      workflow.variables?.forEach((variable) => {
        variableMap[variable.name] = variable.value;
      });
      
      // Execute workflow steps sequentially
      let accumulatedOutput = '';
      let stepOutputs: Record<string, string> = {}; // Store each step's output
      let totalCost = 0;
      let aggregatedUsage = {
        promptTokens: 0,
        completionTokens: 0,
        reasoningTokens: 0,
        cachedTokens: 0,
        totalTokens: 0,
      };
      let allCitations: Array<string | { type: string; url: string }> = [];
      let allToolUsage: Record<string, number> = {};

      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        
        // Replace variables and step outputs in prompt
        let processedPrompt = step.prompt;
        
        // Replace workflow variables like {topic}, {company_search}, etc.
        Object.entries(variableMap).forEach(([varName, varValue]) => {
          const regex = new RegExp(`\\{${varName}\\}`, 'g');
          processedPrompt = processedPrompt.replace(regex, varValue);
        });
        
        // Replace step outputs like {step_1_output}, {step_2_output}, etc.
        Object.entries(stepOutputs).forEach(([stepKey, stepOutput]) => {
          const regex = new RegExp(`\\{${stepKey}\\}`, 'g');
          processedPrompt = processedPrompt.replace(regex, stepOutput);
        });
        
        // Also replace variables in step config
        let processedConfig = { ...step.config };
        Object.entries(processedConfig).forEach(([configKey, configValue]) => {
          if (typeof configValue === 'string') {
            let processedValue = configValue;
            
            // Replace workflow variables
            Object.entries(variableMap).forEach(([varName, varValue]) => {
              const regex = new RegExp(`\\{${varName}\\}`, 'g');
              processedValue = processedValue.replace(regex, varValue);
            });
            
            // Replace step outputs
            Object.entries(stepOutputs).forEach(([stepKey, stepOutput]) => {
              const regex = new RegExp(`\\{${stepKey}\\}`, 'g');
              processedValue = processedValue.replace(regex, stepOutput);
            });
            
            processedConfig[configKey] = processedValue;
          }
        });
        
        // Update step to running
        setAgentExecution(prev => prev ? {
          ...prev,
          steps: prev.steps.map((s, idx) => 
            idx === i ? { ...s, status: 'running', input: processedPrompt } : s
          ),
        } : null);

        // Determine tools for this step
        const tools: string[] = [];
        if (step.type === 'web_search') tools.push('web_search');
        else if (step.type === 'x_search') tools.push('x_search');
        else if (step.type === 'news_search') tools.push('x_search');
        else if (step.type === 'code_execution') tools.push('code_execution');
        else if (step.type === 'collections_search') tools.push('collections_search');

        // Build search parameters from processed config
        const searchParameters: any = {};
        if (step.type === 'x_search' || step.type === 'news_search') {
          // Pass all x_search config parameters
          const xSearchConfig: any = {};
          
          if (processedConfig.from_date) xSearchConfig.from_date = processedConfig.from_date;
          if (processedConfig.to_date) xSearchConfig.to_date = processedConfig.to_date;
          if (processedConfig.allowed_x_handles) xSearchConfig.allowed_x_handles = processedConfig.allowed_x_handles;
          if (processedConfig.excluded_x_handles) xSearchConfig.excluded_x_handles = processedConfig.excluded_x_handles;
          if (processedConfig.enable_image_understanding) xSearchConfig.enable_image_understanding = processedConfig.enable_image_understanding;
          if (processedConfig.enable_video_understanding) xSearchConfig.enable_video_understanding = processedConfig.enable_video_understanding;
          
          if (Object.keys(xSearchConfig).length > 0) {
            searchParameters.x_search = xSearchConfig;
          }
        }
        
        if (step.type === 'web_search') {
          // Pass all web_search config parameters
          const webSearchConfig: any = {};
          
          if (processedConfig.allowed_domains) webSearchConfig.allowed_domains = processedConfig.allowed_domains;
          if (processedConfig.excluded_domains) webSearchConfig.excluded_domains = processedConfig.excluded_domains;
          if (processedConfig.enable_image_understanding) webSearchConfig.enable_image_understanding = processedConfig.enable_image_understanding;
          
          if (Object.keys(webSearchConfig).length > 0) {
            searchParameters.web_search = webSearchConfig;
          }
        }

        // Execute step
        const response = await axios.post(`${API_BASE}/prompts`, {
          model,
          systemPrompt: `You are an AI agent executing step ${i + 1} of a workflow: ${step.label}`,
          userPrompt: processedPrompt,
          temperature,
          maxTokens: step.config.max_results ? Math.min(maxTokens, 4000) : maxTokens,
          toolsEnabled: tools.length > 0 ? tools : undefined,
          searchParameters: Object.keys(searchParameters).length > 0 ? searchParameters : undefined,
        });

        // Aggregate usage stats
        aggregatedUsage.promptTokens += response.data.promptTokens || 0;
        aggregatedUsage.completionTokens += response.data.completionTokens || 0;
        aggregatedUsage.reasoningTokens += response.data.reasoningTokens || 0;
        aggregatedUsage.cachedTokens += response.data.cachedTokens || 0;
        aggregatedUsage.totalTokens += response.data.totalTokens || 0;

        // Aggregate citations
        if (response.data.citations) {
          allCitations = [...allCitations, ...response.data.citations];
        }

        // Aggregate tool usage
        if (response.data.serverSideToolUsage) {
          Object.entries(response.data.serverSideToolUsage).forEach(([tool, count]) => {
            allToolUsage[tool] = (allToolUsage[tool] || 0) + (count as number);
          });
        }

        const stepCost = calculateCost(
          response.data.promptTokens,
          response.data.completionTokens,
          response.data.reasoningTokens || 0,
          model,
          {}
        );
        totalCost += stepCost;
        accumulatedOutput += `\n\n${step.label} Result:\n${response.data.responseContent}`;
        
        // Store step output for chaining (e.g., step_1_output, step_2_output)
        stepOutputs[`step_${i + 1}_output`] = response.data.responseContent;

        // Update step to completed
        setAgentExecution(prev => prev ? {
          ...prev,
          steps: prev.steps.map((s, idx) => 
            idx === i ? { 
              ...s, 
              status: 'completed',
              output: response.data.responseContent,
              cost: stepCost,
            } : s
          ),
          totalCost: totalCost,
        } : null);

        // Update aggregated stats after each step
        setUsage(aggregatedUsage);
        setCitations(allCitations);
        setServerSideToolUsage(allToolUsage);
        setResponse(accumulatedOutput);
      }

      // Mark as complete
      setAgentExecution(prev => prev ? {
        ...prev,
        endTime: Date.now(),
        totalCost: totalCost,
      } : null);
      
      setIsLoading(false);
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    } catch (error: any) {
      setAgentExecution(prev => prev ? {
        ...prev,
        steps: prev.steps.map(s => s.status === 'running' ? { ...s, status: 'failed' } : s),
        endTime: Date.now(),
      } : null);
      setResponse(`Error: ${error.response?.data?.error || error.message}`);
      setIsLoading(false);
    }
  };

  // Calculate token costs
  const tokenCost = usage ? calculateCost(usage.promptTokens, usage.completionTokens, usage.reasoningTokens, model, {}) : 0;
  
  // Calculate tool invocation costs
  const toolInvocationCosts: Record<string, number> = {};
  let totalToolCost = 0;
  
  if (serverSideToolUsage && Object.keys(serverSideToolUsage).length > 0) {
    Object.entries(serverSideToolUsage).forEach(([toolName, count]) => {
      let costPer1000 = 0;
      if (toolName === 'file_search') {
        costPer1000 = 2.50;
      } else if (['web_search', 'x_search', 'x_user_search', 'code_execution', 'browse_page'].includes(toolName)) {
        costPer1000 = 10.00;
      }
      const cost = (count * costPer1000) / 1000;
      toolInvocationCosts[toolName] = cost;
      totalToolCost += cost;
    });
  }
  
  const totalCost = tokenCost + totalToolCost;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-950 text-gray-100' : 'bg-white text-gray-900'}`}>
      <header className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between max-w-full mx-auto">
          <h1 className="text-2xl font-bold">⚡ ThreatPulse   -   Created by @Tech</h1>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>
      <div className="h-[calc(100vh-73px)]">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15} maxSize={35}>
            <aside className="h-full border-r border-gray-800 overflow-y-auto">
              <div className="flex border-b border-gray-800">
                <button onClick={() => setShowTestCases(false)} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${!showTestCases ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'}`}>
                  <div className="flex items-center justify-center gap-2"><History size={16} /><span>History</span></div>
                </button>
                <button onClick={() => setShowTestCases(true)} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${showTestCases ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'}`}>
                  <div className="flex items-center justify-center gap-2"><Beaker size={16} /><span>Tests</span></div>
                </button>
              </div>
              {showTestCases ? (
                <TestCasesPanel onLoadTestCase={handleLoadTestCase} isDark={theme === 'dark'} />
              ) : (
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><History size={20} />History</h2>
                  <div className="space-y-2">
                    {prompts.map((prompt) => (
                      <div key={prompt.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedPromptId === prompt.id?.toString() ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 hover:border-gray-700'}`} onClick={() => loadPrompt(prompt)}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs text-gray-400">{prompt.timestamp ? new Date(prompt.timestamp).toLocaleString() : 'Unknown'}</span>
                          <button onClick={(e) => { e.stopPropagation(); if (prompt.id) deletePromptMutation.mutate(prompt.id.toString()); }} className="text-gray-500 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                        <p className="text-sm font-medium mb-1">{prompt.model}</p>
                        <p className="text-xs text-gray-400 line-clamp-2">{truncateText(prompt.userPrompt || prompt.user_prompt || '', 100)}</p>
                        {prompt.error && <span className="text-xs text-red-500">Error</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </Panel>
          <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-500 transition-colors" />
          <Panel defaultSize={40} minSize={30}>
            <div className="h-full overflow-y-auto p-6 border-r border-gray-800">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Mode Selector */}
                <ModeSelector currentMode={currentMode} onModeChange={handleModeChange} />
                
                {/* Preset Templates Button */}
                {(currentMode === 'research' || currentMode === 'agent') && (
                  <button
                    onClick={() => setShowPresetPicker(true)}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Sparkles size={18} />
                    Load Preset Template
                  </button>
                )}

                {/* Standard Mode Interface */}
                {currentMode === 'standard' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">System Prompt</label>
                  <TextareaAutosize value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="w-full p-3 rounded-lg border border-gray-800 bg-gray-900" minRows={2} placeholder="You are a helpful assistant..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">User Prompt</label>
                  <TextareaAutosize value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} className="w-full p-3 rounded-lg border border-gray-800 bg-gray-900" minRows={4} placeholder="Enter your prompt here..." />
                </div>

                {/* Image Upload Section */}
                <div className="border border-gray-800 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Upload size={18} />
                    Images (Vision)
                  </h3>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt="Upload" className="w-full h-20 object-cover rounded border border-gray-700" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border border-gray-800 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Sliders size={18} />Parameters</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">Model</label>
                      <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full p-2 rounded border border-gray-800 bg-gray-900">
                        {AVAILABLE_MODELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Max Tokens</label>
                      <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))} className="w-full p-2 rounded border border-gray-800 bg-gray-900" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">Temperature: {temperature}</label>
                      <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Top P: {topP}</label>
                      <input type="range" min="0" max="1" step="0.1" value={topP} onChange={(e) => setTopP(parseFloat(e.target.value))} className="w-full" />
                    </div>
                  </div>
                </div>
                <div className="border border-gray-800 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">🔧 xAI Tools</h3>
                  <div className="space-y-3">
                    {AVAILABLE_TOOLS.map(tool => (
                      <div key={tool.id}>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id={tool.id} checked={toolsEnabled.includes(tool.id)} onChange={() => toggleTool(tool.id)} className="w-4 h-4" />
                          <label htmlFor={tool.id} className="text-sm flex-1">{tool.label}</label>
                        </div>
                        
                        {/* Web Search Parameters */}
                        {tool.id === 'web_search' && toolsEnabled.includes('web_search') && (
                          <div className="ml-6 mt-2 space-y-2 bg-gray-900 p-3 rounded border border-gray-700">
                            <input
                              type="text"
                              placeholder="Allowed domains (comma-separated)"
                              value={webSearchParams.allowed_domains}
                              onChange={(e) => setWebSearchParams({...webSearchParams, allowed_domains: e.target.value})}
                              className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Excluded domains (comma-separated)"
                              value={webSearchParams.excluded_domains}
                              onChange={(e) => setWebSearchParams({...webSearchParams, excluded_domains: e.target.value})}
                              className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="web-img-understanding"
                                checked={webSearchParams.enable_image_understanding}
                                onChange={(e) => setWebSearchParams({...webSearchParams, enable_image_understanding: e.target.checked})}
                                className="w-4 h-4"
                              />
                              <label htmlFor="web-img-understanding" className="text-xs">Enable Image Understanding</label>
                            </div>
                          </div>
                        )}

                        {/* X Search Parameters */}
                        {tool.id === 'x_search' && toolsEnabled.includes('x_search') && (
                          <div className="ml-6 mt-2 space-y-2 bg-gray-900 p-3 rounded border border-gray-700">
                            <input
                              type="text"
                              placeholder="Allowed X handles (comma-separated, e.g., @elonmusk)"
                              value={xSearchParams.allowed_x_handles}
                              onChange={(e) => setXSearchParams({...xSearchParams, allowed_x_handles: e.target.value})}
                              className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Excluded X handles (comma-separated)"
                              value={xSearchParams.excluded_x_handles}
                              onChange={(e) => setXSearchParams({...xSearchParams, excluded_x_handles: e.target.value})}
                              className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                placeholder="From date"
                                value={xSearchParams.from_date}
                                onChange={(e) => setXSearchParams({...xSearchParams, from_date: e.target.value})}
                                className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                              />
                              <input
                                type="date"
                                placeholder="To date"
                                value={xSearchParams.to_date}
                                onChange={(e) => setXSearchParams({...xSearchParams, to_date: e.target.value})}
                                className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="x-img-understanding"
                                checked={xSearchParams.enable_image_understanding}
                                onChange={(e) => setXSearchParams({...xSearchParams, enable_image_understanding: e.target.checked})}
                                className="w-4 h-4"
                              />
                              <label htmlFor="x-img-understanding" className="text-xs">Enable Image Understanding</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="x-video-understanding"
                                checked={xSearchParams.enable_video_understanding}
                                onChange={(e) => setXSearchParams({...xSearchParams, enable_video_understanding: e.target.checked})}
                                className="w-4 h-4"
                              />
                              <label htmlFor="x-video-understanding" className="text-xs">Enable Video Understanding</label>
                            </div>
                          </div>
                        )}

                        {/* Collections Search Parameters */}
                        {tool.id === 'collections_search' && toolsEnabled.includes('collections_search') && (
                          <div className="ml-6 mt-2 bg-gray-900 p-3 rounded border border-gray-700">
                            <input
                              type="text"
                              placeholder="Collection IDs (comma-separated)"
                              value={collectionsSearchParams.collection_ids}
                              onChange={(e) => setCollectionsSearchParams({collection_ids: e.target.value})}
                              className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Function Calling */}
                <div className="border border-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Code size={18} />
                      Function Calling
                    </h3>
                    <button
                      onClick={() => setShowFunctionBuilder(!showFunctionBuilder)}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Function
                    </button>
                  </div>
                  
                  {showFunctionBuilder && (
                    <div className="bg-gray-900 p-3 rounded space-y-2">
                      <p className="text-xs text-gray-400">Add a custom function (JSON format):</p>
                      <TextareaAutosize
                        placeholder='{"name": "get_weather", "description": "Get weather", "parameters": {...}}'
                        className="w-full p-2 rounded border border-gray-700 bg-gray-800 font-mono text-xs"
                        minRows={3}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            try {
                              const func = JSON.parse(e.currentTarget.value);
                              setFunctions([...functions, func]);
                              e.currentTarget.value = '';
                              setShowFunctionBuilder(false);
                            } catch (err) {
                              alert('Invalid JSON');
                            }
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500">Press Ctrl+Enter to add</p>
                    </div>
                  )}
                  
                  {functions.length > 0 && (
                    <div className="space-y-2">
                      {functions.map((func, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-900 p-2 rounded">
                          <span className="text-sm font-mono">{func.name}</span>
                          <button
                            onClick={() => setFunctions(functions.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Advanced Options */}
                <div className="border border-gray-800 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">⚙️ Advanced Options</h3>
                  
                  {/* Reasoning Effort (for mini models) */}
                  {model.includes('mini') && (
                    <div>
                      <label className="block text-sm mb-2">🧠 Reasoning Effort</label>
                      <select
                        value={reasoningEffort || 'none'}
                        onChange={(e) => setReasoningEffort(e.target.value === 'none' ? undefined : e.target.value as 'low' | 'high')}
                        className="w-full p-2 rounded border border-gray-800 bg-gray-900"
                      >
                        <option value="none">None</option>
                        <option value="low">Low (faster)</option>
                        <option value="high">High (deeper thinking)</option>
                      </select>
                    </div>
                  )}

                  {/* Streaming Toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="streaming"
                      checked={useStreaming}
                      onChange={(e) => setUseStreaming(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="streaming" className="text-sm">⚡ Enable Streaming</label>
                  </div>
                </div>
                    <button onClick={handleSubmit} disabled={isLoading || !userPrompt.trim()} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-medium flex items-center justify-center gap-2">
                      <Send size={18} />
                      {isLoading ? 'Generating...' : 'Send'}
                    </button>
                  </>
                )}

                {/* Research Mode Interface */}
                {currentMode === 'research' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Research Question</label>
                      <TextareaAutosize
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-800 bg-gray-900"
                        minRows={3}
                        placeholder="Enter your research question here..."
                      />
                    </div>

                    {/* Tools Configuration for Research Mode */}
                    <div className="border border-gray-800 rounded-lg p-4 space-y-3 mb-4">
                      <h3 className="font-semibold">🔧 Research Tools</h3>
                      <div className="space-y-3">
                        {AVAILABLE_TOOLS.filter(t => ['web_search', 'x_search', 'collections_search'].includes(t.id)).map(tool => (
                          <div key={tool.id}>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id={`research-${tool.id}`} checked={toolsEnabled.includes(tool.id)} onChange={() => toggleTool(tool.id)} className="w-4 h-4" />
                              <label htmlFor={`research-${tool.id}`} className="text-sm flex-1">{tool.label}</label>
                            </div>
                            
                            {/* Web Search Parameters */}
                            {tool.id === 'web_search' && toolsEnabled.includes('web_search') && (
                              <div className="ml-6 mt-2 space-y-2 bg-gray-900 p-3 rounded border border-gray-700">
                                <input
                                  type="text"
                                  placeholder="Allowed domains (comma-separated)"
                                  value={webSearchParams.allowed_domains}
                                  onChange={(e) => setWebSearchParams({...webSearchParams, allowed_domains: e.target.value})}
                                  className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="Excluded domains (comma-separated)"
                                  value={webSearchParams.excluded_domains}
                                  onChange={(e) => setWebSearchParams({...webSearchParams, excluded_domains: e.target.value})}
                                  className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                />
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="research-web-img"
                                    checked={webSearchParams.enable_image_understanding}
                                    onChange={(e) => setWebSearchParams({...webSearchParams, enable_image_understanding: e.target.checked})}
                                    className="w-4 h-4"
                                  />
                                  <label htmlFor="research-web-img" className="text-xs">Enable Image Understanding</label>
                                </div>
                              </div>
                            )}

                            {/* X Search Parameters */}
                            {tool.id === 'x_search' && toolsEnabled.includes('x_search') && (
                              <div className="ml-6 mt-2 space-y-2 bg-gray-900 p-3 rounded border border-gray-700">
                                <input
                                  type="text"
                                  placeholder="Allowed X handles (comma-separated, e.g., @elonmusk)"
                                  value={xSearchParams.allowed_x_handles}
                                  onChange={(e) => setXSearchParams({...xSearchParams, allowed_x_handles: e.target.value})}
                                  className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="Excluded X handles (comma-separated)"
                                  value={xSearchParams.excluded_x_handles}
                                  onChange={(e) => setXSearchParams({...xSearchParams, excluded_x_handles: e.target.value})}
                                  className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="date"
                                    placeholder="From date"
                                    value={xSearchParams.from_date}
                                    onChange={(e) => setXSearchParams({...xSearchParams, from_date: e.target.value})}
                                    className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                  />
                                  <input
                                    type="date"
                                    placeholder="To date"
                                    value={xSearchParams.to_date}
                                    onChange={(e) => setXSearchParams({...xSearchParams, to_date: e.target.value})}
                                    className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="research-x-img"
                                    checked={xSearchParams.enable_image_understanding}
                                    onChange={(e) => setXSearchParams({...xSearchParams, enable_image_understanding: e.target.checked})}
                                    className="w-4 h-4"
                                  />
                                  <label htmlFor="research-x-img" className="text-xs">Enable Image Understanding</label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="research-x-video"
                                    checked={xSearchParams.enable_video_understanding}
                                    onChange={(e) => setXSearchParams({...xSearchParams, enable_video_understanding: e.target.checked})}
                                    className="w-4 h-4"
                                  />
                                  <label htmlFor="research-x-video" className="text-xs">Enable Video Understanding</label>
                                </div>
                              </div>
                            )}

                            {/* Collections Search Parameters */}
                            {tool.id === 'collections_search' && toolsEnabled.includes('collections_search') && (
                              <div className="ml-6 mt-2 bg-gray-900 p-3 rounded border border-gray-700">
                                <input
                                  type="text"
                                  placeholder="Collection IDs (comma-separated)"
                                  value={collectionsSearchParams.collection_ids}
                                  onChange={(e) => setCollectionsSearchParams({collection_ids: e.target.value})}
                                  className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleStartResearch}
                      disabled={isLoading || !userPrompt.trim()}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      {isLoading ? 'Researching...' : 'Start Research'}
                    </button>
                  </>
                )}

                {/* Agent Builder Interface */}
                {currentMode === 'agent' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Agent Input</label>
                      <TextareaAutosize
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-800 bg-gray-900"
                        minRows={3}
                        placeholder="Enter the input for your agent workflow..."
                      />
                    </div>

                    {/* Tools Configuration for Agent Mode */}
                    <div className="border border-gray-800 rounded-lg p-4 space-y-3 mb-4">
                      <h3 className="font-semibold">🔧 Available Tools</h3>
                      <div className="space-y-3">
                        {AVAILABLE_TOOLS.map(tool => (
                          <div key={tool.id}>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id={`agent-${tool.id}`} checked={toolsEnabled.includes(tool.id)} onChange={() => toggleTool(tool.id)} className="w-4 h-4" />
                              <label htmlFor={`agent-${tool.id}`} className="text-sm flex-1">{tool.label}</label>
                            </div>
                            
                            {/* Web Search Parameters */}
                            {tool.id === 'web_search' && toolsEnabled.includes('web_search') && (
                              <div className="ml-6 mt-2 space-y-2 bg-gray-900 p-3 rounded border border-gray-700">
                                <input
                                  type="text"
                                  placeholder="Allowed domains (comma-separated)"
                                  value={webSearchParams.allowed_domains}
                                  onChange={(e) => setWebSearchParams({...webSearchParams, allowed_domains: e.target.value})}
                                  className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="Excluded domains (comma-separated)"
                                  value={webSearchParams.excluded_domains}
                                  onChange={(e) => setWebSearchParams({...webSearchParams, excluded_domains: e.target.value})}
                                  className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                />
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="agent-web-img"
                                    checked={webSearchParams.enable_image_understanding}
                                    onChange={(e) => setWebSearchParams({...webSearchParams, enable_image_understanding: e.target.checked})}
                                    className="w-4 h-4"
                                  />
                                  <label htmlFor="agent-web-img" className="text-xs">Enable Image Understanding</label>
                                </div>
                              </div>
                            )}

                            {/* X Search Parameters */}
                            {tool.id === 'x_search' && toolsEnabled.includes('x_search') && (
                              <div className="ml-6 mt-2 space-y-2 bg-gray-900 p-3 rounded border border-gray-700">
                                <input
                                  type="text"
                                  placeholder="Allowed X handles (comma-separated, e.g., @elonmusk)"
                                  value={xSearchParams.allowed_x_handles}
                                  onChange={(e) => setXSearchParams({...xSearchParams, allowed_x_handles: e.target.value})}
                                  className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="Excluded X handles (comma-separated)"
                                  value={xSearchParams.excluded_x_handles}
                                  onChange={(e) => setXSearchParams({...xSearchParams, excluded_x_handles: e.target.value})}
                                  className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="date"
                                    placeholder="From date"
                                    value={xSearchParams.from_date}
                                    onChange={(e) => setXSearchParams({...xSearchParams, from_date: e.target.value})}
                                    className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                  />
                                  <input
                                    type="date"
                                    placeholder="To date"
                                    value={xSearchParams.to_date}
                                    onChange={(e) => setXSearchParams({...xSearchParams, to_date: e.target.value})}
                                    className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="agent-x-img"
                                    checked={xSearchParams.enable_image_understanding}
                                    onChange={(e) => setXSearchParams({...xSearchParams, enable_image_understanding: e.target.checked})}
                                    className="w-4 h-4"
                                  />
                                  <label htmlFor="agent-x-img" className="text-xs">Enable Image Understanding</label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="agent-x-video"
                                    checked={xSearchParams.enable_video_understanding}
                                    onChange={(e) => setXSearchParams({...xSearchParams, enable_video_understanding: e.target.checked})}
                                    className="w-4 h-4"
                                  />
                                  <label htmlFor="agent-x-video" className="text-xs">Enable Video Understanding</label>
                                </div>
                              </div>
                            )}

                            {/* Collections Search Parameters */}
                            {tool.id === 'collections_search' && toolsEnabled.includes('collections_search') && (
                              <div className="ml-6 mt-2 bg-gray-900 p-3 rounded border border-gray-700">
                                <input
                                  type="text"
                                  placeholder="Collection IDs (comma-separated)"
                                  value={collectionsSearchParams.collection_ids}
                                  onChange={(e) => setCollectionsSearchParams({collection_ids: e.target.value})}
                                  className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-xs"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Panel>
          <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-500 transition-colors" />
          <Panel defaultSize={40} minSize={30}>
            <div className="h-full flex flex-col bg-gray-900/50">
              {/* Mode-specific content in right panel */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto">
                  {currentMode === 'standard' && (
                    <>
                      {(response || citations.length > 0 || reasoningContent || toolCalls.length > 0 || rawRequest) && (
                        <div className="border-b border-gray-800 flex gap-1 mb-4 overflow-x-auto">
                          <button onClick={() => setResponseTab('response')} className={`px-4 py-2 rounded-t-lg text-sm whitespace-nowrap ${responseTab === 'response' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>Response</button>
                          {reasoningContent && <button onClick={() => setResponseTab('reasoning')} className={`px-4 py-2 rounded-t-lg text-sm whitespace-nowrap ${responseTab === 'reasoning' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>🧠 Reasoning</button>}
                          {toolCalls.length > 0 && <button onClick={() => setResponseTab('tools')} className={`px-4 py-2 rounded-t-lg text-sm whitespace-nowrap ${responseTab === 'tools' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>🔧 Tools</button>}
                          {citations.length > 0 && <button onClick={() => setResponseTab('citations')} className={`px-4 py-2 rounded-t-lg text-sm whitespace-nowrap ${responseTab === 'citations' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>📚 Citations</button>}
                          {rawRequest && <button onClick={() => setResponseTab('request')} className={`px-4 py-2 rounded-t-lg text-sm whitespace-nowrap ${responseTab === 'request' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>📝 Request</button>}
                          {rawResponse && <button onClick={() => setResponseTab('raw-response')} className={`px-4 py-2 rounded-t-lg text-sm whitespace-nowrap ${responseTab === 'raw-response' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>📄 Raw Response</button>}
                        </div>
                      )}
                      {response || isLoading ? (
                        <div>
                          {isLoading && <div className="text-blue-400">Loading...</div>}
                          {responseTab === 'response' && response && <div className="prose prose-invert max-w-none"><ReactMarkdown>{response}</ReactMarkdown></div>}
                          {responseTab === 'reasoning' && reasoningContent && (
                            <div className="bg-purple-950/30 border border-purple-700 rounded-lg p-4">
                              <h3 className="text-purple-300 font-semibold mb-2">💭 Reasoning</h3>
                              <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{reasoningContent}</ReactMarkdown></div>
                            </div>
                          )}
                          {responseTab === 'tools' && toolCalls.length > 0 && (
                            <div className="space-y-3">
                              {toolCalls.map((call, idx) => (
                                <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                  <span className="text-blue-400 font-mono text-sm">{call.function.name}</span>
                                  <pre className="bg-gray-950 p-3 rounded text-xs mt-2">{JSON.stringify(JSON.parse(call.function.arguments), null, 2)}</pre>
                                </div>
                              ))}
                            </div>
                          )}
                          {responseTab === 'citations' && citations.length > 0 && (
                            <div className="space-y-3">
                              <h3 className="text-gray-300 font-semibold mb-3">📚 Sources ({citations.length})</h3>
                              {citations.map((citation, idx) => {
                                // Citations can be objects with {type, url} or plain strings
                                const citationUrl: string = typeof citation === 'object' && 'url' in citation
                                  ? citation.url 
                                  : String(citation);
                                
                                return (
                                  <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-blue-500 transition-colors">
                                    <div className="flex items-start gap-2">
                                      <span className="text-blue-400 font-mono text-xs mt-1">[{idx + 1}]</span>
                                      <a 
                                        href={citationUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-400 text-sm break-all hover:text-blue-300 flex-1"
                                      >
                                        {citationUrl}
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {responseTab === 'request' && rawRequest && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-gray-300 font-semibold">📝 Request JSON</h3>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const updated = generateRawRequest();
                                      setRawRequest(updated);
                                    }}
                                    className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                                  >
                                    ↻ Sync from UI
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(JSON.stringify(rawRequest, null, 2));
                                    }}
                                    className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                              {requestJsonError && (
                                <div className="mb-3 p-2 bg-red-900/30 border border-red-700 rounded text-xs text-red-300">
                                  ⚠️ {requestJsonError}
                                </div>
                              )}
                              <TextareaAutosize
                                value={JSON.stringify(rawRequest, null, 2)}
                                onChange={(e) => {
                                  try {
                                    const parsed = JSON.parse(e.target.value);
                                    setRawRequest(parsed);
                                    setRequestJsonError('');
                                  } catch (err: any) {
                                    setRawRequest(e.target.value);
                                    setRequestJsonError(err.message);
                                  }
                                }}
                                onBlur={(e) => {
                                  // On blur, try to apply to UI
                                  applyRawRequest(e.target.value);
                                }}
                                className="w-full p-4 rounded-lg border border-gray-700 bg-gray-950 font-mono text-xs"
                                minRows={15}
                              />
                              <p className="text-xs text-gray-500 mt-2">
                                💡 Edit and click away to sync changes to UI controls
                              </p>
                            </div>
                          )}
                          {responseTab === 'raw-response' && rawResponse && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-gray-300 font-semibold">📄 Raw Response JSON</h3>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(rawResponse, null, 2));
                                  }}
                                  className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                                >
                                  Copy
                                </button>
                              </div>
                              <pre className="w-full p-4 rounded-lg border border-gray-700 bg-gray-950 font-mono text-xs overflow-x-auto">
                                {JSON.stringify(rawResponse, null, 2)}
                              </pre>
                              <p className="text-xs text-gray-500 mt-2">
                                💡 Read-only view of complete API response
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <div className="text-6xl mb-4">💬</div>
                            <p>Response will appear here</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {currentMode === 'research' && (
                    <ResearchMode
                      question={userPrompt}
                      onStartResearch={handleStartResearch}
                      isLoading={isLoading}
                      session={researchSession}
                      isDark={theme === 'dark'}
                    />
                  )}
                  
                  {currentMode === 'agent' && (
                    <AgentBuilder
                      onRunWorkflow={handleRunWorkflow}
                      execution={agentExecution}
                      isRunning={isLoading}
                      isDark={theme === 'dark'}
                    />
                  )}
                  
                  {currentMode === 'threat' && (
                    <LiveThreatMode />
                  )}
                  
                  {currentMode === 'rl_threat' && (
                    <RLThreatIntelligence />
                  )}
                </div>
              </div>
              {usage && (
                <div className="border-t border-gray-800 p-4 bg-gray-900/80">
                  <div className="max-w-3xl mx-auto space-y-3">
                    {/* Token Usage */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div><span className="text-gray-400">Prompt:</span><span className="ml-2 font-mono">{formatTokens(usage.promptTokens)}</span></div>
                      <div><span className="text-gray-400">Completion:</span><span className="ml-2 font-mono">{formatTokens(usage.completionTokens)}</span></div>
                      {usage.reasoningTokens > 0 && <div><span className="text-purple-400">Reasoning:</span><span className="ml-2 font-mono">{formatTokens(usage.reasoningTokens)}</span></div>}
                      <div><span className="text-gray-400">Total:</span><span className="ml-2 font-mono">{formatTokens(usage.totalTokens)}</span></div>
                    </div>
                    
                    {/* Tool Invocations */}
                    {serverSideToolUsage && Object.keys(serverSideToolUsage).length > 0 && (
                      <div className="border-t border-gray-700 pt-3">
                        <div className="text-sm font-semibold mb-2 text-blue-400">🔧 Tool Invocations</div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(serverSideToolUsage).map(([toolName, count]) => (
                            <div key={toolName} className="flex justify-between text-xs bg-gray-800 px-2 py-1 rounded">
                              <span className="text-gray-300">{toolName}:</span>
                              <span className="font-mono text-blue-400">{count}x</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Cost Breakdown */}
                    <div className="border-t border-gray-700 pt-3">
                      <div className="text-sm font-semibold mb-2">💰 Cost Breakdown</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Token Cost:</span>
                          <span className="font-mono text-green-400">{formatCost(tokenCost)}</span>
                        </div>
                        {totalToolCost > 0 && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Tool Invocations:</span>
                              <span className="font-mono text-yellow-400">{formatCost(totalToolCost)}</span>
                            </div>
                            {Object.entries(toolInvocationCosts).map(([tool, cost]) => (
                              <div key={tool} className="flex justify-between ml-4 text-gray-500">
                                <span>{tool}:</span>
                                <span className="font-mono">{formatCost(cost)}</span>
                              </div>
                            ))}
                          </>
                        )}
                        <div className="flex justify-between font-semibold pt-1 border-t border-gray-700">
                          <span className="text-gray-300">Total Cost:</span>
                          <span className="font-mono text-green-400">{formatCost(totalCost)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
      
      {/* Preset Picker Modal */}
      {showPresetPicker && (
        <PresetPicker
          onSelectPreset={handleSelectPreset}
          onClose={() => setShowPresetPicker(false)}
          currentMode={currentMode}
          isDark={theme === 'dark'}
        />
      )}
    </div>
  );
}
