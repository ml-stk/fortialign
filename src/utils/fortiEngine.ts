// Define the structure of a FortiOS configuration block
export interface FortiOSBlock {
  type: 'root' | 'config' | 'edit';
  name: string;
  commands: string[];
  children: FortiOSBlock[];
}

export function parseFortiOS(rawConfig: string): FortiOSBlock {
  const lines = rawConfig.split('\n');
  const root: FortiOSBlock = { type: 'root', name: 'root', commands: [], children: [] };
  const stack: FortiOSBlock[] = [root];

  for (let line of lines) {
    const trimmed = line.trim();
    
    // Ignore empty lines and pure comments (unless you want to preserve them)
    if (!trimmed || trimmed.startsWith('#')) continue;

    const currentBlock = stack[stack.length - 1];

    if (trimmed.startsWith('config ')) {
      const newBlock: FortiOSBlock = { 
        type: 'config', 
        name: trimmed.replace('config ', ''), 
        commands: [], 
        children: [] 
      };
      currentBlock.children.push(newBlock);
      stack.push(newBlock);
    } 
    else if (trimmed.startsWith('edit ')) {
      const newBlock: FortiOSBlock = { 
        type: 'edit', 
        name: trimmed.replace('edit ', ''), 
        commands: [], 
        children: [] 
      };
      currentBlock.children.push(newBlock);
      stack.push(newBlock);
    } 
    else if (trimmed === 'next' || trimmed === 'end') {
      // Step back up the tree
      if (stack.length > 1) stack.pop();
    } 
    else {
      // This captures 'set', 'unset', and other parameters
      currentBlock.commands.push(trimmed);
    }
  }
  
  return root;
}

export function migrate300Eto400F(ast: FortiOSBlock): FortiOSBlock {
  // Deep clone the AST so we don't mutate the original upload
  const newAst = JSON.parse(JSON.stringify(ast)) as FortiOSBlock;

  // Define your STK physical interface mapping here
  const interfaceMapping: Record<string, string> = {
    '"port1"': '"x1"',
    '"port2"': '"x2"',
    // Example: mapping a standard SFP to a 10G/25G interface
    '"port17"': '"port21"', 
  };

  // Blocks that should be completely wiped during a hardware migration
  const omittedConfigs = [
    'system npu',
    'system global',
    'system virtual-switch',
    'system switch-interface'
  ];

  function traverse(block: FortiOSBlock) {
    // 1. Rename interfaces inside 'config system interface'
    if (block.type === 'edit' && interfaceMapping[block.name]) {
      block.name = interfaceMapping[block.name];
    }

    // 2. Scan and replace interface references inside actual commands 
    // (e.g., firewall policies, VIPs, static routes)
    block.commands = block.commands.map(cmd => {
      let updatedCmd = cmd;
      Object.entries(interfaceMapping).forEach(([oldPort, newPort]) => {
        // Use regex boundaries to prevent partial matches 
        // (e.g., don't rename "port10" when looking for "port1")
        const regex = new RegExp(`(?<=\\s|^)${oldPort}(?=\\s|$)`, 'g');
        updatedCmd = updatedCmd.replace(regex, newPort);
      });
      return updatedCmd;
    });

    // 3. Filter out hardware-specific child blocks
    block.children = block.children.filter(child => {
      if (child.type === 'config' && omittedConfigs.includes(child.name)) {
        console.warn(`Stripped hardware-specific block: config ${child.name}`);
        return false; 
      }
      return true;
    });

    // Recursively process all nested blocks
    block.children.forEach(traverse);
  }

  // Kick off the traversal from the root
  traverse(newAst);
  return newAst;
}

export function compileFortiOS(block: FortiOSBlock, indentLevel = 0): string {
  // If we are at the root, just compile all children without indenting
  if (block.type === 'root') {
    return block.children.map(child => compileFortiOS(child, 0)).join('\n');
  }

  const indent = '    '.repeat(indentLevel);
  let output = '';

  // Open the block
  if (block.type === 'config') {
    output += `${indent}config ${block.name}\n`;
  } else if (block.type === 'edit') {
    output += `${indent}edit ${block.name}\n`;
  }

  // Print all commands (sets, unsets) inside this block
  for (const cmd of block.commands) {
    output += `${indent}    ${cmd}\n`;
  }

  // Recursively compile nested children
  for (const child of block.children) {
    output += compileFortiOS(child, indentLevel + 1);
  }

  // Close the block
  if (block.type === 'config') {
    output += `${indent}end\n`;
  } else if (block.type === 'edit') {
    output += `${indent}next\n`;
  }

  return output;
}
