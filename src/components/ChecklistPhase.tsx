import React from 'react';
import {
  ClipboardList,
  Server,
  Code2,
  ShieldCheck,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { ChecklistTask, PhaseInfo } from '../types';
import { TaskCard } from './TaskCard';

interface ChecklistPhaseProps {
  phase: PhaseInfo;
  tasks: ChecklistTask[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleTaskComplete: (taskId: string) => void;
  onUpdateTaskNote: (taskId: string, note: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenAddTaskForPhase: (phaseId: PhaseInfo['id']) => void;
}

const PHASE_ICONS: Record<string, React.ReactNode> = {
  ClipboardList: <ClipboardList className="w-5 h-5 text-red-400" />,
  Server: <Server className="w-5 h-5 text-amber-400" />,
  Code2: <Code2 className="w-5 h-5 text-sky-400" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
};

export const ChecklistPhase: React.FC<ChecklistPhaseProps> = ({
  phase,
  tasks,
  isExpanded,
  onToggleExpand,
  onToggleTaskComplete,
  onUpdateTaskNote,
  onDeleteTask,
  onOpenAddTaskForPhase,
}) => {
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Collapsible Phase Header */}
      <div
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center justify-between gap-3 bg-slate-900 hover:bg-slate-800/60 cursor-pointer select-none transition-colors border-b border-slate-800/80"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            {PHASE_ICONS[phase.iconName] || <ClipboardList className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                Phase {phase.number}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                {phase.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 truncate hidden sm:block">{phase.description}</p>
          </div>
        </div>

        {/* Right Status Badge & Expand Icon */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Phase Progress Badge */}
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-lg font-mono border ${
                percent === 100
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}
            >
              {completedTasks}/{totalTasks} ({percent}%)
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddTaskForPhase(phase.id);
            }}
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-transparent hover:border-emerald-500/20 transition-colors cursor-pointer hidden sm:block"
            title="Add task to this phase"
          >
            <Plus className="w-4 h-4" />
          </button>

          <ChevronDown
            className={`w-4 h-4 text-slate-400 transform transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Phase Task Cards List */}
      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-3 bg-slate-950/40">
          {tasks.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
              No audit tasks found for this phase matching active filters or search query.
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleTaskComplete}
                onUpdateNote={onUpdateTaskNote}
                onDeleteTask={onDeleteTask}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
