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
        if (!/^(all|any|none)$/i.test(token)) result.add(token.replace(/^['\"]|['\"]$/g, ''));
      }
    }
  }
  return [...result];
}

function item(node: FortiOSBlock, path: string): InventoryItem {
  return { name: node.name, path, commands: [...node.commands], references: references(node.commands) };
}

// Classification must be based on the immediate parent table rather than
// counting '/' characters in the rendered path. FortiGate object names may
// legitimately contain '/', for example an address object named
// "KnowBe4 147.160.167.0/26". Path-depth checks incorrectly treated those
// names as nested configuration and dropped them from inventory.
function isDirectEdit(parentPath: string, section: string): boolean {
  return parentPath.toLowerCase() === `root/${section.toLowerCase()}`;
}

export function buildConfigurationInventory(root: FortiOSBlock): ConfigurationInventory {
  const inventory = emptyInventory();
  const visit = (node: FortiOSBlock, path: string, parentPath: string = '') => {
    if (node.type === 'edit') {
      const entry = item(node, path);
      if (isDirectEdit(parentPath, 'system interface')) inventory.interfaces.push(entry);
      else if (isDirectEdit(parentPath, 'firewall address')) inventory.addressObjects.push(entry);
      else if (isDirectEdit(parentPath, 'firewall addrgrp')) inventory.addressGroups.push(entry);
      else if (isDirectEdit(parentPath, 'firewall service custom')) inventory.services.push(entry);
      else if (isDirectEdit(parentPath, 'firewall service group')) inventory.serviceGroups.push(entry);
      else if (isDirectEdit(parentPath, 'firewall policy')) inventory.firewallPolicies.push(entry);
      else if (isDirectEdit(parentPath, 'firewall vip')) inventory.virtualIps.push(entry);
      else if (isDirectEdit(parentPath, 'firewall ippool')) inventory.ipPools.push(entry);
      else if (isDirectEdit(parentPath, 'router static')) inventory.staticRoutes.push(entry);
      else if (isDirectEdit(parentPath, 'system sdwan members')) inventory.sdwanMembers.push(entry);
      else if (isDirectEdit(parentPath, 'system sdwan service')) inventory.sdwanServices.push(entry);
      else if (isDirectEdit(parentPath, 'system sdwan health-check')) inventory.sdwanHealthChecks.push(entry);
      else if (isDirectEdit(parentPath, 'vpn ipsec phase1')) inventory.ipsecPhase1.push(entry);
      else if (isDirectEdit(parentPath, 'vpn ipsec phase2')) inventory.ipsecPhase2.push(entry);
      else if (isDirectEdit(parentPath, 'user group')) inventory.userGroups.push(entry);
      else if (isDirectEdit(parentPath, 'user local')) inventory.localUsers.push(entry);
      else if (isDirectEdit(parentPath, 'user ldap') || isDirectEdit(parentPath, 'user radius') || isDirectEdit(parentPath, 'user tacacs') || isDirectEdit(parentPath, 'user fsso') || isDirectEdit(parentPath, 'user rssso')) inventory.authenticationServers.push(entry);
      else if (
        isDirectEdit(parentPath, 'antivirus profile') ||
        isDirectEdit(parentPath, 'ips sensor') ||
        isDirectEdit(parentPath, 'webfilter profile') ||
        isDirectEdit(parentPath, 'dnsfilter profile') ||
        isDirectEdit(parentPath, 'application list') ||
        isDirectEdit(parentPath, 'firewall ssl-ssh-profile') ||
        isDirectEdit(parentPath, 'file-filter profile') ||
        isDirectEdit(parentPath, 'emailfilter profile')
      ) inventory.securityProfiles.push(entry);
      else if (path.toLowerCase().includes('certificate')) inventory.certificates.push(entry);
      else if (path.toLowerCase().includes('system admin')) inventory.management.push(entry);
      else inventory.otherConfigs.push(entry);
    }
    node.children.forEach(child => visit(child, `${path}/${child.name}`, path));
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
