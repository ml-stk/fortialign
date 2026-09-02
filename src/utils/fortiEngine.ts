// FortiAlign migration core. The engine is intentionally data-driven so a
// migration profile can describe source/target hardware and firmware without
// hard-coding a single model pair.
export interface FortiOSBlock {
  type: 'root' | 'config' | 'edit';
  name: string;
  commands: string[];
  children: FortiOSBlock[];
}

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingStatus = 'BLOCK' | 'MANUAL' | 'REVIEW' | 'TRANSFORMED' | 'PASS';

export interface MigrationFinding {
  id: string;
  severity: FindingSeverity;
  status: FindingStatus;
  category: string;
  title: string;
  message: string;
  sourcePath?: string;
  recommendation: string;
}

export interface MigrationProfile {
  sourceModel: string;
  destinationModel: string;
  sourceFirmware: string;
  destinationFirmware: string;
  interfaceMapping: Record<string, string>;
  reviewConfigs?: string[];
}

export interface MigrationResult {
  ast: FortiOSBlock;
  findings: MigrationFinding[];
  statistics: {
    configs: number;
    edits: number;
    commands: number;
    transformedCommands: number;
  };
}

export function parseFortiOS(rawConfig: string): FortiOSBlock {
  const root: FortiOSBlock = { type: 'root', name: 'root', commands: [], children: [] };
  const stack: FortiOSBlock[] = [root];

  for (const rawLine of rawConfig.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const current = stack[stack.length - 1];
    if (trimmed.startsWith('config ')) {
      const block: FortiOSBlock = { type: 'config', name: trimmed.slice(7).trim(), commands: [], children: [] };
      current.children.push(block); stack.push(block);
    } else if (trimmed.startsWith('edit ')) {
      const block: FortiOSBlock = { type: 'edit', name: trimmed.slice(5).trim(), commands: [], children: [] };
      current.children.push(block); stack.push(block);
    } else if (trimmed === 'next' || trimmed === 'end') {
      if (stack.length > 1) stack.pop();
    } else current.commands.push(trimmed);
  }
  return root;
}

function countBlocks(block: FortiOSBlock): { configs: number; edits: number; commands: number } {
  let configs = block.type === 'config' ? 1 : 0;
  let edits = block.type === 'edit' ? 1 : 0;
  let commands = block.commands.length;
  for (const child of block.children) {
    const c = countBlocks(child); configs += c.configs; edits += c.edits; commands += c.commands;
  }
  return { configs, edits, commands };
}

function replaceCliToken(command: string, mapping: Record<string, string>): string {
  let result = command;
  for (const [source, target] of Object.entries(mapping)) {
    const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, 'g'), `$1${target}`);
  }
  return result;
}

function scanSecurityRisks(block: FortiOSBlock): MigrationFinding[] {
  const findings: MigrationFinding[] = []; let n = 1;
  const visit = (node: FortiOSBlock, path: string) => {
    for (const command of node.commands) {
      const lower = command.toLowerCase();
      if (/\b(des|3des)\b/.test(lower)) findings.push({ id: `SEC-${String(n++).padStart(3, '0')}`, severity: 'high', status: 'REVIEW', category: 'Cryptography', title: 'Legacy encryption detected', message: `${command} uses DES/3DES cryptography.`, sourcePath: path, recommendation: 'Verify peer compatibility and migrate to an approved modern proposal where possible.' });
      else if (/\bsha1\b/.test(lower)) findings.push({ id: `SEC-${String(n++).padStart(3, '0')}`, severity: 'high', status: 'REVIEW', category: 'Cryptography', title: 'SHA-1 detected', message: `${command} references SHA-1.`, sourcePath: path, recommendation: 'Verify remote compatibility and replace SHA-1 with SHA-256 or stronger where supported.' });
      if (/^set\s+allowaccess\b/i.test(command) && /\bhttp\b/i.test(command)) findings.push({ id: `MGMT-${String(n++).padStart(3, '0')}`, severity: 'high', status: 'REVIEW', category: 'Management', title: 'HTTP administrative access enabled', message: 'The source configuration permits HTTP management access.', sourcePath: path, recommendation: 'Disable HTTP management unless explicitly required; prefer HTTPS/SSH restricted to management sources.' });
      if (/^set\s+admin-https-redirect\s+disable\b/i.test(command)) findings.push({ id: `MGMT-${String(n++).padStart(3, '0')}`, severity: 'medium', status: 'REVIEW', category: 'Management', title: 'HTTPS redirect disabled', message: 'HTTP-to-HTTPS administrative redirect is disabled.', sourcePath: path, recommendation: 'Enable the redirect if HTTP remains enabled, or remove HTTP administration entirely.' });
      if (/^set\s+switch-controller\s+enable\b/i.test(command)) findings.push({ id: `HW-${String(n++).padStart(3, '0')}`, severity: 'medium', status: 'REVIEW', category: 'Hardware', title: 'FortiSwitch controller enabled', message: 'Switch-controller configuration may depend on target interface architecture.', sourcePath: path, recommendation: 'Confirm FortiLink/FortiSwitch usage and map the target interface architecture before migration.' });
      if (/\b(set\s+(password|passwd|psksecret|secret)|set\s+username)\b/i.test(command)) findings.push({ id: `SEC-${String(n++).padStart(3, '0')}`, severity: 'high', status: 'MANUAL', category: 'Secrets', title: 'Credential/secret-bearing command detected', message: 'A credential or secret-bearing command exists in the source.', sourcePath: path, recommendation: 'Do not expose secrets in reports. Verify portability or require secure re-entry on the target.' });
    }
    node.children.forEach(child => visit(child, `${path}/${child.name}`));
  };
  visit(block, block.name); return findings;
}

