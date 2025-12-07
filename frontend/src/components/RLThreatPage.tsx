import { useState } from 'react';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RLThreatIntelligence } from './RLThreatIntelligence';

export function RLThreatPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-950 text-gray-100' : 'bg-white text-gray-900'}`}>
      <header className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between max-w-full mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              title="Back to Prompt Lab"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">🧠 RL Threat Intelligence</h1>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>
      <div className="h-[calc(100vh-73px)]">
        <RLThreatIntelligence />
      </div>
    </div>
  );
}
