import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AgentWorkflow, AgentStep, AgentExecution, WorkflowVariable } from '../types';
import { AGENT_WORKFLOWS } from '../data/presets';
import { Plus, Play, Trash2, Edit, X, Save, GripVertical, ChevronDown, ChevronRight, Download, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AgentBuilderProps {
  onRunWorkflow: (workflow: AgentWorkflow) => void;
  execution: AgentExecution | null;
  isRunning: boolean;
  isDark: boolean;
}

interface SortableStepProps {
  step: AgentStep;
  index: number;
  onUpdate: (stepId: string, updates: Partial<AgentStep>) => void;
  onRemove: (stepId: string) => void;
  isDark: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function SortableStep({ step, index, onUpdate, onRemove, isDark, isExpanded, onToggleExpand }: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(step.label);

  const handleSaveLabel = () => {
    onUpdate(step.id, { label });
    setIsEditingLabel(false);
  };

  const getStepIcon = (type: AgentStep['type']) => {
    switch (type) {
      case 'web_search': return '🌐';
      case 'news_search': return '📰';
      case 'code_execution': return '⚙️';
      case 'collections_search': return '📚';
      case 'synthesis': return '✨';
      default: return '⚡';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded border ${
        isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'
      }`}
    >
      {/* Step Header */}
      <div className="flex items-center gap-2 p-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical size={18} className="text-gray-500" />
        </div>
        
        <button onClick={onToggleExpand} className="p-1 hover:bg-gray-700 rounded">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        <span className="text-gray-500 font-mono text-sm w-6">{index + 1}.</span>
        <span className="text-xl">{getStepIcon(step.type)}</span>
        
        {isEditingLabel ? (
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveLabel();
              if (e.key === 'Escape') setIsEditingLabel(false);
            }}
            onBlur={handleSaveLabel}
            className="flex-1 p-1 rounded border border-gray-600 bg-gray-800"
            autoFocus
          />
        ) : (
          <span className="flex-1 font-medium">{step.label}</span>
        )}
        
        <div className="flex gap-1">
          {!isEditingLabel && (
            <>
              <button onClick={() => setIsEditingLabel(true)} className="p-1 hover:bg-gray-700 rounded text-gray-400">
                <Edit size={14} />
              </button>
              <button onClick={() => onRemove(step.id)} className="p-1 hover:bg-red-700 rounded text-red-400">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded Configuration */}
      {isExpanded && (
        <div className={`px-3 pb-3 space-y-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="pt-3 space-y-2">
            <label className="text-xs font-semibold text-gray-400">
              📝 Step Prompt <span className="text-gray-500 font-normal">(Use variables and step outputs)</span>
            </label>
            <textarea
              value={step.prompt}
              onChange={(e) => onUpdate(step.id, { prompt: e.target.value })}
              className={`w-full p-2 rounded border font-mono text-sm ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'
              }`}
              rows={3}
              placeholder="Enter the prompt/instruction for this step..."
            />
            <p className="text-xs text-gray-500">
              💡 Reference variables like {'{'}topic{'}'} or previous steps like {'{'}step_1_output{'}'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`use-prev-${step.id}`}
              checked={step.usePreviousOutput}
              onChange={(e) => onUpdate(step.id, { usePreviousOutput: e.target.checked })}
              className="rounded"
            />
            <label htmlFor={`use-prev-${step.id}`} className="text-sm cursor-pointer">
              🔗 Auto-include previous step's output in context
            </label>
          </div>

          {step.type === 'code_execution' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400">💻 Python Code (Optional)</label>
              <textarea
                value={step.config.code || ''}
                onChange={(e) => onUpdate(step.id, { 
                  config: { ...step.config, code: e.target.value }
                })}
                className={`w-full p-2 rounded border font-mono text-xs ${
                  isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'
                }`}
                rows={4}
                placeholder="# Python code (optional - leave empty to let AI generate)"
              />
            </div>
          )}

          {(step.type === 'web_search' || step.type === 'news_search') && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400">🔢 Max Results</label>
              <input
                type="number"
                value={step.config.max_results || 10}
                onChange={(e) => onUpdate(step.id, {
                  config: { ...step.config, max_results: parseInt(e.target.value) || 10 }
                })}
                className={`w-full p-2 rounded border ${
                  isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'
                }`}
                min={1}
                max={50}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AgentBuilder({ onRunWorkflow, execution, isRunning, isDark }: AgentBuilderProps) {
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<AgentWorkflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<AgentWorkflow | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch saved workflows from database
  const { data: savedWorkflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data } = await axios.get('/api/workflows');
      return data.map((w: any) => ({
        ...w,
        steps: typeof w.steps === 'string' ? JSON.parse(w.steps) : w.steps,
        variables: w.variables ? (typeof w.variables === 'string' ? JSON.parse(w.variables) : w.variables) : [],
      }));
    },
  });

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (workflow: AgentWorkflow) => {
      if (workflow.id.startsWith('custom-')) {
        const { data } = await axios.post('/api/workflows', {
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps,
          variables: workflow.variables || [],
        });
        return data;
      } else {
        const { data } = await axios.put(`/api/workflows/${workflow.id}`, {
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps,
          variables: workflow.variables || [],
        });
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const createNewWorkflow = () => {
    const newWorkflow: AgentWorkflow = {
      id: `custom-${Date.now()}`,
      name: 'New Workflow',
      description: 'Custom workflow',
      steps: [],
      variables: [{ name: 'topic', value: '', description: 'Main topic' }],
      isPreset: false,
    };
    setEditingWorkflow(newWorkflow);
    setIsEditing(true);
  };

  const addStep = (type: AgentStep['type']) => {
    if (!editingWorkflow) return;
    
    const stepNumber = editingWorkflow.steps.length + 1;
    const newStep: AgentStep = {
      id: `step-${Date.now()}`,
      type,
      label: getDefaultLabel(type),
      prompt: getDefaultPrompt(type, stepNumber),
      usePreviousOutput: type !== 'web_search' && type !== 'news_search',
      config: getDefaultConfig(type),
    };
    
    setEditingWorkflow({
      ...editingWorkflow,
      steps: [...editingWorkflow.steps, newStep],
    });
    
    // Auto-expand new step
    setExpandedSteps(new Set([...expandedSteps, newStep.id]));
  };

  const updateStep = (stepId: string, updates: Partial<AgentStep>) => {
    if (!editingWorkflow) return;
    setEditingWorkflow({
      ...editingWorkflow,
      steps: editingWorkflow.steps.map(s => 
        s.id === stepId ? { ...s, ...updates } : s
      ),
    });
  };

  const removeStep = (stepId: string) => {
    if (!editingWorkflow) return;
    setEditingWorkflow({
      ...editingWorkflow,
      steps: editingWorkflow.steps.filter(s => s.id !== stepId),
    });
    setExpandedSteps(new Set([...expandedSteps].filter(id => id !== stepId)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!editingWorkflow || !over || active.id === over.id) return;
    
    const oldIndex = editingWorkflow.steps.findIndex(s => s.id === active.id);
    const newIndex = editingWorkflow.steps.findIndex(s => s.id === over.id);
    
    setEditingWorkflow({
      ...editingWorkflow,
      steps: arrayMove(editingWorkflow.steps, oldIndex, newIndex),
    });
  };

  const toggleStepExpanded = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const addVariable = () => {
    if (!editingWorkflow) return;
    const newVar: WorkflowVariable = {
      name: `var_${(editingWorkflow.variables?.length || 0) + 1}`,
      value: '',
      description: '',
    };
    setEditingWorkflow({
      ...editingWorkflow,
      variables: [...(editingWorkflow.variables || []), newVar],
    });
  };

  const updateVariable = (index: number, updates: Partial<WorkflowVariable>) => {
    if (!editingWorkflow || !editingWorkflow.variables) return;
    const newVars = [...editingWorkflow.variables];
    newVars[index] = { ...newVars[index], ...updates };
    setEditingWorkflow({
      ...editingWorkflow,
      variables: newVars,
    });
  };

  const removeVariable = (index: number) => {
    if (!editingWorkflow || !editingWorkflow.variables) return;
    setEditingWorkflow({
      ...editingWorkflow,
      variables: editingWorkflow.variables.filter((_, i) => i !== index),
    });
  };

  const saveWorkflow = async () => {
    if (!editingWorkflow) return;
    
    try {
      const saved = await saveWorkflowMutation.mutateAsync(editingWorkflow);
      setSelectedWorkflow({
        ...saved,
        steps: typeof saved.steps === 'string' ? JSON.parse(saved.steps) : saved.steps,
        variables: saved.variables ? (typeof saved.variables === 'string' ? JSON.parse(saved.variables) : saved.variables) : [],
      });
      setIsEditing(false);
      setEditingWorkflow(null);
      setExpandedSteps(new Set());
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      await deleteWorkflowMutation.mutateAsync(id);
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(null);
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      alert('Failed to delete workflow');
    }
  };

  const getDefaultLabel = (type: AgentStep['type']): string => {
    switch (type) {
      case 'web_search': return 'Search the Web';
      case 'news_search': return 'Search News';
      case 'code_execution': return 'Execute Code';
      case 'collections_search': return 'Search Collections';
      case 'synthesis': return 'Synthesize Results';
      default: return 'Step';
    }
  };

  const getDefaultPrompt = (type: AgentStep['type'], stepNum: number): string => {
    const prevStep = stepNum - 1;
    switch (type) {
      case 'web_search': return 'Search for: {topic}';
      case 'news_search': return 'Find latest news about: {topic}';
      case 'code_execution': 
        return stepNum > 1 ? `Analyze the previous results: {step_${prevStep}_output}` : 'Run Python analysis';
      case 'collections_search': return 'Search my documents for: {topic}';
      case 'synthesis': 
        return stepNum > 1 ? 'Synthesize all findings from the previous steps' : 'Create final summary';
      default: return 'Complete this step';
    }
  };

  const getDefaultConfig = (type: AgentStep['type']) => {
    switch (type) {
      case 'web_search':
      case 'news_search':
        return { max_results: 10 };
      case 'code_execution':
        return { code: '' };
      case 'collections_search':
        return {};
      case 'synthesis':
        return {};
      default:
        return {};
    }
  };

  const getStepIcon = (type: AgentStep['type']) => {
    switch (type) {
      case 'web_search': return '🌐';
      case 'news_search': return '📰';
      case 'code_execution': return '⚙️';
      case 'collections_search': return '📚';
      case 'synthesis': return '✨';
      default: return '⚡';
    }
  };

  // Helper to detect if output looks like CSV
  const looksLikeCSV = (text: string): boolean => {
    const cleaned = extractCSV(text);
    const lines = cleaned.trim().split('\n');
    if (lines.length < 2) return false;
    
    // Check if first line has commas (header row)
    const firstLine = lines[0];
    if (!firstLine.includes(',')) return false;
    
    // More lenient check - just need 2+ lines with commas
    const linesWithCommas = lines.filter(line => line.includes(','));
    return linesWithCommas.length >= 2;
  };

  // Helper to download content as file
  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to copy to clipboard
  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  };

  // Helper to extract clean CSV from output
  const extractCSV = (output: string): string => {
    // Remove markdown code blocks if present
    let cleaned = output.replace(/```csv\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  };

  return (
    <div className="space-y-4">
      {/* Workflow Selector */}
      {!isEditing && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">🤖 Select or Create Workflow</h3>
            <button
              onClick={createNewWorkflow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
            >
              <Plus size={16} />
              New Workflow
            </button>
          </div>

          {/* Preset and Saved Workflows */}
          <div className="space-y-4">
            {AGENT_WORKFLOWS.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">📋 Preset Workflows</h4>
                <div className="grid gap-3">
                  {AGENT_WORKFLOWS.map((workflow) => (
                    <button
                      key={workflow.id}
                      onClick={() => setSelectedWorkflow(workflow)}
                      className={`text-left p-4 rounded-lg border transition-colors ${
                        selectedWorkflow?.id === workflow.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : isDark
                          ? 'border-gray-700 hover:border-blue-500 hover:bg-gray-800'
                          : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
                      }`}
                    >
                      <h4 className="font-semibold mb-1">{workflow.name}</h4>
                      <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {workflow.description}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {workflow.steps.map((step, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-gray-700 rounded">
                            {getStepIcon(step.type)} {step.label}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {savedWorkflows.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">💾 Saved Workflows</h4>
                <div className="grid gap-3">
                  {savedWorkflows.map((workflow: AgentWorkflow) => (
                    <div
                      key={workflow.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        selectedWorkflow?.id === workflow.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : isDark
                          ? 'border-gray-700 hover:border-blue-500 hover:bg-gray-800'
                          : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <button
                          onClick={() => setSelectedWorkflow(workflow)}
                          className="flex-1 text-left"
                        >
                          <h4 className="font-semibold mb-1">{workflow.name}</h4>
                          <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {workflow.description}
                          </p>
                        </button>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingWorkflow(workflow);
                              setSelectedWorkflow(null);
                              setIsEditing(true);
                            }}
                            className="p-1 hover:bg-gray-700 rounded text-gray-400"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWorkflow(workflow.id);
                            }}
                            className="p-1 hover:bg-red-700 rounded text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {workflow.steps.map((step: AgentStep, idx: number) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-gray-700 rounded">
                            {getStepIcon(step.type)} {step.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workflow Editor */}
      {isEditing && editingWorkflow && (
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">✏️ Edit Workflow</h3>
            <div className="flex gap-2">
              <button
                onClick={saveWorkflow}
                disabled={saveWorkflowMutation.isPending}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm disabled:bg-gray-600"
              >
                <Save size={14} />
                {saveWorkflowMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingWorkflow(null);
                  setExpandedSteps(new Set());
                }}
                className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <input
              type="text"
              value={editingWorkflow.name}
              onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
              className="w-full p-2 rounded border border-gray-700 bg-gray-900"
              placeholder="Workflow Name"
            />
            <input
              type="text"
              value={editingWorkflow.description}
              onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
              className="w-full p-2 rounded border border-gray-700 bg-gray-900"
              placeholder="Description"
            />
          </div>

          {/* Workflow Variables Section */}
          <div className={`mb-4 p-3 rounded border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">📊 Workflow Variables</h4>
              <button
                onClick={addVariable}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
              >
                <Plus size={12} />
                Add Variable
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Variables you can reference in step prompts using {'{'}variable_name{'}'}
            </p>
            
            {editingWorkflow.variables && editingWorkflow.variables.length > 0 ? (
              <div className="space-y-2">
                {editingWorkflow.variables.map((variable, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={variable.name}
                      onChange={(e) => updateVariable(idx, { name: e.target.value })}
                      className="w-32 p-1 rounded border border-gray-700 bg-gray-800 text-sm font-mono"
                      placeholder="name"
                    />
                    <input
                      type="text"
                      value={variable.value}
                      onChange={(e) => updateVariable(idx, { value: e.target.value })}
                      className="flex-1 p-1 rounded border border-gray-700 bg-gray-800 text-sm"
                      placeholder="default value"
                    />
                    <button
                      onClick={() => removeVariable(idx)}
                      className="p-1 hover:bg-red-700 rounded text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No variables. Add variables to inject custom data.</p>
            )}
          </div>

          {/* Drag and Drop Steps */}
          <div className="space-y-2 mb-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <GripVertical size={16} className="text-gray-500" />
              Workflow Steps (drag to reorder, click &gt; to configure):
            </h4>
            
            {editingWorkflow.steps.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={editingWorkflow.steps.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {editingWorkflow.steps.map((step, index) => (
                      <SortableStep
                        key={step.id}
                        step={step}
                        index={index}
                        onUpdate={updateStep}
                        onRemove={removeStep}
                        isDark={isDark}
                        isExpanded={expandedSteps.has(step.id)}
                        onToggleExpand={() => toggleStepExpanded(step.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
                isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-300 bg-gray-50'
              }`}>
                <p className="text-gray-500 mb-3">No steps yet. Add your first step below!</p>
              </div>
            )}
          </div>

          {/* Add Step Buttons */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="font-semibold text-sm mb-3">➕ Add Step:</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => addStep('web_search')} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-1">
                <span>🌐</span> Web Search
              </button>
              <button onClick={() => addStep('news_search')} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-1">
                <span>📰</span> News Search
              </button>
              <button onClick={() => addStep('code_execution')} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-1">
                <span>⚙️</span> Code Execution
              </button>
              <button onClick={() => addStep('collections_search')} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-1">
                <span>📚</span> Collections
              </button>
              <button onClick={() => addStep('synthesis')} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-1">
                <span>✨</span> Synthesis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Workflow - Run View with Variable Input */}
      {!isEditing && selectedWorkflow && (
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">{selectedWorkflow.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // If editing a preset, create a custom copy
                  const workflowToEdit = selectedWorkflow.isPreset ? {
                    ...selectedWorkflow,
                    id: `custom-${Date.now()}`,
                    name: `${selectedWorkflow.name} (Custom)`,
                    isPreset: false,
                  } : selectedWorkflow;
                  
                  setEditingWorkflow(workflowToEdit);
                  setSelectedWorkflow(null);
                  setIsEditing(true);
                }}
                className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                <Edit size={14} />
                Edit
              </button>
              <button
                onClick={() => {
                  // Collect variable values from input fields
                  const variableValues: Record<string, string> = {};
                  selectedWorkflow.variables?.forEach((variable) => {
                    const input = document.querySelector(`input[data-variable="${variable.name}"]`) as HTMLInputElement;
                    variableValues[variable.name] = input?.value || variable.value;
                  });
                  
                  // Create workflow with populated variables
                  const workflowWithValues = {
                    ...selectedWorkflow,
                    variables: selectedWorkflow.variables?.map(v => ({
                      ...v,
                      value: variableValues[v.name] || v.value
                    }))
                  };
                  
                  onRunWorkflow(workflowWithValues);
                }}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm font-medium"
              >
                <Play size={16} />
                {isRunning ? 'Running...' : 'Run Workflow'}
              </button>
            </div>
          </div>
          
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {selectedWorkflow.description}
          </p>

          {/* Variable Inputs for Workflow Execution */}
          {selectedWorkflow.variables && selectedWorkflow.variables.length > 0 && (
            <div className={`mb-4 p-3 rounded border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
              <h4 className="font-semibold text-sm mb-3">📊 Set Variables Before Running:</h4>
              <div className="space-y-2">
                {selectedWorkflow.variables.map((variable, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-400 font-mono">{'{' + variable.name + '}'}</label>
                    <input
                      type="text"
                      data-variable={variable.name}
                      defaultValue={variable.value}
                      className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-sm"
                      placeholder={variable.description || `Enter ${variable.name}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Workflow Steps Preview */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm mb-2">Workflow Steps:</h4>
            {selectedWorkflow.steps.map((step, index) => (
              <div key={step.id} className={`flex items-start gap-3 p-3 rounded ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <span className="text-gray-500 font-mono text-sm">{index + 1}.</span>
                <span className="text-xl">{getStepIcon(step.type)}</span>
                <div className="flex-1">
                  <div className="font-medium mb-1">{step.label}</div>
                  <div className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    {step.prompt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Results */}
      {execution && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">📊 Execution Results</h3>
          
          {execution.steps.map((execStep) => {
            const workflowStep = selectedWorkflow?.steps.find(s => s.id === execStep.stepId);
            if (!workflowStep) return null;
            
            return (
              <div
                key={execStep.stepId}
                className={`p-4 rounded-lg border ${
                  execStep.status === 'running'
                    ? 'border-blue-500 bg-blue-500/10'
                    : execStep.status === 'completed'
                    ? isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                    : isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-300 bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getStepIcon(workflowStep.type)}</span>
                    <span className="font-semibold">{workflowStep.label}</span>
                    {execStep.status === 'running' && (
                      <span className="text-blue-400 text-xs animate-pulse">Running...</span>
                    )}
                    {execStep.status === 'completed' && (
                      <span className="text-green-400 text-xs">✓ Complete</span>
                    )}
                  </div>
                  {execStep.cost && (
                    <span className="text-xs text-green-400 font-mono">
                      ${execStep.cost.toFixed(6)}
                    </span>
                  )}
                </div>
                
                {execStep.input && (
                  <div className={`text-sm mb-2 p-2 rounded ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <span className="text-gray-400">Input:</span>
                    <div className="mt-1 font-mono text-xs">{execStep.input}</div>
                  </div>
                )}
                
                {execStep.output && execStep.status === 'completed' && (
                  <div className={`mt-2 p-3 rounded text-sm ${
                    isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                    {(() => {
                      const isCSV = looksLikeCSV(execStep.output);
                      const csvContent = isCSV ? extractCSV(execStep.output) : '';
                      
                      return (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-xs">Output:</span>
                            {isCSV && (
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    const success = await copyToClipboard(csvContent);
                                    if (success) {
                                      // Could add a toast notification here
                                      alert('CSV copied to clipboard!');
                                    }
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                >
                                  <Copy size={12} />
                                  Copy CSV
                                </button>
                                <button
                                  onClick={() => {
                                    const timestamp = new Date().toISOString().split('T')[0];
                                    downloadFile(csvContent, `workflow-output-${timestamp}.csv`);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                >
                                  <Download size={12} />
                                  Download CSV
                                </button>
                              </div>
                            )}
                          </div>
                          {isCSV ? (
                            <pre className={`p-3 rounded overflow-x-auto text-xs font-mono whitespace-pre ${
                              isDark ? 'bg-black/50' : 'bg-gray-100'
                            }`}>
                              {csvContent}
                            </pre>
                          ) : (
                            <div className="prose prose-sm prose-invert max-w-none mt-2">
                              <ReactMarkdown>{execStep.output}</ReactMarkdown>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}

          {/* Total Cost */}
          {execution.endTime && (
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <span className="ml-2 font-mono">
                    {((execution.endTime - execution.startTime) / 1000).toFixed(1)}s
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Total Cost:</span>
                  <span className="ml-2 font-mono text-green-400">
                    ${execution.totalCost.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isEditing && !selectedWorkflow && !execution && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold mb-2">Agent Workflow Builder</h3>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Create custom multi-step workflows with variables and output chaining
          </p>
          <div className={`max-w-2xl mx-auto text-left p-4 rounded-lg ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
          }`}>
            <h4 className="font-semibold mb-3">How It Works:</h4>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Define workflow variables (e.g., topic, my_opinion)</li>
              <li>Add steps and configure each with custom prompts</li>
              <li>Reference variables using {'{'}variable_name{'}'}</li>
              <li>Chain outputs using {'{'}step_1_output{'}'}, {'{'}step_2_output{'}'}, etc.</li>
              <li>Run workflow and watch execution</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500 rounded text-sm">
              <p className="font-semibold mb-1">💡 Example:</p>
              <p className="text-xs">
                Variable: {'{'}topic{'}'} = "iPhone 16"<br/>
                Step 1: Search for {'{'}topic{'}'} reviews<br/>
                Step 2: Summarize {'{'}step_1_output{'}'} and add my opinion: I think battery life is key
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
