import { useState, type ChangeEvent } from 'react';
import { compileFortiOS, migrateWithProfile, parseFortiOS, validateMigration, type MigrationFinding } from './utils/fortiEngine';
import { fortigate100ETo120G714Profile } from './migrations/profiles';
import { buildConfigurationInventory, inventoryTotals, type ConfigurationInventory } from './analysis/configInventory';
import { buildDependencyGraph, dependencyBreakdown, dependencySummary, type DependencyGraph } from './analysis/dependencyGraph';

function severityClass(severity: MigrationFinding['severity']) {
  return severity === 'critical' ? 'text-red-400' : severity === 'high' ? 'text-orange-400' : severity === 'medium' ? 'text-yellow-400' : 'text-slate-300';
}

const inventoryLabels: Array<[keyof ConfigurationInventory, string]> = [
  ['interfaces', 'Interfaces'], ['addressObjects', 'Address objects'], ['addressGroups', 'Address groups'], ['services', 'Services'], ['serviceGroups', 'Service groups'], ['firewallPolicies', 'Firewall policies'], ['virtualIps', 'VIPs'], ['ipPools', 'IP pools'], ['staticRoutes', 'Static routes'], ['sdwanMembers', 'SD-WAN members'], ['sdwanServices', 'SD-WAN rules'], ['sdwanHealthChecks', 'SD-WAN health checks'], ['ipsecPhase1', 'IPsec Phase 1'], ['ipsecPhase2', 'IPsec Phase 2'], ['userGroups', 'User groups'], ['localUsers', 'Local users'], ['authenticationServers', 'Authentication servers'], ['securityProfiles', 'Security profiles'], ['certificates', 'Certificates'], ['dhcpServers', 'DHCP servers'], ['management', 'Management objects'], ['otherConfigs', 'Other configuration entries']
];

const readiness = (items: MigrationFinding[]) =>
  items.some(item => item.status === 'BLOCK') ? 'BLOCK' :
  items.some(item => item.status === 'MANUAL' || item.status === 'REVIEW') ? 'REVIEW' :
  'PASS';