export function migrateWithProfile(source: FortiOSBlock, profile: MigrationProfile): MigrationResult {
  const ast = JSON.parse(JSON.stringify(source)) as FortiOSBlock; const findings: MigrationFinding[] = []; let transformedCommands = 0;
  const reviewConfigs = new Set(profile.reviewConfigs ?? []);
  const visit = (node: FortiOSBlock, path: string) => {
    if (node.type === 'edit' && profile.interfaceMapping[node.name]) { node.name = profile.interfaceMapping[node.name]; transformedCommands++; }
    node.commands = node.commands.map(command => { const transformed = replaceCliToken(command, profile.interfaceMapping); if (transformed !== command) transformedCommands++; return transformed; });
    if (node.type === 'config' && reviewConfigs.has(node.name)) findings.push({ id: `HW-${String(findings.length + 1).padStart(3, '0')}`, severity: 'high', status: 'MANUAL', category: 'Hardware', title: `Target compatibility review: ${node.name}`, message: `Configuration block ${node.name} is hardware/platform-sensitive and was retained.`, sourcePath: path, recommendation: 'Explicitly determine whether the block should be retained, transformed, or removed for the target platform.' });
    node.children.forEach(child => visit(child, `${path}/${child.name}`));
  };
  visit(ast, 'root'); findings.push(...scanSecurityRisks(ast)); const counts = countBlocks(ast);
  return { ast, findings, statistics: { ...counts, transformedCommands } };
}

// Legacy compatibility wrapper. New code should use migrateWithProfile().
export function migrate300Eto400F(ast: FortiOSBlock): FortiOSBlock {
  return migrateWithProfile(ast, { sourceModel: 'FortiGate 300E', destinationModel: 'FortiGate 400F', sourceFirmware: 'FortiOS 7.x', destinationFirmware: 'FortiOS 7.x', interfaceMapping: { '"port1"': '"x1"', '"port2"': '"x2"', '"port17"': '"port21"' } }).ast;
}

export function compileFortiOS(block: FortiOSBlock, indentLevel = 0): string {
  if (block.type === 'root') return block.children.map(child => compileFortiOS(child, 0)).join('\n');
  const indent = '    '.repeat(indentLevel); let output = block.type === 'config' ? `${indent}config ${block.name}\n` : `${indent}edit ${block.name}\n`;
  for (const command of block.commands) output += `${indent}    ${command}\n`;
  for (const child of block.children) output += compileFortiOS(child, indentLevel + 1);
  output += block.type === 'config' ? `${indent}end\n` : `${indent}next\n`; return output;
}

export function validateMigration(result: MigrationResult, profile: MigrationProfile): MigrationFinding[] {
  const findings = [...result.findings];
  if (!profile.destinationModel || !profile.destinationFirmware) findings.push({ id: 'VAL-001', severity: 'critical', status: 'BLOCK', category: 'Target', title: 'Target profile incomplete', message: 'Destination model and firmware are required.', recommendation: 'Select an explicit target appliance and FortiOS release before generating a migration.' });
  if (Object.keys(profile.interfaceMapping).length === 0) findings.push({ id: 'HW-001', severity: 'critical', status: 'BLOCK', category: 'Hardware', title: 'Interface mapping not defined', message: 'No source-to-target interface mapping has been supplied.', recommendation: 'Map all required source interfaces before deployment.' });
  return findings;
}
