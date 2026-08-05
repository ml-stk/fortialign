import { useState } from 'react';
import { parseFortiOS, migrate300Eto400F, compileFortiOS } from './utils/fortiEngine';

export default function App() {
  // State to hold the text for on-screen inspection
  const [originalText, setOriginalText] = useState('');
  const [migratedText, setMigratedText] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleFileUpload = async (event: React.ChangeEvent) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. Read and display the original file
    const rawText = await file.text();
    setOriginalText(rawText);
    
    // 2. Run the engine
    const ast = parseFortiOS(rawText);
    const migratedAst = migrate300Eto400F(ast);
    const outputText = compileFortiOS(migratedAst);
    
    // 3. Display the results
    setMigratedText(outputText);
    
    // 4. Create the downloadable file
    const blob = new Blob([outputText], { type: 'text/plain' });
    setDownloadUrl(URL.createObjectURL(blob));
  };

  return (
    
      
      {/* Header & Controls */}
      
        
          FortiGate Migration Engine
          300E to 400F Configuration Converter
        
        
        
          
            
            Import 300E .conf
            
          

          {downloadUrl && (
            
              
              Download 400F .conf
            
          )}
        
      

      {/* Inspection Split Screen */}
      
        
        {/* Left Column: Original */}
        
          Original Source (300E)
          
            {originalText ? (
              {originalText}
            ) : (
              No configuration loaded.
            )}
          
        

        {/* Right Column: Results */}
        
          Migrated Output (400F)
          
            {migratedText ? (
              {migratedText}
            ) : (
              Awaiting file import...
            )}
          
        

      
    
  );
}
