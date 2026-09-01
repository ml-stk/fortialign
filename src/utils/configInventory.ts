import type { FortiOSBlock } from './fortiEngine';

export type InventoryCategory =
  | 'interfaces' | 'addresses' | 'addressGroups' | 'services' | 'serviceGroups'
  | 'policies' | 'vips' | 'ippools' | 'routes' | 'sdwanMembers' | 'sdwanRules'
  | 'sdwanHealthChecks' | 'ipsecPhase1' | 'ipsecPhase2' | 'userGroups'
  | 'authServers' | 'securityProfiles' | 'certificates' | 'dhcpServers'
  | 'management' | 'other';

export interface InventoryItem {
  id: string;
  category: InventoryCategory;
  name: string;
  path: string;
  commands: string[];
  references: string[];
  enabled?: boolean;
}

export interface ConfigurationInventory {
  items: InventoryItem[];
  counts: Record<InventoryCategory, number>;
}

const CATEGORY_BY_CONFIG: Record<string, InventoryCategory> = {
  'system interface': 'interfaces',
  'firewall address': 'addresses',
  'firewall addrgrp': 'addressGroups',
  'firewall service custom': 'services',
  'firewall service group': 'serviceGroups',
  'firewall policy': 'policies',
  'firewall vip': 'vips',
  'firewall ippool': 'ippools',
  'router static': 'routes',
  'system virtual-wan-link': 'sdwanMembers',
  'vpn ipsec phase1-interface': 'ipsecPhase1',
  'vpn ipsec phase2-interface': 'ipsecPhase2',
  'user group': 'userGroups',
  'user ldap': 'authServers',
  'user radius': 'authServers',
  'certificate local': 'certificates',
  'system dhcp server': 'dhcpServers',
  'system snmp community': 'management',
  'system admin': 'management',
};

const EMPTY_COUNTS = (): Record<InventoryCategory, number> => ({
  interfaces: 0, addresses: 0, addressGroups: 0, services: 0, serviceGroups: 0,
  policies: 0, vips: 0, ippools: 0, routes: 0, sdwanMembers: 0, sdwanRules: 0,
  sdwanHealthChecks: 0, ipsecPhase1: 0, ipsecPhase2: 0, userGroups: 0,
  authServers: 0, securityProfiles: 0, certificates: 0, dhcpServers: 0,
  management: 0, other: 0,
});

function valuesFromCommand(command: string): string[] {
  const match = command.match(/^(?:set|append|unselect)\s+\S+\s+(.+)$/i);
  if (!match) return [];
  return match[1].split(/\s+/).map(value => value.replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

function inferCategory(configName: string): InventoryCategory {
  if (CATEGORY_BY_CONFIG[configName]) return CATEGORY_BY_CONFIG[configName];
  if (configName.startsWith('system certificate') || configName === 'certificate local') return 'certificates';
  if (configName.includes('webfilter') || configName.includes('dnsfilter') || configName.includes('antivirus') || configName.includes('ips') || configName.includes('application')) return 'securityProfiles';
  if (configName.includes('sdwan') || configName.includes('virtual-wan')) return configName.includes('health-check') ? 'sdwanHealthChecks' : 'sdwanRules';
  return 'other';
}

function collectReferences(commands: string[]): string[] {
  const references = new Set<string>();
  for (const command of commands) {
    if (/^(set|append|unselect)\s+(srcaddr|dstaddr|service|srcintf|dstintf|groups|users|member|interface|poolname|webfilter-profile|dnsfilter-profile|av-profile|ips-sensor|application-list|certificate|authusrgrp)\b/i.test(command)) {
      for (const value of valuesFromCommand(command)) {
        if (!['all', 'any'].includes(value.toLowerCase())) references.add(value);
      }
    }
  }
  return [...references];
}

export function buildConfigurationInventory(root: FortiOSBlock): ConfigurationInventory {
  const items: InventoryItem[] = [];
  const counts = EMPTY_COUNTS();
  let sequence = 1;

  const visitConfig = (node: FortiOSBlock, path: string) => {
    if (node.type === 'config') {
      const category = inferCategory(node.name);
      if (node.children.length === 0 && node.commands.length > 0) {
        const item: InventoryItem = {
          id: `INV-${String(sequence++).padStart(5, '0')}`,
          category, name: node.name, path, commands: [...node.commands], references: collectReferences(node.commands),
        };
        items.push(item); counts[category]++;
      }
      for (const child of node.children) {
        if (child.type === 'edit') {
          const item: InventoryItem = {
            id: `INV-${String(sequence++).padStart(5, '0')}`,
            category, name: child.name, path: `${path}/${child.name}`, commands: [...child.commands],
            references: collectReferences(child.commands),
            enabled: !child.commands.some(command => /^set\s+status\s+disable\b/i.test(command)),
          };
          items.push(item); counts[category]++;
        }
      }
    }
    node.children.forEach(child => visitConfig(child, `${path}/${child.name}`));
  };

  visitConfig(root, 'root');
  return { items, counts };
}

export function inventoryByCategory(inventory: ConfigurationInventory, category: InventoryCategory): InventoryItem[] {
  return inventory.items.filter(item => item.category === category);
}
