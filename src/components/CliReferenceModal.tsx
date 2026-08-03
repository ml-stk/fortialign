import React from 'react';
import { X, Terminal, Copy, Check, Search } from 'lucide-react';
import { CLI_COMMAND_REFS } from '../data/defaultChecklist';

interface CliReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CliReferenceModal: React.FC<CliReferenceModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<string>('All');
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  if (!isOpen) return null;

  const filteredCommands = CLI_COMMAND_REFS.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.command.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">FortiOS Migration CLI Reference</h3>
              <p className="text-xs text-slate-400">Essential troubleshooting & audit CLI commands</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-950/50 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search CLI commands, e.g. checksum, ha, bgp, vdom..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-red-500 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {['All', 'System', 'HA', 'VDOM', 'Routing', 'VPN', 'FortiGuard'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  category === cat
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Command List Body */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching CLI commands found for search.
            </div>
          ) : (
            filteredCommands.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 rounded">
                      {item.category}
                    </span>
                    <h4 className="font-semibold text-slate-200 text-xs">{item.title}</h4>
                  </div>

                  <button
                    onClick={() => handleCopy(item.command, idx)}
                    className="px-2 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center space-x-1 shrink-0 cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">{item.description}</p>

                <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{item.command}</pre>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
