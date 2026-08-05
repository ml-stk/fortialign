import { useState } from 'react';
import { parseFortiOS, migrate300Eto400F, compileFortiOS } from './utils/fortiEngine';

export default function App() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Read the file as text
    const rawText = await file.text();
    
    // Run the engine
    const ast = parseFortiOS(rawText);
    const migratedAst = migrate300Eto400F(ast);
    const outputText = compileFortiOS(migratedAst);
    
    // Create the new downloadable .conf file
    const blob = new Blob([outputText], { type: 'text/plain' });
    setDownloadUrl(URL.createObjectURL(blob));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-100">FortiGate Migration Tool</h1>
        <p className="text-sm text-slate-400">Convert 300E configurations to 400F format</p>
      </div>

      <div className="flex gap-4 items-center bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-xl">
        {/* 1. The repurposed "Import" button */}
        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          Import 300E Config (.conf)
          {/* The actual file input is hidden, but clicking the label triggers it */}
          <input 
            type="file" 
            accept=".conf" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
        </label>

        {/* 2. The Download button (only appears after processing) */}
        {downloadUrl && (
          <a 
            href={downloadUrl} 
            download="fortigate-400F-migrated.conf"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Download 400F Config
          </a>
        )}
      </div>
    </div>
  );
}
