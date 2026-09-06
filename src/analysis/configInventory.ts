import type { FortiOSBlock } from '../utils/fortiEngine';

export interface InventoryItem {
  name: string;
  path: string;
  commands: string[];
  references: string[];
}

export interface ConfigurationInventory {
  model?: string;
  firmware?: string;
  hostname?: string;
  vdoms: string[];
  interfaces: InventoryItem[];
  addressObjects: InventoryItem[];
  addressGroups: InventoryItem[];
  services: InventoryItem[];
  serviceGroups: InventoryItem[];
  firewallPolicies: InventoryItem[];
  virtualIps: InventoryItem[];
  ipPools: InventoryItem[];
  staticRoutes: InventoryItem[];
  sdwanMembers: InventoryItem[];
  sdwanServices: InventoryItem[];
  sdwanHealthChecks: InventoryItem[];
  ipsecPhase1: InventoryItem[];
  ipsecPhase2: InventoryItem[];
  userGroups: InventoryItem[];
  localUsers: InventoryItem[];
  authenticationServers: InventoryItem[];
  securityProfiles: InventoryItem[];
  certificates: InventoryItem[];
  dhcpServers: InventoryItem[];
  management: InventoryItem[];
  otherConfigs: InventoryItem[];
}

const emptyInventory = (): ConfigurationInventory => ({
  vdoms: [], interfaces: [], addressObjects: [], addressGroups: [], services: [], serviceGroups: [],
  firewallPolicies: [], virtualIps: [], ipPools: [], staticRoutes: [], sdwanMembers: [], sdwanServices: [],
  sdwanHealthChecks: [], ipsecPhase1: [], ipsecPhase2: [], userGroups: [], localUsers: [], authenticationServers: [],
  securityProfiles: [], certificates: [], dhcpServers: [], management: [], otherConfigs: []
});

function commandValue(commands: string[], key: string): string | undefined {
  const line = commands.find(c => new RegExp(`^set\\s+${key}\\s+`, 'i').test(c));
  return line?.replace(new RegExp(`^set\\s+${key}\\s+`, 'i'), '').trim();
}

function references(commands: string[]): string[] {
  const result = new Set<string>();
  for (const command of commands) {
    if (/^(set|append|unselect)\s+/i.test(command)) {
      const tokens = command.split(/\s+/).slice(2);
      for (const token of tokens) {
        if (!/^(all|any|none)$/i.test(token)) result.add(token.replace(/^['"]|['"]$/g, ''));
      }
    }
  }
  return [...result];
}

function item(node: FortiOSBlock, path: string): InventoryItem {
  return { name: node.name, path, commands: [...node.commands], references: references(node.commands) };
}

// Only classify edit nodes that are direct children of the named FortiOS
// configuration table. Nested edits (for example webfilter ftgd filters,
// IPS entries, or application-list entries) are configuration internals, not
// independent inventory objects. Counting them as profiles massively
// inflates orphan candidates.
function isDirectEdit(path: string, section: string): boolean {
  const prefix = `root/${section.toLowerCase()}/`;
  const lower = path.toLowerCase();
  if (!lower.startsWith(prefix)) return false;
  return lower.slice(prefix.length).split('/').length === 1;
}

export function buildConfigurationInventory(root: FortiOSBlock): ConfigurationInventory {
  const inventory = emptyInventory();
  const visit = (node: FortiOSBlock, path: string) => {
    if (node.type === 'edit') {
      const entry = item(node, path);
      if (isDirectEdit(path, 'system interface')) inventory.interfaces.push(entry);
      else if (isDirectEdit(path, 'firewall address')) inventory.addressObjects.push(entry);
      else if (isDirectEdit(path, 'firewall addrgrp')) inventory.addressGroups.push(entry);
      else if (isDirectEdit(path, 'firewall service custom')) inventory.services.push(entry);
      else if (isDirectEdit(path, 'firewall service group')) inventory.serviceGroups.push(entry);
      else if (isDirectEdit(path, 'firewall policy')) inventory.firewallPolicies.push(entry);
      else if (isDirectEdit(path, 'firewall vip')) inventory.virtualIps.push(entry);
      else if (isDirectEdit(path, 'firewall ippool')) inventory.ipPools.push(entry);
      else if (isDirectEdit(path, 'router static')) inventory.staticRoutes.push(entry);
      else if (isDirectEdit(path, 'system sdwan members')) inventory.sdwanMembers.push(entry);
      else if (isDirectEdit(path, 'system sdwan service')) inventory.sdwanServices.push(entry);
      else if (isDirectEdit(path, 'system sdwan health-check')) inventory.sdwanHealthChecks.push(entry);
      else if (isDirectEdit(path, 'vpn ipsec phase1')) inventory.ipsecPhase1.push(entry);
      else if (isDirectEdit(path, 'vpn ipsec phase2')) inventory.ipsecPhase2.push(entry);
      else if (isDirectEdit(path, 'user group')) inventory.userGroups.push(entry);
      else if (isDirectEdit(path, 'user local')) inventory.localUsers.push(entry);
      else if (isDirectEdit(path, 'user ldap') || isDirectEdit(path, 'user radius') || isDirectEdit(path, 'user tacacs') || isDirectEdit(path, 'user fsso') || isDirectEdit(path, 'user rssso')) inventory.authenticationServers.push(entry);
      else if (
        isDirectEdit(path, 'antivirus profile') ||
        isDirectEdit(path, 'ips sensor') ||
        isDirectEdit(path, 'webfilter profile') ||
        isDirectEdit(path, 'dnsfilter profile') ||
        isDirectEdit(path, 'application list') ||
        isDirectEdit(path, 'firewall ssl-ssh-profile') ||
        isDirectEdit(path, 'file-filter profile') ||
        isDirectEdit(path, 'emailfilter profile')
      ) inventory.securityProfiles.push(entry);
      else if (isDirectEdit(path, 'system dhcp server')) inventory.dhcpServers.push(entry);
      else if (path.toLowerCase().includes('certificate')) inventory.certificates.push(entry);
      else if (path.toLowerCase().includes('system admin')) inventory.management.push(entry);
      else inventory.otherConfigs.push(entry);
    }
    node.children.forEach(child => visit(child, `${path}/${child.name}`));
  };
  visit(root, 'root');

  const globalCommands = root.commands;
  inventory.hostname = commandValue(globalCommands, 'hostname');
  inventory.model = commandValue(globalCommands, 'model');
  inventory.firmware = commandValue(globalCommands, 'firmware');
  return inventory;
}

export function inventoryTotals(inventory: ConfigurationInventory): Record<string, number> {
  return Object.fromEntries(Object.entries(inventory).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0]));
}
