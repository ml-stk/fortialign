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
  for (const child of block.children) { const c = countBlocks(child); configs += c.configs; edits += c.edits; commands += c.commands; }
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

function uniquifyFindingIds(findings: MigrationFinding[]): MigrationFinding[] {
  const seen = new Map<string, number>();
  return findings.map(finding => {
    const count = (seen.get(finding.id) ?? 0) + 1;
    seen.set(finding.id, count);
    return count === 1 ? finding : { ...finding, id: `${finding.id}-${count}` };
  });
}

function cleanInterfaceName(value: string): string {
  return value.replace(/^['"]|['"]$/g, '').trim();
}

interface PhysicalInterfaceInfo {
  name: string;
  disabled: boolean;
}

function physicalInterfaceInfo(block: FortiOSBlock): PhysicalInterfaceInfo[] {
  const interfaces: PhysicalInterfaceInfo[] = [];
  const visit = (node: FortiOSBlock, inSystemInterface: boolean) => {
    const currentIsSystemInterface = node.type === 'config' && node.name.toLowerCase() === 'system interface';
    const isPhysical = node.commands.some(command => /^set\s+type\s+physical\b/i.test(command));
    if (node.type === 'edit' && inSystemInterface && isPhysical) {
      interfaces.push({
        name: cleanInterfaceName(node.name),
        disabled: node.commands.some(command => /^set\s+status\s+disable\b/i.test(command)),
      });
    }
    node.children.forEach(child => visit(child, inSystemInterface || currentIsSystemInterface));
  };
  visit(block, false);
  return interfaces;
}

function haHeartbeatInterfaces(block: FortiOSBlock): Set<string> {
  const interfaces = new Set<string>();
  const visit = (node: FortiOSBlock, inSystemHa: boolean) => {
    const currentIsSystemHa = node.type === 'config' && node.name.toLowerCase() === 'system ha';
    if (inSystemHa || currentIsSystemHa) {
      for (const command of node.commands) {
        const match = command.match(/^set\s+hbdev\s+(.+)$/i);
        if (!match) continue;
        const tokens = match[1].match(/(?:"[^"]+"|'[^']+'|\S+)/g) ?? [];
        for (const token of tokens) {
          const value = cleanInterfaceName(token);
          if (value && !/^\d+(?:\.\d+)?$/.test(value)) interfaces.add(value);
        }
      }
    }
    node.children.forEach(child => visit(child, inSystemHa || currentIsSystemHa));
  };
  visit(block, false);
  return interfaces;
}

function interfaceMappingFindings(source: FortiOSBlock, profile: MigrationProfile): MigrationFinding[] {
  const physical = physicalInterfaceInfo(source);
  const mapped = new Set(Object.keys(profile.interfaceMapping).map(cleanInterfaceName));
  const haInterfaces = haHeartbeatInterfaces(source);
  const findings: MigrationFinding[] = [];
  const unmapped = physical.filter(item => !mapped.has(item.name) && !item.disabled && !haInterfaces.has(item.name));

  if (unmapped.length) {
    findings.push({
      id: 'HW-001',
      severity: 'medium',
      status: 'REVIEW',
      category: 'Hardware',
      title: 'Source-specific physical interface requires target assignment',
      message: `The source contains ${unmapped.length} active physical interface(s) without an exact target mapping: ${unmapped.map(item => item.name).join(', ')}.`,
      sourcePath: 'root/system interface',
      recommendation: 'Review the target appliance port layout and assign an appropriate target interface for each source-specific interface. FortiAlign does not make an arbitrary hardware-port assignment.',
    });
  }

  physical.filter(item => !mapped.has(item.name) && haInterfaces.has(item.name)).forEach(item => findings.push({
    id: 'HW-002',
    severity: 'medium',
    status: 'REVIEW',
    category: 'Hardware',
    title: 'HA heartbeat interface requires target validation',
    message: `Source interface ${item.name} is used as an HA heartbeat interface and has no exact target mapping.`,
    sourcePath: 'root/system ha',
    recommendation: 'Confirm the target HA/management port design and rebuild the heartbeat binding explicitly on the destination appliance.',
  }));

  physical.filter(item => !mapped.has(item.name) && item.disabled && !haInterfaces.has(item.name)).forEach(item => findings.push({
    id: 'HW-003',
    severity: 'low',
    status: 'REVIEW',
    category: 'Hardware',
    title: 'Disabled physical interface not mapped',
    message: `Source interface ${item.name} is a disabled physical interface without an exact target mapping.`,
    sourcePath: 'root/system interface',
    recommendation: 'Confirm that the interface is intentionally unused. It does not require an automatic target-port assignment unless it is being brought into service.',
  }));

  return findings;
}

function scanSecurityRisks(block: FortiOSBlock): MigrationFinding[] {
  const findings: MigrationFinding[] = []; let n = 1;
  const credentialPaths = new Set<string>();
  const visit = (node: FortiOSBlock, path: string) => {
    for (const command of node.commands) {
      const lower = command.toLowerCase();
      if (/\b(des|3des)\b/.test(lower)) findings.push({ id: `SEC-${String(n++).padStart(3, '0')}`, severity: 'high', status: 'REVIEW', category: 'Cryptography', title: 'Legacy encryption detected', message: `${command} uses DES/3DES cryptography.`, sourcePath: path, recommendation: 'Verify peer compatibility and migrate to an approved modern proposal where possible.' });
      else if (/\bsha1\b/.test(lower)) findings.push({ id: `SEC-${String(n++).padStart(3, '0')}`, severity: 'high', status: 'REVIEW', category: 'Cryptography', title: 'SHA-1 detected', message: `${command} references SHA-1.`, sourcePath: path, recommendation: 'Verify remote compatibility and replace SHA-1 with SHA-256 or stronger where supported.' });
      if (/^set\s+allowaccess\b/i.test(command) && /\bhttp\b/i.test(command)) findings.push({ id: `MGMT-${String(n++).padStart(3, '0')}`, severity: 'high', status: 'REVIEW', category: 'Management', title: 'HTTP administrative access enabled', message: 'The source configuration permits HTTP management access.', sourcePath: path, recommendation: 'Disable HTTP management unless explicitly required; prefer HTTPS/SSH restricted to management sources.' });
      if (/^set\s+admin-https-redirect\s+disable\b/i.test(command)) findings.push({ id: `MGMT-${String(n++).padStart(3, '0')}`, severity: 'medium', status: 'REVIEW', category: 'Management', title: 'HTTPS redirect disabled', message: 'HTTP-to-HTTPS administrative redirect is disabled.', sourcePath: path, recommendation: 'Enable the redirect if HTTP remains enabled, or remove HTTP administration entirely.' });
      if (/^set\s+switch-controller\s+enable\b/i.test(command)) findings.push({ id: `HW-${String(n++).padStart(3, '0')}`, severity: 'medium', status: 'REVIEW', category: 'Hardware', title: 'FortiSwitch controller enabled', message: 'Switch-controller configuration may depend on target interface architecture.', sourcePath: path, recommendation: 'Confirm FortiLink/FortiSwitch usage and map the target interface architecture before migration.' });
      if (/\b(set\s+(password|passwd|psksecret|secret)|set\s+username)\b/i.test(command) && !credentialPaths.has(path)) {
        credentialPaths.add(path);
        findings.push({ id: `SEC-${String(n++).padStart(3, '0')}`, severity: 'high', status: 'MANUAL', category: 'Secrets', title: 'Credential/secret-bearing configuration detected', message: 'A credential or secret-bearing command exists in this source configuration object. Individual secret values are intentionally not included in the finding.', sourcePath: path, recommendation: 'Do not expose secrets in reports. Verify portability or require secure re-entry on the target.' });
      }
    }
    node.children.forEach(child => visit(child, `${path}/${child.name}`));
  };
  visit(block, block.name); return uniquifyFindingIds(findings);
}

export function migrateWithProfile(source: FortiOSBlock, profile: MigrationProfile): MigrationResult {
  const ast = JSON.parse(JSON.stringify(source)) as FortiOSBlock;
  const findings: MigrationFinding[] = interfaceMappingFindings(source, profile);
  let transformedCommands = 0;
  const reviewConfigs = new Set(profile.reviewConfigs ?? []);
  const visit = (node: FortiOSBlock, path: string) => {
    if (node.type === 'edit' && profile.interfaceMapping[node.name]) {
      const mappedName = profile.interfaceMapping[node.name];
      if (mappedName !== node.name) {
        node.name = mappedName;
        transformedCommands++;
      }
    }
    node.commands = node.commands.map(command => {
      const transformed = replaceCliToken(command, profile.interfaceMapping);
      if (transformed !== command) transformedCommands++;
      return transformed;
    });
    if (node.type === 'config' && reviewConfigs.has(node.name)) findings.push({ id: `HW-${String(findings.length + 1).padStart(3, '0')}`, severity: 'high', status: 'MANUAL', category: 'Hardware', title: `Target compatibility review: ${node.name}`, message: `Configuration block ${node.name} is hardware/platform-sensitive and was retained.`, sourcePath: path, recommendation: 'Explicitly determine whether the block should be retained, transformed, or removed for the target platform.' });
    node.children.forEach(child => visit(child, `${path}/${child.name}`));
  };
  visit(ast, 'root'); findings.push(...scanSecurityRisks(ast)); const counts = countBlocks(ast);
  return { ast, findings: uniquifyFindingIds(findings), statistics: { ...counts, transformedCommands } };
}

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
  return uniquifyFindingIds(findings);
}
