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
  sdwanHealthChecks: [], ipsecPhase1: [], ipsecPhase2: [], userGroups: [], authenticationServers: [],
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

export function buildConfigurationInventory(root: FortiOSBlock): ConfigurationInventory {
  const inventory = emptyInventory();
  const visit = (node: FortiOSBlock, path: string) => {
    const p = path.toLowerCase();
    if (node.type === 'edit') {
      const entry = item(node, path);
      if (p.includes('system interface')) inventory.interfaces.push(entry);
      else if (p.includes('firewall address')) inventory.addressObjects.push(entry);
      else if (p.includes('firewall addrgrp')) inventory.addressGroups.push(entry);
      else if (p.includes('firewall service custom')) inventory.services.push(entry);
      else if (p.includes('firewall service group')) inventory.serviceGroups.push(entry);
      else if (p.includes('firewall policy')) inventory.firewallPolicies.push(entry);
      else if (p.includes('firewall vip')) inventory.virtualIps.push(entry);
      else if (p.includes('firewall ippool')) inventory.ipPools.push(entry);
      else if (p.includes('router static')) inventory.staticRoutes.push(entry);
      else if (p.includes('system sdwan members')) inventory.sdwanMembers.push(entry);
      else if (p.includes('system sdwan service')) inventory.sdwanServices.push(entry);
      else if (p.includes('system sdwan health-check')) inventory.sdwanHealthChecks.push(entry);
      else if (p.includes('vpn ipsec phase1')) inventory.ipsecPhase1.push(entry);
      else if (p.includes('vpn ipsec phase2')) inventory.ipsecPhase2.push(entry);
      else if (p.includes('user group')) inventory.userGroups.push(entry);
      else if (p.includes('user ldap') || p.includes('user radius') || p.includes('user tacacs')) inventory.authenticationServers.push(entry);
      else if (p.includes('antivirus profile') || p.includes('ips sensor') || p.includes('webfilter profile') || p.includes('dnsfilter profile') || p.includes('application list') || p.includes('ssl-ssh-profile')) inventory.securityProfiles.push(entry);
      else if (p.includes('certificate')) inventory.certificates.push(entry);
      else if (p.includes('system dhcp server')) inventory.dhcpServers.push(entry);
      else if (p.includes('system admin')) inventory.management.push(entry);
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
