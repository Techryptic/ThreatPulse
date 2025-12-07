import { useNavigate } from 'react-router-dom';
import { AppMode } from '../types';

interface ModeSelectorProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  const navigate = useNavigate();
  return (
    <div className="mb-4">
      <div className="grid grid-cols-5 gap-2 p-1 bg-gray-800 rounded-lg">
        <button
          onClick={() => onModeChange('standard')}
          className={`py-2 px-4 rounded-md font-medium transition-colors ${
            currentMode === 'standard'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>⚡</span>
            <span>Standard</span>
          </span>
        </button>
        <button
          onClick={() => onModeChange('research')}
          className={`py-2 px-4 rounded-md font-medium transition-colors ${
            currentMode === 'research'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>🔍</span>
            <span>Research</span>
          </span>
        </button>
        <button
          onClick={() => onModeChange('agent')}
          className={`py-2 px-4 rounded-md font-medium transition-colors ${
            currentMode === 'agent'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>🤖</span>
            <span>Agent</span>
          </span>
        </button>
        <button
          onClick={() => onModeChange('threat')}
          className={`py-2 px-4 rounded-md font-medium transition-colors ${
            currentMode === 'threat'
              ? 'bg-red-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>🔴</span>
            <span>ThreatPulse</span>
          </span>
        </button>
        <button
          onClick={() => navigate('/rl-threat')}
          className={`py-2 px-4 rounded-md font-medium transition-colors ${
            currentMode === 'rl_threat'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>🧠</span>
            <span className="text-xs">RL Intel</span>
          </span>
        </button>
      </div>
      
      <div className="mt-2 text-sm text-muted-foreground">
        {currentMode === 'standard' && (
          <p>Standard chat mode - Direct prompting with optional tools</p>
        )}
        {currentMode === 'research' && (
          <p>🌟 Research Mode - Automated multi-step research with web search and synthesis (xAI exclusive!)</p>
        )}
        {currentMode === 'agent' && (
          <p>🤖 Agent Builder - Create multi-step workflows with search, code execution, and analysis (xAI exclusive!)</p>
        )}
        {currentMode === 'threat' && (
          <p>🔴 ThreatPulse - Real-time cyber threat intelligence monitoring from X (xAI exclusive!)</p>
        )}
        {currentMode === 'rl_threat' && (
          <p>🧠 RL Threat Intel - AI learns from X community patterns to predict critical CVEs (xAI exclusive!)</p>
        )}
      </div>
    </div>
  );
}