function buildReport(items: MigrationFinding[], statistics: { configs: number; edits: number; commands: number; transformedCommands: number } | null, inv: ConfigurationInventory, graph: DependencyGraph | null) {
  const counts = items.reduce<Record<string, number>>((acc, item) => { acc[item.status] = (acc[item.status] ?? 0) + 1; return acc; }, {});
  const totals = inventoryTotals(inv);
  const ds = graph ? dependencySummary(graph) : null;
  const db = graph ? dependencyBreakdown(graph) : null;
  const status = readiness(items);
  const credentialFindings = items.filter(item => item.id.startsWith('SEC-') && item.title.toLowerCase().includes('credential/secret'));
  const sha1Findings = items.filter(item => item.id.startsWith('SEC-') && item.title.toLowerCase().includes('sha-1'));
  const legacyCryptoFindings = items.filter(item => item.id.startsWith('SEC-') && item.title.toLowerCase().includes('legacy encryption'));
  const otherSecurityFindings = items.filter(item => item.id.startsWith('SEC-') && !item.title.toLowerCase().includes('credential/secret') && !item.title.toLowerCase().includes('sha-1') && !item.title.toLowerCase().includes('legacy encryption'));
  return [
    '# FortiAlign V2 Migration & Assurance Report', '',
    `Source: ${fortigate100ETo120G714Profile.sourceModel} / ${fortigate100ETo120G714Profile.sourceFirmware}`,
    `Target: ${fortigate100ETo120G714Profile.destinationModel} / ${fortigate100ETo120G714Profile.destinationFirmware}`,
    '', '## Migration readiness', `- Overall readiness: ${status}`,
    status === 'BLOCK'
      ? '- BLOCK: production deployment must not proceed until all blockers are resolved.'
      : status === 'REVIEW'
        ? '- REVIEW: no automated migration blocker is present, but engineering validation is required before production deployment.'
        : '- PASS: no migration finding blocker is present.',
    '- Target-device validation remains mandatory before production deployment.',
    '', '## Migration result', ...['BLOCK','MANUAL','REVIEW','TRANSFORMED','PASS'].map(s => `- ${s}: ${counts[s] ?? 0}`),
    '', '## Configuration inventory', ...inventoryLabels.map(([key, label]) => `- ${label}: ${totals[String(key)] ?? 0}`),
    '', '## Dependency assurance', `- Nodes: ${ds?.nodes ?? 0}`, `- Dependencies: ${ds?.edges ?? 0}`, `- Unresolved references: ${ds?.unresolved ?? 0}`, `- Dependency reviews: ${ds?.reviews ?? 0}`, `- Orphan candidates: ${ds?.orphans ?? 0}`, `- Disabled referenced objects: ${ds?.disabledReferenced ?? 0}`, `- Consumers: ${ds?.consumers ?? 0}`,
    '', '### Dependency status', `- unresolved: ${ds?.unresolved ?? 0}`, `- review: ${ds?.reviews ?? 0}`,
    '', '### Unresolved by kind', ...Object.entries(db?.unresolvedByKind ?? {}).filter(([, value]) => value > 0).map(([key, value]) => `- ${key}: ${value}`),
    '', '### Unresolved by severity', ...Object.entries(db?.unresolvedBySeverity ?? {}).filter(([, value]) => value > 0).map(([key, value]) => `- ${key}: ${value}`),
    '', '### Reviews by kind', ...Object.entries(db?.reviewByKind ?? {}).filter(([, value]) => value > 0).map(([key, value]) => `- ${key}: ${value}`),
    '', '### Orphan candidates by category', ...Object.entries(db?.orphanByCategory ?? {}).map(([key, value]) => `- ${key}: ${value}`),
    '', '### Orphan assessment', ...Object.entries(db?.orphanByClassification ?? {}).filter(([, value]) => value > 0).map(([key, value]) => `- ${key}: ${value}`),
    '- Orphan classifications are evidence-based review categories, not proof that an object is safe to delete.',
    '', '### Dependency diagnostics', ...(graph?.unresolved.length ? graph.unresolved.map(issue => `- ${issue.status.toUpperCase()} / ${issue.severity.toUpperCase()} / ${issue.kind}: ${issue.reference} — ${issue.path} — ${issue.reason}`) : ['- None']),
    '', '### Dependency review diagnostics', ...(graph?.reviews.length ? graph.reviews.map(issue => `- ${issue.status.toUpperCase()} / ${issue.severity.toUpperCase()} / ${issue.kind}: ${issue.reference} — ${issue.path} — ${issue.reason}`) : ['- None']),
    '', '## Security finding summary',
    `- Credential/secret-bearing findings: ${credentialFindings.length} — individual secret values are intentionally omitted.`,
    `- SHA-1 findings: ${sha1Findings.length} — verify peer compatibility before removing legacy proposals.`,
    `- Legacy encryption findings: ${legacyCryptoFindings.length} — verify peer compatibility before changing proposals.`,
    `- Other security findings: ${otherSecurityFindings.length}`,
    '', '## Migration statistics', `- Config blocks: ${statistics?.configs ?? 0}`, `- Edit blocks: ${statistics?.edits ?? 0}`, `- Commands: ${statistics?.commands ?? 0}`, `- Transformed commands: ${statistics?.transformedCommands ?? 0}`,
    '', '## Findings', ...items.map(item => `### ${item.id} — ${item.severity.toUpperCase()} — ${item.status}\n- **${item.title}**\n- ${item.message}\n- Path: ${item.sourcePath ?? 'n/a'}\n- Recommendation: ${item.recommendation}`),
    '', '> Generated by FortiAlign V2. Target-device validation remains mandatory before production deployment.'
  ].join('\n');
}

