import type { ConfigurationInventory, InventoryItem } from './configInventory';

export type DependencyKind = 'interface' | 'address' | 'service' | 'security-profile' | 'vip' | 'ippool' | 'vpn' | 'route' | 'sdwan' | 'authentication' | 'certificate' | 'unknown';
export interface DependencyNode { id: string; name: string; category: string; path: string; references: string[]; enabled: boolean; }
export interface DependencyEdge { from: string; to: string; reference: string; kind: DependencyKind; }
export interface DependencyIssue { from: string; reference: string; kind: DependencyKind; path: string; severity: 'high' | 'medium' | 'low'; reason: string; }
export interface DependencyGraph { nodes: DependencyNode[]; edges: DependencyEdge[]; unresolved: DependencyIssue[]; orphans: DependencyNode[]; disabledReferenced: DependencyNode[]; }

const categoryKind = (category: string): DependencyKind => {
  if (category === 'interfaces') return 'interface';
  if (category === 'addressObjects' || category === 'addressGroups') return 'address';
  if (category === 'services' || category === 'serviceGroups') return 'service';
  if (category === 'securityProfiles') return 'security-profile';
  if (category === 'virtualIps') return 'vip';
  if (category === 'ipPools') return 'ippool';
  if (category === 'ipsecPhase1' || category === 'ipsecPhase2') return 'vpn';
  if (category === 'staticRoutes') return 'route';
  if (category === 'sdwanMembers' || category === 'sdwanServices' || category === 'sdwanHealthChecks') return 'sdwan';
  if (category === 'authenticationServers' || category === 'userGroups') return 'authentication';
  if (category === 'certificates') return 'certificate';
  return 'unknown';
};

const normalise = (value: string) => value.replace(/^['"]|['"]$/g, '').trim().toLowerCase();
const cleanName = (value: string) => value.replace(/^['"]|['"]$/g, '').trim();
const excluded = new Set(['vdoms', 'model', 'firmware', 'hostname']);
const literal = /^(all|any|none|enable|disable|always|never)$/i;
const ipOrCidr = /^(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?(?::\d+)?$/;

function allItems(inventory: ConfigurationInventory): Array<{ category: string; item: InventoryItem }> {
  return Object.entries(inventory)
    .filter(([key, value]) => !excluded.has(key) && Array.isArray(value))
    .flatMap(([category, value]) => (value as InventoryItem[]).map(item => ({ category, item })));
}

function values(command: string): string[] {
  const match = command.match(/^(?:set|append|unselect)\s+\S+\s+(.+)$/i);
  if (!match) return [];
  return match[1].split(/\s+/).map(cleanName).filter(value => !literal.test(value) && !ipOrCidr.test(value));
}

const referenceTargets: Record<string, Record<string, DependencyKind>> = {
  firewallPolicies: { srcaddr: 'address', dstaddr: 'address', service: 'service', srcintf: 'interface', dstintf: 'interface', poolname: 'ippool', 'webfilter-profile': 'security-profile', 'dnsfilter-profile': 'security-profile', 'av-profile': 'security-profile', 'ips-sensor': 'security-profile', 'application-list': 'security-profile', groups: 'authentication' },
  addressGroups: { member: 'address' },
  serviceGroups: { member: 'service' },
  virtualIps: { extintf: 'interface' },
  ipPools: { extintf: 'interface' },
  staticRoutes: { device: 'interface' },
  sdwanServices: { members: 'sdwan', 'health-check': 'sdwan' },
  ipsecPhase1: { interface: 'interface', authusrgrp: 'authentication' },
  ipsecPhase2: { phase1name: 'vpn' },
  userGroups: { member: 'authentication' },
  authenticationServers: { certificate: 'certificate' },
  interfaces: { 'dhcp-relay-ip': 'interface' },
};

function commandKey(command: string): string | undefined {
  const match = command.match(/^(?:set|append|unselect)\s+(\S+)\s+/i);
  return match?.[1]?.toLowerCase();
}

function extractReferences(category: string, item: InventoryItem): Array<{ reference: string; kind: DependencyKind }> {
  const rules = referenceTargets[category] ?? {};
  const result: Array<{ reference: string; kind: DependencyKind }> = [];
  for (const command of item.commands) {
    const key = commandKey(command);
    if (!key || !rules[key]) continue;
    for (const value of values(command)) result.push({ reference: value, kind: rules[key] });
  }
  return result;
}

function isDisabled(item: InventoryItem): boolean {
  return item.commands.some(command => /^set\s+status\s+disable\b/i.test(command));
}

const orphanCategories = new Set(['addressObjects', 'addressGroups', 'services', 'serviceGroups', 'virtualIps', 'ipPools', 'securityProfiles', 'userGroups', 'authenticationServers', 'certificates']);

export function buildDependencyGraph(inventory: ConfigurationInventory): DependencyGraph {
  const entries = allItems(inventory);
  const nodes: DependencyNode[] = entries.map(({ category, item }, index) => ({
    id: `${category}:${index + 1}`,
    name: cleanName(item.name),
    category,
    path: item.path,
    references: [],
    enabled: !isDisabled(item),
  }));

  const lookup = new Map<string, DependencyNode[]>();
  for (const node of nodes) lookup.set(normalise(node.name), [...(lookup.get(normalise(node.name)) ?? []), node]);

  const edges: DependencyEdge[] = [];
  const unresolved: DependencyIssue[] = [];
  for (const [index, entry] of entries.entries()) {
    const source = nodes[index];
    const refs = extractReferences(entry.category, entry.item);
    source.references = refs.map(ref => normalise(ref.reference));
    for (const { reference, kind } of refs) {
      const targets = (lookup.get(normalise(reference)) ?? []).filter(target => target.id !== source.id);
      if (targets.length) {
        for (const target of targets) edges.push({ from: source.id, to: target.id, reference: cleanName(reference), kind: categoryKind(target.category) });
      } else {
        unresolved.push({ from: source.id, reference: cleanName(reference), kind, path: source.path, severity: source.category === 'firewallPolicies' ? 'high' : 'medium', reason: `Referenced ${kind} object was not found in the source inventory.` });
      }
    }
  }

  const inbound = new Set(edges.map(edge => edge.to));
  const orphans = nodes.filter(node => orphanCategories.has(node.category) && !inbound.has(node.id));
  const disabledReferenced = nodes.filter(node => !node.enabled && inbound.has(node.id));
  return { nodes, edges, unresolved, orphans, disabledReferenced };
}

export function dependencySummary(graph: DependencyGraph) {
  return {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    unresolved: graph.unresolved.length,
    orphans: graph.orphans.length,
    disabledReferenced: graph.disabledReferenced.length,
    referencedObjects: new Set(graph.edges.map(edge => edge.to)).size,
    consumers: new Set(graph.edges.map(edge => edge.from)).size,
  };
}
