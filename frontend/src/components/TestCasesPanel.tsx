import React, { useState } from 'react';
import { TEST_CASES, TEST_CATEGORIES, TestCase } from '../data/testCases';
import { Beaker, ChevronDown, ChevronRight, Play } from 'lucide-react';

interface TestCasesPanelProps {
  onLoadTestCase: (testCase: TestCase) => void;
  isDark: boolean;
}

export const TestCasesPanel: React.FC<TestCasesPanelProps> = ({ onLoadTestCase, isDark }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const filteredTestCases = selectedCategory === 'all' 
    ? TEST_CASES 
    : TEST_CASES.filter(tc => tc.category === selectedCategory);

  const getCategoryColor = (category: TestCase['category']) => {
    const colors: Record<TestCase['category'], string> = {
      'basic': 'bg-gray-500',
      'function-calling': 'bg-blue-500',
      'web-search': 'bg-green-500',
      'x-search': 'bg-cyan-500',
      'code-execution': 'bg-emerald-500',
      'collections': 'bg-violet-500',
      'image-upload': 'bg-purple-500',
      'reasoning-mode': 'bg-orange-500',
      'agentic': 'bg-pink-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Beaker className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Test Cases</h2>
        </div>
        
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={`w-full px-3 py-2 rounded border ${
            isDark 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          {TEST_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        <div className="mt-2 text-sm text-gray-500">
          {filteredTestCases.length} test case{filteredTestCases.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Test Cases List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTestCases.map((testCase) => {
          const isExpanded = expandedCase === testCase.id;
          
          return (
            <div
              key={testCase.id}
              className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
            >
              {/* Test Case Header */}
              <button
                onClick={() => setExpandedCase(isExpanded ? null : testCase.id)}
                className={`w-full p-4 text-left hover:bg-opacity-50 transition-colors ${
                  isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 mt-1 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(testCase.category)} text-white`}>
                        {testCase.category}
                      </span>
                      <h3 className="font-medium">{testCase.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{testCase.description}</p>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className={`px-4 pb-4 space-y-3 ${isDark ? 'bg-gray-800 bg-opacity-50' : 'bg-gray-50'}`}>
                  {/* System Prompt */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      System Prompt
                    </label>
                    <div className={`p-2 rounded text-sm font-mono ${
                      isDark ? 'bg-gray-900' : 'bg-white border border-gray-200'
                    }`}>
                      {testCase.systemPrompt}
                    </div>
                  </div>

                  {/* User Prompt */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      User Prompt
                    </label>
                    <div className={`p-2 rounded text-sm font-mono ${
                      isDark ? 'bg-gray-900' : 'bg-white border border-gray-200'
                    }`}>
                      {testCase.userPrompt}
                    </div>
                  </div>

                  {/* Expected Behavior */}
                  <div>
                    <label className="block text-xs font-medium text-green-600 mb-1">
                      ✓ Expected Behavior
                    </label>
                    <div className={`p-3 rounded text-sm ${
                      isDark ? 'bg-green-900 bg-opacity-20 border border-green-800' : 'bg-green-50 border border-green-200'
                    }`}>
                      {testCase.expectedBehavior}
                    </div>
                  </div>

                  {/* Required Settings */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Required Settings
                    </label>
                    <div className={`p-2 rounded text-sm ${
                      isDark ? 'bg-gray-900' : 'bg-white border border-gray-200'
                    }`}>
                      <ul className="space-y-1">
                        {testCase.requiredSettings.model && (
                          <li><strong>Model:</strong> {testCase.requiredSettings.model}</li>
                        )}
                        {testCase.requiredSettings.temperature !== undefined && (
                          <li><strong>Temperature:</strong> {testCase.requiredSettings.temperature}</li>
                        )}
                        {testCase.requiredSettings.maxTokens && (
                          <li><strong>Max Tokens:</strong> {testCase.requiredSettings.maxTokens}</li>
                        )}
                        {testCase.requiredSettings.enableReasoning && (
                          <li><strong>Reasoning:</strong> Enabled</li>
                        )}
                        {testCase.requiredSettings.functions && (
                          <li><strong>Functions:</strong> {testCase.requiredSettings.functions.join(', ')}</li>
                        )}
                        {testCase.requiredSettings.searchEnabled && (
                          <li><strong>Web Search:</strong> Enabled</li>
                        )}
                        {testCase.requiredSettings.toolsEnabled && testCase.requiredSettings.toolsEnabled.length > 0 && (
                          <li><strong>Agentic Tools:</strong> {testCase.requiredSettings.toolsEnabled.join(', ')}</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Load Button */}
                  <button
                    onClick={() => {
                      onLoadTestCase(testCase);
                      setExpandedCase(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Load This Test Case
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
