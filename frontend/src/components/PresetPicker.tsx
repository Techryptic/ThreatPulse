import { PresetTemplate, AppMode } from '../types';
import { PRESET_TEMPLATES } from '../data/presets';
import { X } from 'lucide-react';

interface PresetPickerProps {
  onSelectPreset: (preset: PresetTemplate) => void;
  onClose: () => void;
  currentMode: AppMode;
  isDark: boolean;
}

export function PresetPicker({ onSelectPreset, onClose, currentMode, isDark }: PresetPickerProps) {
  const filteredPresets = PRESET_TEMPLATES.filter(p => p.mode === currentMode);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} border rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col m-4`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">
            {currentMode === 'research' && '🔍 Research Presets'}
            {currentMode === 'agent' && '🤖 Agent Presets'}
            {currentMode === 'standard' && '⚡ Standard Presets'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4">
          <div className="grid gap-3">
            {filteredPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  isDark
                    ? 'border-gray-700 hover:border-blue-500 hover:bg-gray-800'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{preset.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{preset.name}</h3>
                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {preset.description}
                    </p>
                    {preset.tools && preset.tools.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {preset.tools.map((tool) => (
                          <span
                            key={tool}
                            className={`text-xs px-2 py-1 rounded ${
                              isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {filteredPresets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No presets available for this mode</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
