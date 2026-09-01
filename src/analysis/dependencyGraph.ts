import type { ConfigurationInventory, InventoryItem } from './configInventory';

export type DependencyKind = 'interface' | 'address' | 'service' | 'security-profile' | 'vip' | 'ippool' | 'vpn' | 'route' | 'sdwan' | 'authentication' | 'unknown';

export interface DependencyNode { id: string; name: string; category: string; path: string; references: string[]; }
export interface DependencyEdge { from: string; to: string; reference: string; kind: DependencyKind; }
export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  unresolved: Array<{ from: string; reference: string; kind: DependencyKind; path: string }>;
}

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
  return 'unknown';
};

const normalise = (value: string) => value.replace(/^['"]|['"]$/g, '').trim().toLowerCase();

function allItems(inventory: ConfigurationInventory): InventoryItem[] {
  const excluded = new Set(['vdoms', 'model', 'firmware', 'hostname']);
  return Object.entries(inventory).filter(([key, value]) => !excluded.has(key) && Array.isArray(value)).flatMap(([, value]) => value as InventoryItem[]);
}

function isLiteral(value: string): boolean {
  return /^(all|any|none|enable|disable|always|never|tcp|udp|icmp|ip|ipv4|ipv6)$/i.test(value)
    || /^\d+(\.\d+){0,3}(:\d+)?$/.test(value)
    || /^https?:\/\//i.test(value)
    || /^[0-9a-f]{8,}$/i.test(value);
}

function isLikelyObjectReference(source: DependencyNode, reference: string): boolean {
  if (isLiteral(reference)) return false;
  return ['firewallPolicies', 'virtualIps', 'ipsecPhase1', 'ipsecPhase2', 'userGroups', 'sdwanServices'].includes(source.category);
}

function inferReferenceKind(source: DependencyNode): DependencyKind {
  if (source.category === 'firewallPolicies') return 'unknown';
  if (source.category === 'staticRoutes') return 'interface';
  return categoryKind(source.category);
}

export function buildDependencyGraph(inventory: ConfigurationInventory): DependencyGraph {
  const items = allItems(inventory);
  const nodes: DependencyNode[] = items.map((item, index) => ({ id: `${item.path}#${index + 1}`, name: item.name.replace(/^['"]|['"]$/g, ''), category: itemCategory(item, inventory), path: item.path, references: item.references.map(normalise).filter(Boolean) }));
  const lookup = new Map<string, DependencyNode[]>();
  for (const node of nodes) lookup.set(node.name.toLowerCase(), [...(lookup.get(node.name.toLowerCase()) ?? []), node]);

  const edges: DependencyEdge[] = [];
  const unresolved: DependencyGraph['unresolved'] = [];
  for (const source of nodes) {
    for (const reference of source.references) {
      const targets = lookup.get(reference) ?? [];
      if (targets.length) {
        for (const target of targets) if (target.id !== source.id) edges.push({ from: source.id, to: target.id, reference, kind: categoryKind(target.category) });
      } else if (isLikelyObjectReference(source, reference)) {
        unresolved.push({ from: source.id, reference, kind: inferReferenceKind(source), path: source.path });
      }
    }
  }
  return { nodes, edges, unresolved };
}

function itemCategory(item: InventoryItem, inventory: ConfigurationInventory): string {
  for (const [key, value] of Object.entries(inventory)) if (Array.isArray(value) && (value as InventoryItem[]).includes(item)) return key;
  return 'otherConfigs';
}

export function dependencySummary(graph: DependencyGraph) {
  const inbound = new Set(graph.edges.map(edge => edge.to));
  const outbound = new Set(graph.edges.map(edge => edge.from));
  return { nodes: graph.nodes.length, edges: graph.edges.length, unresolved: graph.unresolved.length, referencedObjects: inbound.size, consumers: outbound.size };
}
