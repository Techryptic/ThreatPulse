export interface TestCase {
  id: string;
  category: 'function-calling' | 'web-search' | 'x-search' | 'code-execution' | 'collections' | 'image-upload' | 'reasoning-mode' | 'basic' | 'agentic' | 'threat_streaming';
  title: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  expectedBehavior: string;
  requiredSettings: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    enableReasoning?: boolean;
    functions?: string[];
    searchEnabled?: boolean;
    toolsEnabled?: string[];
    streamConfig?: {
      type: string;
      keywords: string[];
      accounts: string[];
    };
  };
  tags?: string[];
  difficulty?: 'basic' | 'intermediate' | 'advanced';
}

export const TEST_CASES: TestCase[] = [
  // BASIC TESTS
  {
    id: 'basic-1',
    category: 'basic',
    title: 'Simple Conversation',
    description: 'Test basic chat functionality without special features',
    systemPrompt: 'You are a helpful AI assistant.',
    userPrompt: 'What is the capital of France?',
    expectedBehavior: 'Should respond with "Paris" and provide additional context about the city.',
    requiredSettings: {
      model: 'grok-2-latest',
      temperature: 0.7
    }
  },
  {
    id: 'basic-2',
    category: 'basic',
    title: 'Code Generation',
    description: 'Test basic code generation capabilities',
    systemPrompt: 'You are an expert programmer.',
    userPrompt: 'Write a Python function to calculate the factorial of a number.',
    expectedBehavior: 'Should generate a complete Python function with proper error handling.',
    requiredSettings: {
      model: 'grok-2-latest',
      temperature: 0.3
    }
  },
  
  // FUNCTION CALLING TESTS
  {
    id: 'function-1',
    category: 'function-calling',
    title: 'Calculator Function',
    description: 'Test mathematical calculation via function calling',
    systemPrompt: 'You are a helpful assistant with access to a calculator.',
    userPrompt: 'Calculate 1234 multiplied by 5678. You MUST use the calculate function even though you can do the math yourself.',
    expectedBehavior: 'Should call calculate() function with operation="multiply", x=1234, y=5678. Blue "Tool Calls" box should appear. Result: 7,006,652',
    requiredSettings: {
      model: 'grok-2-latest',
      functions: ['calculator']
    }
  },
  {
    id: 'function-2',
    category: 'function-calling',
    title: 'Weather Function',
    description: 'Test weather lookup via function calling',
    systemPrompt: 'You are a weather assistant. Always use the get_weather function to check weather.',
    userPrompt: 'What\'s the weather like in Tokyo?',
    expectedBehavior: 'Should call get_weather() function with city="Tokyo". Blue "Tool Calls" box should appear showing the function call.',
    requiredSettings: {
      model: 'grok-2-latest',
      functions: ['weather']
    }
  },
  {
    id: 'function-3',
    category: 'function-calling',
    title: 'Current Time Function',
    description: 'Test time retrieval via function calling',
    systemPrompt: 'You are a helpful assistant. Use the get_current_time function when asked about the time.',
    userPrompt: 'What time is it right now?',
    expectedBehavior: 'Should call get_current_time() function. Blue "Tool Calls" box should appear. Returns ISO timestamp.',
    requiredSettings: {
      model: 'grok-2-latest',
      functions: ['time']
    }
  },
  {
    id: 'function-4',
    category: 'function-calling',
    title: 'Multiple Functions',
    description: 'Test AI choosing the right function from multiple options',
    systemPrompt: 'You have access to calculator, weather, and time functions. Use them when appropriate.',
    userPrompt: 'Add 150 and 275, then tell me the weather in Paris',
    expectedBehavior: 'Should make TWO function calls: calculate(operation="add", x=150, y=275), then get_weather(city="Paris"). Blue boxes for both.',
    requiredSettings: {
      model: 'grok-2-latest',
      functions: ['calculator', 'weather', 'time']
    }
  },

  // WEB SEARCH TESTS
  {
    id: 'search-1',
    category: 'web-search',
    title: 'Current Events Search',
    description: 'Test real-time web search for current information',
    systemPrompt: 'You are a helpful assistant with access to real-time web search.',
    userPrompt: 'What are the latest developments in AI technology this week?',
    expectedBehavior: 'Should enable web search. Response includes citations/sources. Look for numbered references [1], [2], etc.',
    requiredSettings: {
      model: 'grok-2-latest',
      searchEnabled: true
    }
  },
  {
    id: 'search-2',
    category: 'web-search',
    title: 'Fact Verification',
    description: 'Test web search for fact-checking',
    systemPrompt: 'You verify facts using web search.',
    userPrompt: 'What is the current population of Japan?',
    expectedBehavior: 'Should search the web and provide current population data with sources.',
    requiredSettings: {
      model: 'grok-2-latest',
      searchEnabled: true
    }
  },
  {
    id: 'search-3',
    category: 'web-search',
    title: 'Search + Citations',
    description: 'Test citation format in search results',
    systemPrompt: 'Always cite your sources when using web search.',
    userPrompt: 'Tell me about the history of the Eiffel Tower',
    expectedBehavior: 'Response should include citations in brackets like [1], [2]. Citations section shows sources used.',
    requiredSettings: {
      model: 'grok-2-latest',
      searchEnabled: true
    }
  },

  // IMAGE UPLOAD TESTS
  {
    id: 'image-1',
    category: 'image-upload',
    title: 'Single Image Analysis',
    description: 'Test single image description',
    systemPrompt: 'You are an image analysis expert.',
    userPrompt: 'Describe what you see in this image in detail.',
    expectedBehavior: 'Upload an image using the paperclip icon. AI should describe the image contents.',
    requiredSettings: {
      model: 'grok-2-vision-1212'
    }
  },
  {
    id: 'image-2',
    category: 'image-upload',
    title: 'Compare Multiple Images',
    description: 'Test multi-image comparison',
    systemPrompt: 'You are an image comparison expert.',
    userPrompt: 'Compare these two images and tell me the differences.',
    expectedBehavior: 'Upload 2+ images. AI should identify similarities and differences between them.',
    requiredSettings: {
      model: 'grok-2-vision-1212'
    }
  },
  {
    id: 'image-3',
    category: 'image-upload',
    title: 'OCR Text Extraction',
    description: 'Test text recognition in images',
    systemPrompt: 'Extract and transcribe all text from images.',
    userPrompt: 'Read all the text you can see in this image.',
    expectedBehavior: 'Upload image with text (screenshot, document, sign, etc.). AI should extract visible text.',
    requiredSettings: {
      model: 'grok-2-vision-1212'
    }
  },

  // REASONING MODE TESTS
  {
    id: 'reasoning-1',
    category: 'reasoning-mode',
    title: 'Complex Problem Solving',
    description: 'Test extended reasoning for difficult problems',
    systemPrompt: 'Think step-by-step through complex problems.',
    userPrompt: 'If you have 3 boxes and you put 4 balls in each box, but then take 2 balls out of the first box and add them to the third box, and then divide all balls equally among the 3 boxes, how many balls are in each box?',
    expectedBehavior: 'With grok-3 + reasoning: Shows thinking preview in gray box. With grok-3-mini: Full reasoning chain visible.',
    requiredSettings: {
      model: 'grok-beta',
      enableReasoning: true
    }
  },
  {
    id: 'reasoning-2',
    category: 'reasoning-mode',
    title: 'Logic Puzzle',
    description: 'Test reasoning with logic puzzles',
    systemPrompt: 'Solve logic puzzles step by step.',
    userPrompt: 'Alice is taller than Bob. Bob is taller than Charlie. Who is the shortest?',
    expectedBehavior: 'Should show reasoning process. Answer: Charlie is the shortest.',
    requiredSettings: {
      model: 'grok-beta',
      enableReasoning: true
    }
  },
  {
    id: 'reasoning-3',
    category: 'reasoning-mode',
    title: 'Mini Model Full Reasoning',
    description: 'Test grok-3-mini raw reasoning output',
    systemPrompt: 'Think through problems carefully.',
    userPrompt: 'What is 25% of 880?',
    expectedBehavior: 'With grok-3-mini: Shows full <thinking> tags. With grok-3: Shows preview only.',
    requiredSettings: {
      model: 'grok-beta',
      enableReasoning: true
    }
  },

  // CODE EXECUTION TESTS (xAI Unique Feature)
  {
    id: 'code-1',
    category: 'code-execution',
    title: 'Mathematical Computation',
    description: 'Test Python code execution for complex calculations',
    systemPrompt: 'You can execute Python code to solve problems.',
    userPrompt: 'Calculate the compound interest for $10,000 at 5% annual rate compounded monthly for 10 years. Show me the calculation code.',
    expectedBehavior: 'AI writes and executes Python code. Should show code block and result. Final amount ≈ $16,470.09',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['code_execution']
    }
  },
  {
    id: 'code-2',
    category: 'code-execution',
    title: 'Prime Number Generation',
    description: 'Test code execution for algorithmic tasks',
    systemPrompt: 'Execute Python code to solve computational tasks.',
    userPrompt: 'Generate the first 20 prime numbers using code.',
    expectedBehavior: 'Executes Python to find primes. Result: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71]',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['code_execution']
    }
  },
  {
    id: 'code-3',
    category: 'code-execution',
    title: 'Data Analysis',
    description: 'Test statistical analysis with Python',
    systemPrompt: 'You can use numpy and pandas for data analysis.',
    userPrompt: 'Given dataset [12, 15, 18, 22, 25, 28, 30, 35], calculate mean, median, standard deviation.',
    expectedBehavior: 'Executes Python with numpy. Mean=23.125, Median=23.5, StdDev≈7.0',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['code_execution']
    }
  },

  // WEB SEARCH TESTS (Agentic)
  {
    id: 'websearch-1',
    category: 'web-search',
    title: 'Real-Time Web Search',
    description: 'Test autonomous web search capabilities',
    systemPrompt: 'You can search the web autonomously when needed.',
    userPrompt: 'What are the latest breakthroughs in quantum computing? Include sources.',
    expectedBehavior: 'AI autonomously searches web. Green "Agentic" banner shows tool usage. Citations tab shows sources.',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['web_search']
    }
  },
  {
    id: 'websearch-2',
    category: 'web-search',
    title: 'Domain-Filtered Search',
    description: 'Test web search with domain restrictions',
    systemPrompt: 'Search only from scientific sources.',
    userPrompt: 'What is CRISPR gene editing? Search only from .edu and .gov domains.',
    expectedBehavior: 'Enable web_search, set allowed_domains to "edu,gov". Should only cite educational/government sources.',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['web_search']
    }
  },
  {
    id: 'websearch-3',
    category: 'web-search',
    title: 'Image Understanding in Search',
    description: 'Test AI analyzing images from web pages',
    systemPrompt: 'You can search the web and understand images found on pages.',
    userPrompt: 'Search for "Tesla Cybertruck" and describe what the vehicle looks like based on images you find.',
    expectedBehavior: 'Enable enable_image_understanding checkbox. AI describes vehicle based on images from search results.',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['web_search']
    }
  },

  // X SEARCH TESTS (xAI Exclusive!)
  {
    id: 'xsearch-1',
    category: 'x-search',
    title: 'X Platform Search',
    description: 'Test searching X (Twitter) posts',
    systemPrompt: 'You can search X platform for posts and discussions.',
    userPrompt: 'What are people saying about SpaceX\'s latest launch on X?',
    expectedBehavior: 'AI searches X posts. Shows real tweets/posts. Citations show X post URLs.',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['x_search']
    }
  },
  {
    id: 'xsearch-2',
    category: 'x-search',
    title: 'X Handle Filter',
    description: 'Test filtering X search by specific handles',
    systemPrompt: 'Search X posts from specific accounts.',
    userPrompt: 'What has Elon Musk posted about AI recently?',
    expectedBehavior: 'Set allowed_x_handles to "@elonmusk". AI only searches posts from that handle.',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['x_search']
    }
  },
  {
    id: 'xsearch-3',
    category: 'x-search',
    title: 'X Date Range Search',
    description: 'Test time-bounded X search',
    systemPrompt: 'Search X posts within a date range.',
    userPrompt: 'What were the trending topics on X last month?',
    expectedBehavior: 'Set from_date and to_date. AI searches X posts only within that timeframe.',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['x_search']
    }
  },
  {
    id: 'xsearch-4',
    category: 'x-search',
    title: 'X Video Understanding',
    description: 'Test AI analyzing videos from X posts',
    systemPrompt: 'You can search X and understand videos in posts.',
    userPrompt: 'Search X for SpaceX launch videos and describe what happens in them.',
    expectedBehavior: 'Enable enable_video_understanding. AI finds X posts with videos and describes content.',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['x_search']
    }
  },

  // COLLECTIONS SEARCH TESTS
  {
    id: 'collections-1',
    category: 'collections',
    title: 'RAG with Collections',
    description: 'Test retrieval from uploaded document collections',
    systemPrompt: 'Answer questions using uploaded knowledge bases.',
    userPrompt: 'Based on the uploaded documentation, explain how to use the API.',
    expectedBehavior: 'Requires pre-created collection at console.x.ai. Enter collection ID. AI retrieves relevant sections.',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['collections_search']
    }
  },
  {
    id: 'collections-2',
    category: 'collections',
    title: 'Multi-Collection Search',
    description: 'Test searching across multiple collections',
    systemPrompt: 'Search across all available knowledge bases.',
    userPrompt: 'Find all mentions of authentication in the documentation.',
    expectedBehavior: 'Enter multiple collection_ids (comma-separated). AI searches all collections. Lower cost ($2.50/1K vs $10/1K).',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['collections_search']
    }
  },

  // AGENTIC MULTI-TOOL TESTS
  {
    id: 'agentic-1',
    category: 'agentic',
    title: 'Multi-Tool Agent',
    description: 'Test AI autonomously using multiple tools',
    systemPrompt: 'You are an intelligent agent with web search, X search, and code execution.',
    userPrompt: 'Research the latest AI news from X, then calculate the average word count of the top 5 posts.',
    expectedBehavior: 'AI autonomously: (1) X searches, (2) executes Python to calculate. Green agentic banner. Tools tab shows all invocations.',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['x_search', 'code_execution']
    }
  },
  {
    id: 'agentic-2',
    category: 'agentic',
    title: 'Web + Code Pipeline',
    description: 'Test chaining web search with code execution',
    systemPrompt: 'Use web search and code execution together.',
    userPrompt: 'Search for Bitcoin price data, then write code to calculate if investing $1000 last year would be profitable today.',
    expectedBehavior: 'AI: (1) Web searches BTC price data, (2) Executes Python for ROI calculation. Multiple tool invocations visible.',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['web_search', 'code_execution']
    }
  },
  {
    id: 'agentic-3',
    category: 'agentic',
    title: 'All Tools Combined',
    description: 'Test AI using all available tools intelligently',
    systemPrompt: 'You are a super-agent with all tools: web search, X search, code execution, collections.',
    userPrompt: 'Research current AI trends from both web and X, analyze the sentiment, and calculate statistics.',
    expectedBehavior: 'AI decides which tools to use and when. May invoke multiple tools multiple times. Check Tools tab for complete chain.',
    requiredSettings: {
      model: 'grok-2-latest',
      toolsEnabled: ['web_search', 'x_search', 'code_execution']
    }
  },

  // COMBINED FEATURES TESTS
  {
    id: 'combined-1',
    category: 'function-calling',
    title: 'Function + Web Search',
    description: 'Test combining function calling with web search',
    systemPrompt: 'You have calculator and web search. Use both when needed.',
    userPrompt: 'Calculate 999 + 111, then search for recent news about AI',
    expectedBehavior: 'Should call calculate() function first, then perform web search. Shows both tool calls and search citations.',
    requiredSettings: {
      model: 'grok-2-latest',
      functions: ['calculator'],
      toolsEnabled: ['web_search']
    }
  },
  {
    id: 'combined-2',
    category: 'image-upload',
    title: 'Image + Reasoning',
    description: 'Test vision model with reasoning enabled',
    systemPrompt: 'Analyze images carefully and think step-by-step.',
    userPrompt: 'Describe this image and explain what might happen next.',
    expectedBehavior: 'Upload an image. Shows reasoning preview + detailed image analysis.',
    requiredSettings: {
      model: 'grok-2-vision-1212',
      enableReasoning: true
    }
  },
  {
    id: 'combined-3',
    category: 'agentic',
    title: 'Function + Code Execution',
    description: 'Test user-defined functions WITH server-side code execution',
    systemPrompt: 'You have access to database queries and Python execution.',
    userPrompt: 'Query the database for user signups in Jan 2024, then calculate the week-over-week growth rate using code.',
    expectedBehavior: 'AI: (1) Calls search_database function, (2) Uses code_execution to calculate stats. Demonstrates both client & server tools.',
    requiredSettings: {
      model: 'grok-2-latest',
      functions: ['database'],
      toolsEnabled: ['code_execution']
    }
  }
];

export const TEST_CATEGORIES = [
  { value: 'all', label: 'All Test Cases' },
  { value: 'basic', label: '📝 Basic Features' },
  { value: 'function-calling', label: '🔧 Function Calling' },
  { value: 'agentic', label: '🤖 Agentic Multi-Tool' },
  { value: 'code-execution', label: '💻 Code Execution' },
  { value: 'web-search', label: '🌐 Web Search' },
  { value: 'x-search', label: '𝕏 X Search' },
  { value: 'collections', label: '📚 Collections RAG' },
  { value: 'image-upload', label: '🖼️ Image Vision' },
  { value: 'reasoning-mode', label: '🧠 Reasoning Mode' },
  { value: 'threat_streaming', label: '🔴 Live Threat Streaming' }
] as const;
