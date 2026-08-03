import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ProgressBar } from './components/ProgressBar';
import { FilterBar } from './components/FilterBar';
import { ChecklistPhase } from './components/ChecklistPhase';
import { AddTaskModal } from './components/AddTaskModal';
import { CliReferenceModal } from './components/CliReferenceModal';
import { ExportMarkdownModal } from './components/ExportMarkdownModal';
import { generateTasksForSpec, PHASES, PRESETS } from './data/defaultChecklist';
import { ChecklistTask, MigrationPreset, MigrationSpec, PhaseId } from './types';

import {
  generateMarkdownRunbook,
  downloadMarkdownFile,
} from './utils/exportMarkdown';
import { loadFromStorage, saveToStorage, clearStorage } from './utils/storage';

export default function App() {
  // Initial default spec
  const defaultSpec: MigrationSpec = PRESETS[0].spec;

  const [spec, setSpec] = useState<MigrationSpec>(() => {
    const saved = loadFromStorage();
    return saved.spec || defaultSpec;
  });

  const [tasks, setTasks] = useState<ChecklistTask[]>(() => {
    const saved = loadFromStorage();
    if (saved.tasks && saved.tasks.length > 0) {
      return saved.tasks;
    }
    return generateTasksForSpec(defaultSpec);
  });

  // UI state for search, filters, expanded sections
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'critical'>('all');
  const [phaseFilter, setPhaseFilter] = useState<'all' | PhaseId>('all');
  const [expandedPhases, setExpandedPhases] = useState<Record<PhaseId, boolean>>({
    planning: true,
    hardware: true,
    syntax: true,
    validation: true,
  });

  // Modal States
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [addTaskDefaultPhase, setAddTaskDefaultPhase] = useState<PhaseId>('planning');
  const [isCliModalOpen, setIsCliModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Sync state to LocalStorage
  useEffect(() => {
    saveToStorage(spec, tasks);
  }, [spec, tasks]);

  // Handle spec changes and dynamically add/remove HA/VDOM tasks preserving user completed states
  const handleSpecChange = (newSpec: MigrationSpec) => {
    setSpec(newSpec);

    // Re-generate full set of tasks for the new spec
    const newlyGenerated = generateTasksForSpec(newSpec);

    setTasks((prevTasks) => {
      const prevTaskMap = new Map<string, ChecklistTask>(prevTasks.map((t) => [t.id, t]));

      // Merge newly generated tasks with previous task completed state and notes
      const merged = newlyGenerated.map((newTask) => {
        const existing = prevTaskMap.get(newTask.id);
        if (existing) {
          return {
            ...newTask,
            completed: existing.completed,
            note: existing.note !== undefined ? existing.note : newTask.note,
          };
        }
        return newTask;
      });

      // Preserve any custom tasks added by the user
      const customTasks = prevTasks.filter((t) => t.dynamicReason === 'custom');
      return [...merged, ...customTasks];
    });
  };

  // Toggle checklist item status
  const handleToggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  // Update task engineer note
  const handleUpdateTaskNote = (taskId: string, note: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, note } : t)));
  };

  // Add custom task
  const handleAddCustomTask = (taskData: {
    phaseId: PhaseId;
    title: string;
    description: string;
    priority: any;
    category: string;
    cliCommand?: string;
  }) => {
    const newTask: ChecklistTask = {
      id: `custom-${Date.now()}`,
      phaseId: taskData.phaseId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      completed: false,
      category: taskData.category,
      cliCommand: taskData.cliCommand,
      isDynamic: true,
      dynamicReason: 'custom',
      tags: ['Custom', taskData.category],
    };

    setTasks((prev) => [...prev, newTask]);
    // Ensure phase is expanded
    setExpandedPhases((prev) => ({ ...prev, [taskData.phaseId]: true }));
  };

  // Delete custom task
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Apply Preset
  const handleApplyPreset = (preset: MigrationPreset) => {
    handleSpecChange(preset.spec);
  };

  // Reset checklist
  const handleResetChecklist = () => {
    if (window.confirm('Reset all audit checklist items and start fresh with current specifications?')) {
      clearStorage();
      const freshTasks = generateTasksForSpec(spec);
      setTasks(freshTasks);
    }
  };

  // Export JSON state
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ spec, tasks }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FortiGate_Migration_${spec.sourceModel}_to_${spec.destinationModel}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON state
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.spec && Array.isArray(parsed.tasks)) {
          setSpec(parsed.spec);
          setTasks(parsed.tasks);
          alert('Migration state successfully loaded from JSON file!');
        } else {
          alert('Invalid JSON structure for FortiGate Migration Checklist.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Expand / Collapse all phases toggle
  const isAllExpanded = Object.values(expandedPhases).every(Boolean);
  const handleToggleExpandAll = () => {
    const nextState = !isAllExpanded;
    setExpandedPhases({
      planning: nextState,
      hardware: nextState,
      syntax: nextState,
      validation: nextState,
    });
  };

  // Count dynamic tasks added
  const dynamicCount = useMemo(() => {
    const ha = tasks.filter((t) => t.dynamicReason === 'ha').length;
    const vdom = tasks.filter((t) => t.dynamicReason === 'vdom').length;
    const firmware = tasks.filter((t) => t.dynamicReason === 'firmware').length;
    return { ha, vdom, firmware };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter === 'completed' && !task.completed) return false;
      if (statusFilter === 'pending' && task.completed) return false;
      if (statusFilter === 'critical' && task.priority !== 'Critical') return false;

      // Phase filter
      if (phaseFilter !== 'all' && task.phaseId !== phaseFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description.toLowerCase().includes(q);
        const matchCategory = task.category.toLowerCase().includes(q);
        const matchCli = task.cliCommand ? task.cliCommand.toLowerCase().includes(q) : false;
        const matchNote = task.note ? task.note.toLowerCase().includes(q) : false;
        const matchTags = task.tags ? task.tags.some((t) => t.toLowerCase().includes(q)) : false;

        return matchTitle || matchDesc || matchCategory || matchCli || matchNote || matchTags;
      }

      return true;
    });
  }, [tasks, statusFilter, phaseFilter, searchQuery]);

  // Generated Markdown content for export
  const markdownRunbook = useMemo(() => {
    return generateMarkdownRunbook(spec, PHASES, tasks);
  }, [spec, tasks]);

  const handleDownloadMarkdown = () => {
    const src = spec.sourceModel || 'FG';
    const dst = spec.destinationModel || 'FG';
    downloadMarkdownFile(markdownRunbook, `FortiGate_Migration_Audit_${src}_to_${dst}.md`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Header Bar */}
      <Header
        onExportMarkdown={() => setIsExportModalOpen(true)}
        onOpenCliRef={() => setIsCliModalOpen(true)}
        onResetChecklist={handleResetChecklist}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        completionPercent={
          tasks.length > 0 ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100) : 0
        }
      />

      {/* Main Container Layout (Sidebar + Content Area) */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Sidebar Controls */}
        <Sidebar
          spec={spec}
          onChangeSpec={handleSpecChange}
          onApplyPreset={handleApplyPreset}
          dynamicCount={dynamicCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Migration Spec Summary Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                <span className="text-red-400 font-semibold">{spec.sourceModel || 'Source'}</span>
                <span>({spec.sourceFirmware})</span>
                <span className="text-slate-600">➔</span>
                <span className="text-emerald-400 font-semibold">{spec.destinationModel || 'Destination'}</span>
                <span>({spec.destinationFirmware})</span>
              </div>
              <h2 className="text-sm font-bold text-slate-200">
                Active Audit Scope: {spec.haMode} Architecture
                {spec.vdomsEnabled ? ` with Multi-VDOM Segmentation (${spec.vdomNames || 'Enabled'})` : ' (Single VDOM)'}
              </h2>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="px-2.5 py-1 text-xs font-mono font-medium bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                {tasks.length} Active Steps
              </span>
            </div>
          </div>

          {/* Progress Bar & High Level Metrics */}
          <ProgressBar tasks={tasks} phases={PHASES} />

          {/* Search, Filter & Toolbar */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            phaseFilter={phaseFilter}
            onPhaseFilterChange={setPhaseFilter}
            isExpandedAll={isAllExpanded}
            onToggleExpandAll={handleToggleExpandAll}
            onOpenAddTask={() => {
              setAddTaskDefaultPhase('planning');
              setIsAddTaskOpen(true);
            }}
          />

          {/* Checklist Phases Sections */}
          <div className="space-y-4">
            {PHASES.filter((p) => phaseFilter === 'all' || phaseFilter === p.id).map((phase) => {
              const phaseTasks = filteredTasks.filter((t) => t.phaseId === phase.id);

              return (
                <ChecklistPhase
                  key={phase.id}
                  phase={phase}
                  tasks={phaseTasks}
                  isExpanded={!!expandedPhases[phase.id]}
                  onToggleExpand={() =>
                    setExpandedPhases((prev) => ({ ...prev, [phase.id]: !prev[phase.id] }))
                  }
                  onToggleTaskComplete={handleToggleTaskComplete}
                  onUpdateTaskNote={handleUpdateTaskNote}
                  onDeleteTask={handleDeleteTask}
                  onOpenAddTaskForPhase={(pId) => {
                    setAddTaskDefaultPhase(pId);
                    setIsAddTaskOpen(true);
                  }}
                />
              );
            })}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        defaultPhaseId={addTaskDefaultPhase}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddCustomTask}
      />

      <CliReferenceModal isOpen={isCliModalOpen} onClose={() => setIsCliModalOpen(false)} />

      <ExportMarkdownModal
        isOpen={isExportModalOpen}
        markdownContent={markdownRunbook}
        onClose={() => setIsExportModalOpen(false)}
        onDownload={handleDownloadMarkdown}
      />
    </div>
  );
}
