import { useState } from 'react';
import { ResearchStep, ResearchSession } from '../types';
import { Search, Code, FileText, CheckCircle, Circle, AlertCircle, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResearchModeProps {
  question: string;
  onStartResearch: () => void;
  isLoading: boolean;
  session: ResearchSession | null;
  isDark: boolean;
}

export function ResearchMode({ question, onStartResearch, isLoading, session, isDark }: ResearchModeProps) {
  const getStepIcon = (type: ResearchStep['type']) => {
    switch (type) {
      case 'search': return <Search size={16} />;
      case 'code': return <Code size={16} />;
      case 'analyze': return <FileText size={16} />;
      case 'synthesize': return <FileText size={16} />;
      default: return <Circle size={16} />;
    }
  };

  const getStatusIcon = (status: ResearchStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={16} />;
      case 'running': return <Clock className="text-blue-500 animate-pulse" size={16} />;
      case 'failed': return <AlertCircle className="text-red-500" size={16} />;
      default: return <Circle className="text-gray-500" size={16} />;
    }
  };

  const getStepLabel = (type: ResearchStep['type']) => {
    switch (type) {
      case 'search': return 'Web Search';
      case 'code': return 'Code Analysis';
      case 'analyze': return 'Analyzing';
      case 'synthesize': return 'Synthesizing';
      default: return 'Processing';
    }
  };

  return (
    <div className="space-y-4">
      {/* Research Question Display */}
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className="font-semibold mb-2">🔍 Research Question:</h3>
        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{question || 'Enter a question to research...'}</p>
      </div>

      {/* Research Process Visualization */}
      {session && (
        <div className="space-y-4">
          {/* Timeline */}
          <div className="relative">
            <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
            
            <div className="space-y-4">
              {session.steps.map((step, index) => (
                <div key={step.id} className="relative pl-10">
                  <div className={`absolute left-0 top-2 p-2 rounded-full ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                  } border-2`}>
                    {getStatusIcon(step.status)}
                  </div>
                  
                  <div className={`p-4 rounded-lg border ${
                    step.status === 'running' 
                      ? 'border-blue-500 bg-blue-500/10'
                      : step.status === 'completed'
                      ? isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                      : isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-300 bg-gray-100'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStepIcon(step.type)}
                        <span className="font-semibold">{getStepLabel(step.type)}</span>
                      </div>
                      {step.cost && (
                        <span className="text-xs text-green-400 font-mono">
                          ${step.cost.toFixed(6)}
                        </span>
                      )}
                    </div>
                    
                    {step.query && (
                      <div className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Query: <span className="font-mono text-blue-400">{step.query}</span>
                      </div>
                    )}
                    
                    {step.results && step.status === 'completed' && (
                      <div className={`mt-2 p-3 rounded text-sm ${
                        isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
                      }`}>
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{step.results}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    
                    {step.status === 'running' && (
                      <div className="mt-2 text-blue-400 text-sm animate-pulse">
                        Processing...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final Synthesis */}
          {session.finalSynthesis && (
            <div className={`p-6 rounded-lg border-2 ${
              isDark ? 'border-green-700 bg-green-900/20' : 'border-green-500 bg-green-50'
            }`}>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="text-green-500" size={20} />
                Research Complete
              </h3>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{session.finalSynthesis}</ReactMarkdown>
              </div>
              
              {/* Total Cost */}
              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-400">Total Research Cost:</span>
                <span className="text-lg font-mono text-green-400">
                  ${session.totalCost.toFixed(6)}
                </span>
              </div>
            </div>
          )}

          {/* Session Stats */}
          {session.endTime && (
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} text-sm`}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-gray-400 text-xs">Steps Completed</div>
                  <div className="font-bold text-lg">{session.steps.filter(s => s.status === 'completed').length}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Duration</div>
                  <div className="font-bold text-lg">
                    {((session.endTime - session.startTime) / 1000).toFixed(1)}s
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Total Cost</div>
                  <div className="font-bold text-lg text-green-400">
                    ${session.totalCost.toFixed(6)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!session && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">Research Mode</h3>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Ask a research question and I'll conduct multi-step research with web searches
          </p>
          <div className={`max-w-md mx-auto text-left p-4 rounded-lg ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
          }`}>
            <h4 className="font-semibold mb-2">How it works:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
              <li>Break down your question into sub-topics</li>
              <li>Search the web for each sub-topic</li>
              <li>Analyze search results</li>
              <li>Synthesize findings with citations</li>
              <li>Provide comprehensive answer</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
