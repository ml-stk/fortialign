import React from 'react';
import { X, Copy, Download, FileText, Check } from 'lucide-react';

interface ExportMarkdownModalProps {
  isOpen: boolean;
  markdownContent: string;
  onClose: () => void;
  onDownload: () => void;
}

export const ExportMarkdownModal: React.FC<ExportMarkdownModalProps> = ({
  isOpen,
  markdownContent,
  onClose,
  onDownload,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Export Migration Runbook (Markdown)</h3>
              <p className="text-xs text-slate-400">
                Formatted checklist state ready for GitHub, Notion, or internal runbook documentation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Markdown Text Area Preview */}
        <div className="p-4 flex-1 overflow-y-auto bg-slate-950">
          <textarea
            readOnly
            value={markdownContent}
            rows={18}
            className="w-full h-full bg-slate-950 text-slate-200 font-mono text-xs p-3 focus:outline-none border-0 resize-none selection:bg-red-500/30"
          />
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Includes all parameters, checked states, CLI commands, and engineer notes.
          </span>

          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={onDownload}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .md File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
