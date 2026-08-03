import React from 'react';
import {
  Check,
  Terminal,
  Copy,
  Edit3,
  Trash2,
  ChevronDown,
  Sparkles,
  FileText,
} from 'lucide-react';
import { ChecklistTask, Priority } from '../types';

interface TaskCardProps {
  task: ChecklistTask;
  onToggleComplete: (taskId: string) => void;
  onUpdateNote: (taskId: string, note: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; border: string }> = {
  Critical: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  High: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  Medium: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
  },
  Low: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onUpdateNote,
  onDeleteTask,
}) => {
  const [showCli, setShowCli] = React.useState(false);
  const [showNoteEditor, setShowNoteEditor] = React.useState(!!task.note);
  const [noteValue, setNoteValue] = React.useState(task.note || '');
  const [copiedCli, setCopiedCli] = React.useState(false);

  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium;

  const handleCopyCli = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.cliCommand) {
      navigator.clipboard.writeText(task.cliCommand);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    }
  };

  const handleSaveNote = () => {
    onUpdateNote(task.id, noteValue);
  };

  return (
    <div
      className={`group relative bg-slate-900/90 border rounded-xl p-3.5 sm:p-4 transition-all duration-200 ${
        task.completed
          ? 'border-slate-800/80 bg-slate-900/40 opacity-75 hover:opacity-100'
          : 'border-slate-800 hover:border-slate-700 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox Control */}
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${
            task.completed
              ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-xs'
              : 'border-slate-600 bg-slate-950 hover:border-red-500'
          }`}
          title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Badges & Title */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                {/* Priority Badge */}
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold border rounded ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
                >
                  {task.priority}
                </span>

                {/* Category Badge */}
                <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 rounded">
                  {task.category}
                </span>

                {/* Dynamic Generator Origin Tag */}
                {task.isDynamic && (
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded uppercase border ${
                      task.dynamicReason === 'ha'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        : task.dynamicReason === 'vdom'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : task.dynamicReason === 'firmware'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5 inline mr-1" />
                    {task.dynamicReason}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3
                onClick={() => onToggleComplete(task.id)}
                className={`text-xs sm:text-sm font-semibold cursor-pointer select-none leading-snug transition-colors ${
                  task.completed
                    ? 'line-through text-slate-500'
                    : 'text-slate-100 hover:text-red-400'
                }`}
              >
                {task.title}
              </h3>
            </div>

            {/* Right Action Tools (Notes toggle, Delete custom task) */}
            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
              <button
                onClick={() => setShowNoteEditor(!showNoteEditor)}
                className={`p-1 text-xs rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                  task.note ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Add/Edit Engineer Note"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>

              {task.dynamicReason === 'custom' && (
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                  title="Delete Custom Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Task Description */}
          <p className={`text-xs leading-relaxed ${task.completed ? 'text-slate-500' : 'text-slate-300'}`}>
            {task.description}
          </p>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center space-x-1 flex-wrap gap-y-1 pt-0.5">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.2 text-[9px] font-mono text-slate-400 bg-slate-950 border border-slate-800 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* CLI Reference Section (Collapsible) */}
          {task.cliCommand && (
            <div className="pt-1">
              <button
                onClick={() => setShowCli(!showCli)}
                className="flex items-center space-x-1.5 text-[11px] font-mono text-red-400 hover:text-red-300 cursor-pointer focus:outline-none"
              >
                <Terminal className="w-3 h-3" />
                <span>{showCli ? 'Hide FortiOS CLI Command' : 'View FortiOS CLI Command'}</span>
                <ChevronDown
                  className={`w-3 h-3 transform transition-transform ${showCli ? 'rotate-180' : ''}`}
                />
              </button>

              {showCli && (
                <div className="mt-2 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-emerald-400 relative group/cli">
                  <button
                    onClick={handleCopyCli}
                    className="absolute right-2 top-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCli ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <pre className="whitespace-pre-wrap overflow-x-auto pr-16">{task.cliCommand}</pre>
                </div>
              )}
            </div>
          )}

          {/* Inline Engineer Note Editor */}
          {showNoteEditor && (
            <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-amber-400">
                <span className="flex items-center space-x-1">
                  <Edit3 className="w-3 h-3" />
                  <span>Engineer Audit Note / Execution Artifacts</span>
                </span>
                {task.note && <span className="text-slate-500 font-normal">Saved</span>}
              </div>
              <textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                onBlur={handleSaveNote}
                placeholder="Enter validation result, interface names, IP addresses, serial numbers, or notes..."
                rows={2}
                className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded p-2 focus:outline-none focus:border-amber-500 placeholder-slate-600 resize-none font-mono"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
