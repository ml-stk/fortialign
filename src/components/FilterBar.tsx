import React from 'react';
import { Search, Plus, Filter, ChevronsUpDown, X } from 'lucide-react';
import { PhaseId } from '../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: 'all' | 'completed' | 'pending' | 'critical';
  onStatusFilterChange: (filter: 'all' | 'completed' | 'pending' | 'critical') => void;
  phaseFilter: 'all' | PhaseId;
  onPhaseFilterChange: (phase: 'all' | PhaseId) => void;
  isExpandedAll: boolean;
  onToggleExpandAll: () => void;
  onOpenAddTask: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  phaseFilter,
  onPhaseFilterChange,
  isExpandedAll,
  onToggleExpandAll,
  onOpenAddTask,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search audit tasks, CLI commands, tags (e.g., HA, BGP, VDOM, SSL)..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-red-500 placeholder-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Add Custom Task Button */}
          <button
            onClick={onOpenAddTask}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Custom Task</span>
          </button>

          {/* Expand / Collapse All */}
          <button
            onClick={onToggleExpandAll}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isExpandedAll ? 'Collapse all phases' : 'Expand all phases'}
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{isExpandedAll ? 'Collapse All' : 'Expand All'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 flex-wrap text-xs">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 font-medium mr-1 text-[11px] flex items-center space-x-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <span>Status:</span>
          </span>
          {(
            [
              { id: 'all', label: 'All Tasks' },
              { id: 'pending', label: 'Pending' },
              { id: 'critical', label: 'Critical Only' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Phase Select Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-medium text-[11px]">Phase:</span>
          <select
            value={phaseFilter}
            onChange={(e) => onPhaseFilterChange(e.target.value as 'all' | PhaseId)}
            className="text-[11px] bg-slate-950 border border-slate-700 text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="all">All 4 Phases</option>
            <option value="planning">Phase 1: Planning</option>
            <option value="hardware">Phase 2: Hardware</option>
            <option value="syntax">Phase 3: Syntax & Config</option>
            <option value="validation">Phase 4: Validation</option>
          </select>
        </div>
      </div>
    </div>
  );
};
