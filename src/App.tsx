import { useState } from 'react';
import { parseFortiOS, migrate300Eto400F, compileFortiOS } from './utils/fortiEngine';

export default function App() {
  const [originalText, setOriginalText] = useState<string>('');
  const [migratedText, setMigratedText] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. Read the uploaded .conf file as text
    const rawText = await file.text();
    setOriginalText(rawText);
    
    // 2. Run through the FortiGate AST Parser & Migration Engine
    const ast = parseFortiOS(rawText);
    const migratedAst = migrate300Eto400F(ast);
    const outputText = compileFortiOS(migratedAst);
    
    // 3. Display migrated text and create download link
    setMigratedText(outputText);
    const blob = new Blob([outputText], { type: 'text/plain' });
    setDownloadUrl(URL.createObjectURL(blob));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col gap-6">
      
      {/* Header & Controls */}
      <header className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 p-4 rounded-lg border border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">FortiGate Configuration Migration Tool</h1>
          <p className="text-sm text-slate-400">Convert 300E infrastructure backups to 400F format</p>
        </div>
        
        <div className="flex gap-4 items-center">
          {/* Explicit .conf file uploader (No JSON references) */}
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-medium text-sm shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            Import 300E .conf File
            <input 
              type="file" 
              accept=".conf, .txt" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
          </label>

          {downloadUrl && (
            <a 
              href={downloadUrl} 
              download="fortigate-400F-migrated.conf" 
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors font-medium text-sm shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Download 400F .conf
            </a>
          )}
        </div>
      </header>

      {/* Side-by-Side Inspection Panels */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
        
        {/* Left: Original Source */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Original Source Configuration (300E)</h2>
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-4 overflow-auto max-h-[70vh]">
            {originalText ? (
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">{originalText}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                No configuration imported yet. Click "Import 300E .conf File" above.
              </div>
            )}
          </div>
        </div>

        {/* Right: Migrated Output */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Migrated Output Configuration (400F)</h2>
          <div className="flex-1 bg-slate-900 border border-emerald-900/30 rounded-lg p-4 overflow-auto max-h-[70vh]">
            {migratedText ? (
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">{migratedText}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                Awaiting file import to generate conversion...
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
