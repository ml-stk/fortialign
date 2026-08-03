import React from 'react';
import { ShieldCheck, FileDown, Terminal, RotateCcw, Copy, Download, Upload } from 'lucide-react';

interface HeaderProps {
  onExportMarkdown: () => void;
  onOpenCliRef: () => void;
  onResetChecklist: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  completionPercent: number;
}

export const Header: React.FC<HeaderProps> = ({
  onExportMarkdown,
  onOpenCliRef,
  onResetChecklist,
  onExportJson,
  onImportJson,
  completionPercent,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-950/60 border border-red-500/30 rounded-lg text-red-500 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                FortiGate Migration Audit
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
                FortiOS 7.x Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Appliance Hardware Transition & Security Audit Checklist Generator
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* CLI Reference Button */}
          <button
            onClick={onOpenCliRef}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="View FortiOS Migration CLI Commands"
          >
            <Terminal className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden md:inline">CLI Reference</span>
          </button>

          {/* Import/Export Config Dropdown or buttons */}
          <div className="relative group">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportJson}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={onExportJson}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Save State as JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Export JSON</span>
            </button>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Import Saved State JSON"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">Import JSON</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={onResetChecklist}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
            title="Reset Checklist Progress"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Export to Markdown - Primary CTA */}
          <button
            onClick={onExportMarkdown}
            className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-all cursor-pointer border border-red-500/40"
          >
            <FileDown className="w-4 h-4" />
            <span>Export to Markdown</span>
          </button>
        </div>
      </div>
    </header>
  );
};