export default function App() {
  const [originalText, setOriginalText] = useState('');
  const [migratedText, setMigratedText] = useState('');
  const [findings, setFindings] = useState<MigrationFinding[]>([]);
  const [stats, setStats] = useState<{ configs: number; edits: number; commands: number; transformedCommands: number } | null>(null);
  const [inventory, setInventory] = useState<ConfigurationInventory | null>(null);
  const [graph, setGraph] = useState<DependencyGraph | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const rawText = await file.text();
    const ast = parseFortiOS(rawText);
    const inv = buildConfigurationInventory(ast);
    const dep = buildDependencyGraph(inv);
    const result = migrateWithProfile(ast, fortigate100ETo120G714Profile);
    const validation = validateMigration(result, fortigate100ETo120G714Profile);
    const outputText = compileFortiOS(result.ast);
    setOriginalText(rawText); setInventory(inv); setGraph(dep); setMigratedText(outputText); setFindings(validation); setStats(result.statistics);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    if (reportUrl) URL.revokeObjectURL(reportUrl);
    setDownloadUrl(URL.createObjectURL(new Blob([outputText], { type: 'text/plain' })));
    setReportUrl(URL.createObjectURL(new Blob([buildReport(validation, result.statistics, inv, dep)], { type: 'text/markdown' })));
  };

  const ds = graph ? dependencySummary(graph) : null;
  const db = graph ? dependencyBreakdown(graph) : null;
  const status = readiness(findings);
  return <div className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col gap-6">
    <header className="flex flex-col lg:flex-row justify-between items-center bg-slate-900 p-4 rounded-lg border border-slate-800 gap-4"><div><h1 className="text-xl font-bold text-slate-100">FortiAlign V2 — FortiGate Migration & Assurance</h1><p className="text-sm text-slate-400">100E / FortiOS 7.0.19 → 120G / FortiOS 7.4.12</p></div><div className="flex gap-3 items-center flex-wrap justify-center"><label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-sm">Import .conf<input type="file" accept=".conf,.txt" className="hidden" onChange={handleFileUpload} /></label>{downloadUrl && <a href={downloadUrl} download="fortialign-migrated.conf" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-sm">Download Config</a>}{reportUrl && <a href={reportUrl} download="fortialign-migration-report.md" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-sm">Download Report</a>}</div></header>
    {stats && <section className="grid grid-cols-2 lg:grid-cols-5 gap-3"><div className="bg-slate-900 border border-slate-800 rounded-lg p-4"><div className="text-xs text-slate-500 uppercase">Readiness</div><div className={`text-2xl font-bold ${status === 'BLOCK' ? 'text-red-400' : status === 'REVIEW' ? 'text-yellow-400' : 'text-emerald-400'}`}>{status}</div></div>{[['Config blocks', stats.configs], ['Edit blocks', stats.edits], ['Commands', stats.commands], ['Transformed', stats.transformedCommands]].map(([label, value]) => <div key={String(label)} className="bg-slate-900 border border-slate-800 rounded-lg p-4"><div className="text-xs text-slate-500 uppercase">{label}</div><div className="text-2xl font-bold">{value}</div></div>)}</section>}
    {inventory && <section className="bg-slate-900 border border-slate-800 rounded-lg p-4"><div className="flex justify-between items-center mb-3"><h2 className="text-sm font-semibold uppercase tracking-wider">Configuration inventory</h2><span className="text-xs text-slate-500">Pre-migration source inventory</span></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">{inventoryLabels.map(([key, label]) => <div key={String(label)} className="border border-slate-800 rounded p-3"><div className="text-xs text-slate-500">{label}</div><div className="text-lg font-semibold">{(inventory[key] as unknown[]).length}</div></div>)}</div></section>}
    {graph && <section className="bg-slate-900 border border-slate-800 rounded-lg p-4"><div className="flex justify-between items-center mb-3"><h2 className="text-sm font-semibold uppercase tracking-wider">Dependency assurance</h2><span className="text-xs text-slate-500">Cross-object reference analysis</span></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">{[['Objects', ds?.nodes], ['Dependencies', ds?.edges], ['Unresolved', ds?.unresolved], ['Reviews', ds?.reviews], ['Orphan candidates', ds?.orphans], ['Disabled refs', ds?.disabledReferenced], ['Consumers', ds?.consumers]].map(([label, value]) => <div key={String(label)} className="border border-slate-800 rounded p-3"><div className="text-xs text-slate-500">{label}</div><div className="text-lg font-semibold">{value}</div></div>)}</div><div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4"><div><h3 className="text-xs uppercase text-slate-500 mb-2">Dependency status</h3><div className="space-y-1"><div className="flex justify-between text-sm"><span>unresolved</span><span className="font-mono">{ds?.unresolved ?? 0}</span></div><div className="flex justify-between text-sm"><span>review</span><span className="font-mono">{ds?.reviews ?? 0}</span></div></div></div><div><h3 className="text-xs uppercase text-slate-500 mb-2">Unresolved by type</h3><div className="space-y-1">{Object.entries(db?.unresolvedByKind ?? {}).filter(([, value]) => value > 0).map(([key, value]) => <div key={key} className="flex justify-between text-sm"><span>{key}</span><span className="font-mono">{value}</span></div>)}</div></div><div><h3 className="text-xs uppercase text-slate-500 mb-2">Unresolved by severity</h3><div className="space-y-1">{Object.entries(db?.unresolvedBySeverity ?? {}).filter(([, value]) => value > 0).map(([key, value]) => <div key={key} className={key === 'high' ? 'flex justify-between text-sm text-orange-400' : 'flex justify-between text-sm'}><span>{key}</span><span className="font-mono">{value}</span></div>)}</div></div><div><h3 className="text-xs uppercase text-slate-500 mb-2">Reviews by type</h3><div className="space-y-1">{Object.entries(db?.reviewByKind ?? {}).filter(([, value]) => value > 0).map(([key, value]) => <div key={key} className="flex justify-between text-sm"><span>{key}</span><span className="font-mono">{value}</span></div>)}</div></div><div><h3 className="text-xs uppercase text-slate-500 mb-2">Orphan assessment</h3><div className="space-y-1 max-h-32 overflow-auto">{Object.entries(db?.orphanByClassification ?? {}).filter(([, value]) => value > 0).map(([key, value]) => <div key={key} className="flex justify-between text-sm"><span>{key}</span><span className="font-mono">{value}</span></div>)}</div></div></div>{graph.orphanDiagnostics.length > 0 && <div className="mt-4 border-t border-slate-800 pt-4"><h3 className="text-xs uppercase text-slate-500 mb-2">Orphan diagnostic sample</h3><div className="space-y-2 max-h-64 overflow-auto">{graph.orphanDiagnostics.slice(0, 100).map(item => <div key={item.nodeId} className="border border-slate-800 rounded p-3 text-sm"><div className="flex gap-2 flex-wrap"><span className="font-mono text-slate-400">{item.name}</span><span className="text-slate-500">{item.category}</span><span className="text-yellow-400">{item.classification}</span><span className="text-slate-500">confidence: {item.confidence}</span></div><div className="text-slate-500 mt-1">{item.path} — {item.reason}</div></div>)}</div></div>}{(graph.unresolved.length > 0 || graph.reviews.length > 0 || graph.disabledReferenced.length > 0) && <div className="mt-4 space-y-2 max-h-72 overflow-auto">{graph.unresolved.map((issue, index) => <div key={`u-${index}`} className="border border-orange-900/50 rounded p-3 text-sm"><span className="text-orange-400">UNRESOLVED</span> <span className="text-slate-400">{issue.severity.toUpperCase()} / {issue.kind}</span> <span className="font-mono text-slate-300">{issue.reference}</span><div className="text-slate-500">{issue.path} — {issue.reason}</div></div>)}{graph.reviews.map((issue, index) => <div key={`r-${index}`} className="border border-yellow-900/50 rounded p-3 text-sm"><span className="text-yellow-400">REVIEW</span> <span className="text-slate-400">{issue.severity.toUpperCase()} / {issue.kind}</span> <span className="font-mono text-slate-300">{issue.reference}</span><div className="text-slate-500">{issue.path} — {issue.reason}</div></div>)}{graph.disabledReferenced.map(node => <div key={`d-${node.id}`} className="border border-red-900/50 rounded p-3 text-sm"><span className="text-red-400 font-medium">DISABLED REFERENCED</span> <span className="font-mono text-slate-400">{node.name}</span><div className="text-slate-500">{node.path}</div></div>)}</div>}</section>}
    {findings.length > 0 && <section className="bg-slate-900 border border-slate-800 rounded-lg p-4"><div className="flex justify-between items-center mb-3"><h2 className="text-sm font-semibold uppercase tracking-wider">Migration findings</h2><span className="text-xs text-slate-500">{findings.length} findings</span></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">{[['Credential/secret', findings.filter(item => item.id.startsWith('SEC-') && item.title.toLowerCase().includes('credential/secret')).length], ['SHA-1', findings.filter(item => item.id.startsWith('SEC-') && item.title.toLowerCase().includes('sha-1')).length], ['Legacy crypto', findings.filter(item => item.id.startsWith('SEC-') && item.title.toLowerCase().includes('legacy encryption')).length], ['Other security', findings.filter(item => item.id.startsWith('SEC-') && !item.title.toLowerCase().includes('credential/secret') && !item.title.toLowerCase().includes('sha-1') && !item.title.toLowerCase().includes('legacy encryption')).length]].map(([label, value]) => <div key={String(label)} className="border border-slate-800 rounded p-3"><div className="text-xs text-slate-500">{label}</div><div className="text-lg font-semibold">{value}</div></div>)}</div><div className="max-h-80 overflow-auto space-y-2">{findings.map(item => <div key={item.id} className="border border-slate-800 rounded p-3 text-sm"><div className="flex gap-3 flex-wrap"><span className="font-mono text-slate-500">{item.id}</span><span className={severityClass(item.severity)}>{item.severity.toUpperCase()}</span><span className="text-slate-400">{item.status}</span><strong>{item.title}</strong></div><p className="text-slate-400 mt-1">{item.message}</p><p className="text-slate-500 mt-1">{item.recommendation}</p></div>)}</div></section>}
    <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]"><div className="flex flex-col gap-2"><h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Source Configuration</h2><div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-4 overflow-auto max-h-[70vh]">{originalText ? <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">{originalText}</pre> : <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">Import a FortiGate configuration to begin.</div>}</div></div><div className="flex flex-col gap-2"><h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Migration Candidate</h2><div className="flex-1 bg-slate-900 border border-emerald-900/30 rounded-lg p-4 overflow-auto max-h-[70vh]">{migratedText ? <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">{migratedText}</pre> : <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">Awaiting configuration import.</div>}</div></div></main>
  </div>;
}