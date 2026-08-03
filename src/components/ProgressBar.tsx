import React from 'react';
import { ChecklistTask, PhaseInfo } from '../types';
import { CheckCircle, Clock, AlertTriangle, ListChecks } from 'lucide-react';

interface ProgressBarProps {
  tasks: ChecklistTask[];
  phases: PhaseInfo[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ tasks, phases }) => {
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const criticalRemainingCount = tasks.filter((t) => !t.completed && t.priority === 'Critical').length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Bar: Progress percentage & headline stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-100">Migration Readiness Progress</h2>
            <span
              className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                percentage === 100
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : percentage > 50
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              {percentage}% Complete
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {completedCount} of {totalCount} total migration audit tasks verified
          </p>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
            <ListChecks className="w-3.5 h-3.5 text-slate-400" />
            <span>Total: <strong className="text-slate-100">{totalCount}</strong></span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Done: <strong className="text-emerald-300">{completedCount}</strong></span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending: <strong className="text-amber-300">{pendingCount}</strong></span>
          </div>

          {criticalRemainingCount > 0 && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-red-950/40 border border-red-500/30 rounded-lg text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>Critical Left: <strong className="text-red-300">{criticalRemainingCount}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Main Progress Track */}
      <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            percentage === 100
              ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
              : 'bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Phase Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {phases.map((phase) => {
          const phaseTasks = tasks.filter((t) => t.phaseId === phase.id);
          const phaseDone = phaseTasks.filter((t) => t.completed).length;
          const phasePercent = phaseTasks.length > 0 ? Math.round((phaseDone / phaseTasks.length) * 100) : 0;

          return (
            <div
              key={phase.id}
              className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                <span className="truncate">Phase {phase.number}</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {phaseDone}/{phaseTasks.length}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mr-2">
                  <div
                    className={`h-full transition-all duration-300 ${
                      phasePercent === 100 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${phasePercent}%` }}
                  />
                </div>
                <span className="font-mono text-slate-400 shrink-0">{phasePercent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
