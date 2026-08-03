import React from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { PHASES } from '../data/defaultChecklist';
import { PhaseId, Priority } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  defaultPhaseId?: PhaseId;
  onClose: () => void;
  onAddTask: (taskData: {
    phaseId: PhaseId;
    title: string;
    description: string;
    priority: Priority;
    category: string;
    cliCommand?: string;
  }) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  defaultPhaseId = 'planning',
  onClose,
  onAddTask,
}) => {
  const [phaseId, setPhaseId] = React.useState<PhaseId>(defaultPhaseId);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState<Priority>('High');
  const [category, setCategory] = React.useState('Custom Audit');
  const [cliCommand, setCliCommand] = React.useState('');

  React.useEffect(() => {
    if (defaultPhaseId) setPhaseId(defaultPhaseId);
  }, [defaultPhaseId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      phaseId,
      title: title.trim(),
      description: description.trim() || 'Custom user-defined FortiGate migration step.',
      priority,
      category: category.trim() || 'Custom Audit',
      cliCommand: cliCommand.trim() || undefined,
    });

    setTitle('');
    setDescription('');
    setCliCommand('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Add Custom Audit Step</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Phase Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Phase Category</label>
            <select
              value={phaseId}
              onChange={(e) => setPhaseId(e.target.value as PhaseId)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {PHASES.map((p) => (
                <option key={p.id} value={p.id}>
                  Phase {p.number}: {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Verify BFD neighbor timers on WAN sub-interfaces"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-red-500 placeholder-slate-600"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Task Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed validation steps, expected outcomes, or parameters..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-red-500 placeholder-slate-600 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Category Tag */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Category Tag</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. BFD, SD-WAN, HA"
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-red-500 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Optional CLI Command */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center justify-between">
              <span>FortiOS CLI Command (Optional)</span>
              <span className="text-[10px] text-slate-500 font-mono">e.g. diagnose router bfd neighbor</span>
            </label>
            <textarea
              value={cliCommand}
              onChange={(e) => setCliCommand(e.target.value)}
              placeholder="diagnose router bfd neighbor summary"
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-mono text-[11px] rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 placeholder-slate-700 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
