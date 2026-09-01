import type { ConfigurationInventory, InventoryItem } from '../analysis/configInventory';
import type { MigrationFinding } from '../utils/fortiEngine';

export type MappingStatus = 'MAPPED' | 'SUGGESTED' | 'UNMAPPED' | 'REVIEW' | 'INCOMPATIBLE' | 'NOT_APPLICABLE';

export interface HardwareMapping {
  source: string;
  target?: string;
  status: MappingStatus;
  required: boolean;
  reason: string;
  dependents: string[];
}

export interface HardwareCapabilities {
  model: string;
  physicalInterfaces: string[];
  supportsFortiLink: boolean;
  supportsSdwan: boolean;
  supportsIpsecInterface: boolean;
}

export interface HardwareMappingResult {
  mappings: HardwareMapping[];
  findings: MigrationFinding[];
}

const interfaceName = (item: InventoryItem) => item.name.replace(/^['"]|['"]$/g, '');

function interfaceDependents(inventory: ConfigurationInventory, name: string): string[] {
  const normalized = name.toLowerCase();
  return inventory.interfaces
    .filter(item => item.commands.some(command => command.toLowerCase().includes(`"${normalized}"`) || command.toLowerCase().includes(` ${normalized}`)))
    .map(item => interfaceName(item));
}

export function buildHardwareMapping(
  inventory: ConfigurationInventory,
  target: HardwareCapabilities,
  existingMapping: Record<string, string> = {},
): HardwareMappingResult {
  const findings: MigrationFinding[] = [];
  const mappings: HardwareMapping[] = [];
  const requiredNames = new Set<string>();

  for (const item of inventory.interfaces) {
    const source = interfaceName(item);
    const lower = source.toLowerCase();
    const commands = item.commands.join(' ').toLowerCase();
    const required = /wan|mgmt|lan|port|vlan|tunnel|loopback|aggregate/.test(lower) || /virtual-wan-link/.test(commands);
    if (required) requiredNames.add(source);
  }

  for (const source of requiredNames) {
    const targetName = existingMapping[source];
    const dependents = interfaceDependents(inventory, source);
    if (targetName) {
      const supported = target.physicalInterfaces.includes(targetName) || /^(lan|virtual-wan-link|vlan|aggregate|loopback)/i.test(targetName);
      mappings.push({ source, target: targetName, status: supported ? 'MAPPED' : 'INCOMPATIBLE', required: true, reason: supported ? 'Explicit target mapping supplied.' : 'Mapped target does not exist in the declared target capability set.', dependents });
      if (!supported) findings.push({ id: `HW-${String(findings.length + 1).padStart(3, '0')}`, severity: 'critical', status: 'BLOCK', category: 'Hardware', title: `Invalid target interface mapping: ${source}`, message: `${source} is mapped to ${targetName}, which is not present in the target capability profile.`, recommendation: 'Select a valid 120G interface or logical interface.' });
    } else {
      mappings.push({ source, status: 'UNMAPPED', required: true, reason: 'Required source interface has no target mapping.', dependents });
      findings.push({ id: `HW-${String(findings.length + 1).padStart(3, '0')}`, severity: 'critical', status: 'BLOCK', category: 'Hardware', title: `Unmapped required interface: ${source}`, message: `The source interface ${source} participates in the configuration and has no target mapping.`, recommendation: 'Map this interface to the appropriate 120G physical or logical interface before compiling a deployable configuration.' });
    }
  }

  if (inventory.sdwanMembers.length && !target.supportsSdwan) findings.push({ id: `HW-${String(findings.length + 1).padStart(3, '0')}`, severity: 'critical', status: 'BLOCK', category: 'Hardware', title: 'SD-WAN target capability missing', message: 'The source configuration contains SD-WAN members but the target capability profile does not support SD-WAN.', recommendation: 'Use a target profile with SD-WAN support.' });
  if (inventory.ipsecPhase1.length && !target.supportsIpsecInterface) findings.push({ id: `HW-${String(findings.length + 1).padStart(3, '0')}`, severity: 'critical', status: 'BLOCK', category: 'Hardware', title: 'IPsec interface capability missing', message: 'The source configuration contains interface-based IPsec tunnels but the target profile does not declare support.', recommendation: 'Use a target profile that supports interface-based IPsec.' });

  return { mappings, findings };
}

export const fortigate120GCapabilities: HardwareCapabilities = {
  model: 'FortiGate 120G',
  // Logical names are handled separately. This list is deliberately conservative;
  // actual appliance interface inventory should be confirmed from `get system status`
  // / `show system interface` before production compilation.
  physicalInterfaces: [],
  supportsFortiLink: true,
  supportsSdwan: true,
  supportsIpsecInterface: true,
};
