import { ChecklistTask, CliCommandRef, MigrationPreset, MigrationSpec, PhaseInfo } from '../types';

export const PHASES: PhaseInfo[] = [
  {
    id: 'planning',
    number: 1,
    title: 'Pre-Migration Planning',
    description: 'Licensing, firmware upgrade paths, architecture design, and backup verification.',
    iconName: 'ClipboardList',
  },
  {
    id: 'hardware',
    number: 2,
    title: 'Hardware & Interface Mapping',
    description: 'Physical port layouts, transceiver compatibility, SFP+ speeds, and cabling schemas.',
    iconName: 'Server',
  },
  {
    id: 'syntax',
    number: 3,
    title: 'Configuration & Syntax Adaptation',
    description: 'CLI syntax changes across FortiOS releases, SD-WAN, IPsec/SSL VPN, and security policy rules.',
    iconName: 'Code2',
  },
  {
    id: 'validation',
    number: 4,
    title: 'Execution & Post-Migration Validation',
    description: 'HA sync status, routing tables, FortiGuard subscriptions, session verification, and monitoring.',
    iconName: 'ShieldCheck',
  },
];

export const POPULAR_MODELS = [
  'FortiGate 40F',
  'FortiGate 60E',
  'FortiGate 60F',
  'FortiGate 70F',
  'FortiGate 80F',
  'FortiGate 100E',
  'FortiGate 100F',
  'FortiGate 200E',
  'FortiGate 200F',
  'FortiGate 400E',
  'FortiGate 400F',
  'FortiGate 600E',
  'FortiGate 600F',
  'FortiGate 900G',
  'FortiGate 1000D',
  'FortiGate 1800F',
  'FortiGate 2000E',
  'FortiGate 3000F',
  'FortiGate VM64',
];

export const FIRMWARE_VERSIONS = [
  'FortiOS 6.2.x',
  'FortiOS 6.4.x',
  'FortiOS 7.0.x',
  'FortiOS 7.2.x',
  'FortiOS 7.4.x',
  'FortiOS 7.6.x',
];

export const PRESETS: MigrationPreset[] = [
  {
    id: 'branch-upgrade',
    name: 'Branch Firewall Renewal',
    description: 'Standard migration from FortiGate 60E (v7.0) to FortiGate 70F (v7.4) in Standalone mode.',
    spec: {
      sourceModel: 'FortiGate 60E',
      destinationModel: 'FortiGate 70F',
      sourceFirmware: 'FortiOS 7.0.x',
      destinationFirmware: 'FortiOS 7.4.x',
      haMode: 'Standalone',
      vdomsEnabled: false,
      vdomNames: '',
      notes: 'Standard branch office hardware refresh with SD-WAN & IPsec VPN.',
    },
  },
  {
    id: 'datacenter-ha',
    name: 'Enterprise Datacenter HA Cluster',
    description: 'High-availability migration from FG-600E to FG-600F with VDOMs and FortiOS 7.4.',
    spec: {
      sourceModel: 'FortiGate 600E',
      destinationModel: 'FortiGate 600F',
      sourceFirmware: 'FortiOS 7.2.x',
      destinationFirmware: 'FortiOS 7.4.x',
      haMode: 'Active-Passive',
      vdomsEnabled: true,
      vdomNames: 'root, DMZ_VDOM, Corporate_VDOM, Guest_VDOM',
      notes: 'Datacenter core cluster refresh with multi-VDOM segmentation and 10G/25G interface mapping.',
    },
  },
  {
    id: 'campus-core-vdom',
    name: 'Campus Gateway (Multi-VDOM & HA)',
    description: 'Migration from FG-200E (v6.4) to FG-200F (v7.2) Active-Active HA cluster with VDOMs.',
    spec: {
      sourceModel: 'FortiGate 200E',
      destinationModel: 'FortiGate 200F',
      sourceFirmware: 'FortiOS 6.4.x',
      destinationFirmware: 'FortiOS 7.2.x',
      haMode: 'Active-Active',
      vdomsEnabled: true,
      vdomNames: 'root, Academic_VDOM, Admin_VDOM, IoT_VDOM',
      notes: 'Major version upgrade with active-active session load distribution and legacy syntax cleanup.',
    },
  },
  {
    id: 'midmarket-standalone',
    name: 'Mid-Market Core Refresh',
    description: 'Standalone FG-100E to FG-100F migration upgrading from v6.4 to v7.2.',
    spec: {
      sourceModel: 'FortiGate 100E',
      destinationModel: 'FortiGate 100F',
      sourceFirmware: 'FortiOS 6.4.x',
      destinationFirmware: 'FortiOS 7.2.x',
      haMode: 'Standalone',
      vdomsEnabled: false,
      vdomNames: '',
      notes: 'Primary office firewall upgrade with dual WAN SD-WAN rules and internal VLAN trunking.',
    },
  },
];

export function generateTasksForSpec(spec: MigrationSpec): ChecklistTask[] {
  const isHa = spec.haMode !== 'Standalone';
  const isActiveActive = spec.haMode === 'Active-Active';
  const isVdom = spec.vdomsEnabled;

  const tasks: ChecklistTask[] = [
    // Phase 1: Pre-Migration Planning
    {
      id: 'plan-1',
      phaseId: 'planning',
      title: 'Verify FortiCare registration and license transfer eligibility',
      description: `Ensure the destination model (${spec.destinationModel || 'Destination Appliance'}) is registered on FortiCare support portal. Confirm contract transfer for FortiGuard Subscriptions (IPS, AV, Web Filter, Sandbox) and technical support services.`,
      priority: 'Critical',
      completed: false,
      category: 'Licensing',
      cliCommand: 'get system status',
      tags: ['FortiCare', 'Licenses', 'Entitlement'],
    },
    {
      id: 'plan-2',
      phaseId: 'planning',
      title: 'Check Fortinet Upgrade Path tool for firmware compatibility',
      description: `Consult Fortinet Official Upgrade Path tool (docs.fortinet.com/upgrade-tool) to verify if source firmware (${spec.sourceFirmware}) requires interim step upgrades before loading onto destination firmware (${spec.destinationFirmware}).`,
      priority: 'High',
      completed: false,
      category: 'Firmware',
      cliCommand: 'get system status',
      tags: ['Upgrade Path', 'Compatibility', 'FortiOS'],
    },
    {
      id: 'plan-3',
      phaseId: 'planning',
      title: 'Backup source configuration, certificates, and local user databases',
      description: `Export full backup file from ${spec.sourceModel || 'Source Model'} via GUI/CLI (including private keys and local password hashes). Save external backups of SSL/TLS certificates (.p12, .crt) and local user/group database tables.`,
      priority: 'Critical',
      completed: false,
      category: 'Backup',
      cliCommand: 'execute backup config flash "source_backup.conf"',
      tags: ['Backup', 'Certificates', 'Local Users'],
    },
    {
      id: 'plan-4',
      phaseId: 'planning',
      title: 'Review target hardware disk capacity and log partition storage',
      description: `Confirm whether ${spec.destinationModel || 'Destination Appliance'} features onboard SSD storage (-1 storage model variant) or requires external FortiAnalyzer / FortiCloud logging for historical traffic retention.`,
      priority: 'Medium',
      completed: false,
      category: 'Hardware Specs',
      cliCommand: 'execute disk list',
      tags: ['Disk Space', 'Logging', 'Hardware'],
    },
    {
      id: 'plan-5',
      phaseId: 'planning',
      title: 'Obtain clean FortiOS image build for disaster recovery / TFTP flash',
      description: `Download matching release build image for ${spec.destinationFirmware} from Fortinet Customer Support Portal. Keep console cable (RJ45-to-DB9/USB) and TFTP server ready for emergency out-of-band recovery.`,
      priority: 'High',
      completed: false,
      category: 'Firmware',
      cliCommand: 'get system status',
      tags: ['Recovery', 'TFTP', 'Console'],
    },

    // Phase 2: Hardware & Interface Mapping
    {
      id: 'hw-1',
      phaseId: 'hardware',
      title: 'Map physical interfaces across source and destination port layouts',
      description: `Compare physical interface mapping between ${spec.sourceModel || 'Source'} and ${spec.destinationModel || 'Destination'} (e.g., mapping port1-8 vs ge1-ge16 or SFP+ 10G ports). Record custom alias names, speeds, and duplex settings.`,
      priority: 'Critical',
      completed: false,
      category: 'Port Mapping',
      cliCommand: 'get system interface physical',
      tags: ['Interfaces', 'Physical Ports', 'Transceivers'],
    },
    {
      id: 'hw-2',
      phaseId: 'hardware',
      title: 'Document SFP/SFP+/QSFP transceiver compatibility and FEC settings',
      description: `Verify optic transceiver compatibility (1G/10G/25G/40G) for ${spec.destinationModel}. Ensure Forward Error Correction (FEC) settings on 25G/100G optics match upstream switches.`,
      priority: 'High',
      completed: false,
      category: 'Optics',
      cliCommand: 'get system interface transceiver',
      tags: ['SFP+', '25G', 'Optics', 'FEC'],
    },
    {
      id: 'hw-3',
      phaseId: 'hardware',
      title: 'Catalog VLAN sub-interfaces, 802.1Q trunks, and Link Aggregation (LAG)',
      description: 'Document all virtual VLAN interfaces, parent physical trunks, LACP (802.3ad) aggregate interfaces, and speed/duplex negotiation settings.',
      priority: 'High',
      completed: false,
      category: 'L2 Networking',
      cliCommand: 'show system interface',
      tags: ['VLANs', 'LAG', 'LACP', 'Trunks'],
    },
    {
      id: 'hw-4',
      phaseId: 'hardware',
      title: 'Document MAC address bindings and static ARP entries',
      description: 'Catalog static MAC addresses, proxy ARP configurations, and MAC-based interface assignments on connected upstream ISPs or downstream core switches.',
      priority: 'Medium',
      completed: false,
      category: 'ARP / L2',
      cliCommand: 'diagnose ip arp list',
      tags: ['ARP', 'MAC Address', 'Proxy ARP'],
    },

    // Phase 3: Configuration & Syntax Adaptation
    {
      id: 'cfg-1',
      phaseId: 'syntax',
      title: `Review CLI syntax changes between ${spec.sourceFirmware || 'Source Firmware'} and ${spec.destinationFirmware || 'Destination Firmware'}`,
      description: `Audit syntax differences for key commands across ${spec.sourceFirmware} -> ${spec.destinationFirmware}. Pay close attention to FortiOS 7.2/7.4 refactored commands (e.g., web-filter profile changes, SSL VPN web mode updates, and implicit rule definitions).`,
      priority: 'Critical',
      completed: false,
      category: 'CLI Syntax',
      cliCommand: 'diagnose debug config-error-log read',
      tags: ['Syntax Delta', 'FortiOS Changes', 'CLI'],
    },
    {
      id: 'cfg-2',
      phaseId: 'syntax',
      title: 'Verify SD-WAN zones, performance SLAs, and health check probes',
      description: 'Audit SD-WAN member interfaces, health check probes (ping/HTTP SLA targets), link quality criteria, and SD-WAN rules for traffic steering.',
      priority: 'High',
      completed: false,
      category: 'SD-WAN',
      cliCommand: 'diagnose sys sdwan health-check',
      tags: ['SD-WAN', 'SLA Probes', 'Traffic Steering'],
    },
    {
      id: 'cfg-3',
      phaseId: 'syntax',
      title: 'Confirm IPsec & SSL VPN configurations and certificate bindings',
      description: 'Verify Phase 1 / Phase 2 IPsec proposals, Diffie-Hellman groups, SSL VPN web/tunnel portals, user group bindings, and local/CA certificates.',
      priority: 'Critical',
      completed: false,
      category: 'VPN',
      cliCommand: 'diagnose vpn ike gateway list',
      tags: ['IPsec', 'SSL VPN', 'Certificates', 'IKE'],
    },
    {
      id: 'cfg-4',
      phaseId: 'syntax',
      title: 'Audit Firewall Security Policies, NAT pools, and Security Profiles',
      description: 'Ensure firewall policy IDs, source/destination address objects, VIPs (Virtual IPs), Central SNAT rules, and Security Profiles (AV, Web Filter, IPS, Application Control) map correctly.',
      priority: 'Critical',
      completed: false,
      category: 'Security Policies',
      cliCommand: 'show firewall policy',
      tags: ['Policies', 'NAT', 'VIP', 'Security Profiles'],
    },

    // Phase 4: Execution & Post-Migration Validation
    {
      id: 'val-1',
      phaseId: 'validation',
      title: 'Check routing tables and dynamic routing neighbors (eBGP / OSPF / Static)',
      description: 'Validate active routing table entries, static default routes, BGP neighbor peering status, and OSPF adjacency states across all active interfaces.',
      priority: 'Critical',
      completed: false,
      category: 'Routing',
      cliCommand: 'diagnose ip router bgp summary',
      tags: ['BGP', 'OSPF', 'Routing Table', 'Static Routes'],
    },
    {
      id: 'val-2',
      phaseId: 'validation',
      title: 'Validate FortiGuard connectivity and security signature updates',
      description: 'Verify outbound FortiGuard communication over port 443/8888. Confirm Antivirus, IPS, Web Filter database, and Sandbox engine signatures update successfully.',
      priority: 'High',
      completed: false,
      category: 'FortiGuard',
      cliCommand: 'diagnose autoupdate status',
      tags: ['FortiGuard', 'Signatures', 'Updates'],
    },
    {
      id: 'val-3',
      phaseId: 'validation',
      title: 'Confirm network monitoring, SNMP polling, and FortiAnalyzer logging',
      description: 'Verify SNMP v2c/v3 daemon response, Syslog server delivery, and active log transmission to FortiAnalyzer or FortiCloud endpoints.',
      priority: 'High',
      completed: false,
      category: 'Monitoring',
      cliCommand: 'diagnose test application fazd 2',
      tags: ['SNMP', 'FortiAnalyzer', 'Syslog', 'Logs'],
    },
    {
      id: 'val-4',
      phaseId: 'validation',
      title: 'Execute user traffic validation and application sanity testing',
      description: 'Perform real-time test calls for core business applications, DNS query resolution, internal web servers, outbound NAT internet traffic, and voice/video traffic latency.',
      priority: 'Critical',
      completed: false,
      category: 'Traffic Validation',
      cliCommand: 'diagnose firewall iprope list',
      tags: ['Traffic Test', 'DNS', 'User Acceptance', 'Latency'],
    },
  ];

  // ==========================================
  // DYNAMIC STEPS FOR HA (HIGH AVAILABILITY)
  // ==========================================
  if (isHa) {
    tasks.push(
      // Phase 1 HA
      {
        id: 'plan-ha-1',
        phaseId: 'planning',
        title: `[HA] Record ${spec.haMode} cluster serial numbers, priorities, and group keys`,
        description: `Document Primary and Secondary ${spec.destinationModel} unit serial numbers. Configure distinct HA member priorities (e.g. Master: 200, Slave: 100) and establish a secure HA group name/password.`,
        priority: 'Critical',
        completed: false,
        category: 'HA Setup',
        cliCommand: 'get system ha status',
        isDynamic: true,
        dynamicReason: 'ha',
        tags: ['HA', spec.haMode, 'Serial Numbers', 'Priority'],
      },
      {
        id: 'plan-ha-2',
        phaseId: 'planning',
        title: '[HA] Plan dedicated out-of-band management interface (ha-mgmt-interface)',
        description: 'Configure separate IP addresses for in-band cluster access vs individual direct node access using "set ha-mgmt-interface" to retain management connectivity during cluster sync.',
        priority: 'High',
        completed: false,
        category: 'HA Setup',
        cliCommand: 'config system ha\n  set ha-mgmt-status enable\n  config ha-mgmt-interface\n    edit "1"\n      set interface "mgmt1"\n      set gateway 192.168.1.1\n    next\n  end\nend',
        isDynamic: true,
        dynamicReason: 'ha',
        tags: ['HA Management', 'Out-of-Band', 'ha-mgmt'],
      },

      // Phase 2 HA
      {
        id: 'hw-ha-1',
        phaseId: 'hardware',
        title: '[HA] Establish redundant physical heartbeat links across independent port modules',
        description: 'Wire at least two physical HA heartbeat cables (e.g. ha1 and ha2) using direct patch cords or isolated VLANs on separate switches to eliminate single-point-of-failure.',
        priority: 'Critical',
        completed: false,
        category: 'HA Cables',
        cliCommand: 'get system ha status',
        isDynamic: true,
        dynamicReason: 'ha',
        tags: ['Heartbeat', 'Physical Cabling', 'HA Ports'],
      },

      // Phase 3 HA
      {
        id: 'cfg-ha-1',
        phaseId: 'syntax',
        title: '[HA] Configure Virtual MAC (vmac), override settings, and monitored interfaces',
        description: `Verify "set pingserver-monitor-idx" and "set monitor" for critical uplink/downlink interfaces. Ensure Virtual MAC addresses ("set vmac enable") are supported by upstream network switches.`,
        priority: 'Critical',
        completed: false,
        category: 'HA Config',
        cliCommand: 'config system ha\n  set mode ' + (isActiveActive ? 'a-a' : 'a-p') + '\n  set group-id 50\n  set group-name "FG-CLUSTER"\n  set password ********\n  set hbdev "ha1" 100 "ha2" 100\n  set override disable\n  set vmac enable\n  set priority 200\nend',
        isDynamic: true,
        dynamicReason: 'ha',
        tags: ['VMAC', 'Interface Monitor', 'HA Timers'],
      },

      // Phase 4 HA
      {
        id: 'val-ha-1',
        phaseId: 'validation',
        title: `[HA] Verify ${spec.haMode} synchronization status and configuration checksum parity`,
        description: 'Execute "diagnose sys ha checksum status" to verify that global and VDOM configuration checksums match identically across both cluster member nodes.',
        priority: 'Critical',
        completed: false,
        category: 'HA Sync',
        cliCommand: 'diagnose sys ha checksum recalculate\ndiagnose sys ha checksum show',
        isDynamic: true,
        dynamicReason: 'ha',
        tags: ['HA Checksum', 'Sync Status', 'Parity'],
      },
      {
        id: 'val-ha-2',
        phaseId: 'validation',
        title: '[HA] Perform controlled failover test and measure failover convergence time',
        description: 'Initiate a forced failover ("execute ha failover set") or disconnect primary uplink cable. Confirm secondary node assumes Primary role with zero/minimal packet drop (<1 second).',
        priority: 'High',
        completed: false,
        category: 'HA Failover Test',
        cliCommand: 'execute ha failover set 1',
        isDynamic: true,
        dynamicReason: 'ha',
        tags: ['Failover Test', 'HA Switchover', 'Convergence'],
      }
    );

    if (isActiveActive) {
      tasks.push({
        id: 'val-ha-aa-1',
        phaseId: 'validation',
        title: '[HA Active-Active] Verify session distribution and load-balancing algorithm',
        description: 'Confirm load balancing schedule (round-robin, weight, least-connections) and verify active session table distribution across primary and secondary nodes.',
        priority: 'High',
        completed: false,
        category: 'HA Active-Active',
        cliCommand: 'diagnose sys ha dump-by dev',
        isDynamic: true,
        dynamicReason: 'ha',
        tags: ['Active-Active', 'Session Load', 'LB Schedule'],
      });
    }
  }

  // ==========================================
  // DYNAMIC STEPS FOR VDOMs (VIRTUAL DOMAINS)
  // ==========================================
  if (isVdom) {
    const vdomList = spec.vdomNames ? spec.vdomNames.split(',').map((s) => s.trim()).filter(Boolean) : ['root', 'DMZ_VDOM'];

    tasks.push(
      // Phase 1 VDOM
      {
        id: 'plan-vdom-1',
        phaseId: 'planning',
        title: '[VDOM] Catalog global settings vs per-VDOM configurations',
        description: `Identify parameters belonging to "config global" (hardware, physical interfaces, HA, system NTP/DNS) vs per-VDOM commands (security policies, routing tables, VPNs) for target VDOMs: ${vdomList.join(', ')}.`,
        priority: 'Critical',
        completed: false,
        category: 'VDOM Planning',
        cliCommand: 'config global\nget system status',
        isDynamic: true,
        dynamicReason: 'vdom',
        tags: ['VDOM Architecture', 'Global vs VDOM', 'Config Scope'],
      },
      {
        id: 'plan-vdom-2',
        phaseId: 'planning',
        title: '[VDOM] Document VDOM resource limits (CPU, Memory, Sessions, Policy counts)',
        description: 'Export resource quota definitions ("config global -> config system vdom-property") to prevent any single virtual domain from starving shared physical CPU/RAM capacity.',
        priority: 'High',
        completed: false,
        category: 'VDOM Quotas',
        cliCommand: 'config global\nconfig system vdom-property\n  show\nend',
        isDynamic: true,
        dynamicReason: 'vdom',
        tags: ['VDOM Quotas', 'Resource Allocation', 'Limits'],
      },

      // Phase 2 VDOM
      {
        id: 'hw-vdom-1',
        phaseId: 'hardware',
        title: '[VDOM] Map physical ports and VLAN trunks to designated Virtual Domains',
        description: `Map physical interfaces and sub-interfaces to target VDOMs (${vdomList.join(', ')}). Verify interface bindings under "config global -> config system interface".`,
        priority: 'Critical',
        completed: false,
        category: 'VDOM Interfaces',
        cliCommand: 'config global\nconfig system interface\n  edit "port1"\n    set vdom "' + (vdomList[0] || 'root') + '"\n  next\nend',
        isDynamic: true,
        dynamicReason: 'vdom',
        tags: ['Interface Binding', 'VDOM Assignment', 'VLANs'],
      },
      {
        id: 'hw-vdom-2',
        phaseId: 'hardware',
        title: '[VDOM] Design Inter-VDOM Links (IVL / NPU-Accelerated Links)',
        description: 'Define virtual npu-vlink or software vdom-link interfaces for inter-domain routing without consuming physical loopback cabling.',
        priority: 'High',
        completed: false,
        category: 'Inter-VDOM Link',
        cliCommand: 'config global\nconfig system vdom-link\n  edit "ivl-root-dmz"\n  next\nend',
        isDynamic: true,
        dynamicReason: 'vdom',
        tags: ['Inter-VDOM Link', 'NPU Acceleration', 'Virtual Routing'],
      },

      // Phase 3 VDOM
      {
        id: 'cfg-vdom-1',
        phaseId: 'syntax',
        title: '[VDOM] Enable Multi-VDOM operational mode on destination appliance',
        description: 'Execute "config system global -> set vdom-mode multi-vdom" on destination FortiGate prior to importing individual VDOM config blocks.',
        priority: 'Critical',
        completed: false,
        category: 'VDOM Mode',
        cliCommand: 'config system global\n  set vdom-mode multi-vdom\nend',
        isDynamic: true,
        dynamicReason: 'vdom',
        tags: ['Multi-VDOM Mode', 'System Global', 'Activation'],
      },

      // Phase 4 VDOM
      {
        id: 'val-vdom-1',
        phaseId: 'validation',
        title: '[VDOM] Validate routing tables and active session counts per VDOM',
        description: `Perform independent route checks and session table audits for each active VDOM (${vdomList.join(', ')}). Ensure cross-VDOM policies are logging correctly.`,
        priority: 'Critical',
        completed: false,
        category: 'VDOM Validation',
        cliCommand: 'config vdom\nedit ' + (vdomList[0] || 'root') + '\ndiagnose ip router bgp summary\ndiagnose sys session list',
        isDynamic: true,
        dynamicReason: 'vdom',
        tags: ['Per-VDOM Routing', 'Session Audit', 'VDOM Logs'],
      }
    );
  }

  // ==========================================
  // DYNAMIC STEPS FOR FIRMWARE MAJOR JUMP
  // ==========================================
  const srcVer = spec.sourceFirmware || '';
  const dstVer = spec.destinationFirmware || '';
  const isFirmwareMajorJump =
    (srcVer.includes('6.4') || srcVer.includes('6.2')) &&
    (dstVer.includes('7.2') || dstVer.includes('7.4') || dstVer.includes('7.6'));

  if (isFirmwareMajorJump) {
    tasks.push(
      {
        id: 'plan-fw-1',
        phaseId: 'planning',
        title: '[Firmware Delta] Audit SSL VPN Web-Mode deprecations (FortiOS 7.4+)',
        description: 'FortiOS 7.4+ removes legacy SSL VPN Web Portal bookmarks. Audit existing SSL VPN web mode portals and convert users to FortiClient IPsec/SSL Tunnel mode or ZTNA application proxy.',
        priority: 'Critical',
        completed: false,
        category: 'SSL VPN Deprecation',
        cliCommand: 'show vpn ssl web portal',
        isDynamic: true,
        dynamicReason: 'firmware',
        tags: ['SSL VPN', 'FortiOS 7.4', 'ZTNA', 'Deprecation'],
      },
      {
        id: 'cfg-fw-1',
        phaseId: 'syntax',
        title: '[Firmware Delta] Migrate legacy SD-WAN rules & SLA probe syntax (v6.4 -> v7.x)',
        description: 'Verify SD-WAN route-map structures, implicit rules, and SLA probe definitions updated to FortiOS 7.x schema ("config system sdwan").',
        priority: 'High',
        completed: false,
        category: 'SD-WAN Syntax',
        cliCommand: 'show system sdwan',
        isDynamic: true,
        dynamicReason: 'firmware',
        tags: ['SD-WAN Migration', 'FortiOS 7.0+', 'CLI Conversion'],
      }
    );
  }

  return tasks;
}

export const CLI_COMMAND_REFS: CliCommandRef[] = [
  {
    title: 'Check System Status & Hardware Info',
    command: 'get system status\nget hardware status',
    description: 'Displays FortiOS version, serial number, license status, CPU/RAM usage, and hardware model.',
    category: 'System',
  },
  {
    title: 'Backup Configuration via Console/SSH',
    command: 'execute backup config flash "migration_backup.conf"',
    description: 'Saves complete XML/CLI configuration block directly to internal flash storage.',
    category: 'System',
  },
  {
    title: 'Check HA Cluster Status & Synchronization',
    command: 'get system ha status\ndiagnose sys ha checksum show',
    description: 'Displays active HA cluster roles, heartbeat health, member serial numbers, and sync checksums.',
    category: 'HA',
  },
  {
    title: 'Recalculate HA Config Checksums',
    command: 'diagnose sys ha checksum recalculate',
    description: 'Forces recalculation of local cluster configuration checksums to resolve unsynchronized state.',
    category: 'HA',
  },
  {
    title: 'Force HA Failover Test',
    command: 'execute ha failover set 1\nexecute ha failover unset',
    description: 'Simulates a cluster failover to force secondary unit to assume Master role for testing.',
    category: 'HA',
  },
  {
    title: 'Enable Multi-VDOM Mode',
    command: 'config system global\n  set vdom-mode multi-vdom\nend',
    description: 'Enables virtual domain segmentation capabilities on new FortiGate appliance.',
    category: 'VDOM',
  },
  {
    title: 'Switch VDOM Context in CLI',
    command: 'config vdom\nedit <VDOM_NAME>\nget system status',
    description: 'Switches CLI context from global configuration to an individual target VDOM.',
    category: 'VDOM',
  },
  {
    title: 'Check BGP Routing Neighbors & Table',
    command: 'diagnose ip router bgp summary\ndiagnose ip router bgp neighbor',
    description: 'Lists active BGP peering sessions, route advertisement counts, and neighbor uptime.',
    category: 'Routing',
  },
  {
    title: 'Check IPsec VPN Tunnel Status',
    command: 'diagnose vpn ike gateway list\ndiagnose vpn tunnel list',
    description: 'Displays IKE Phase 1 security associations and Phase 2 IPsec tunnel traffic counters.',
    category: 'VPN',
  },
  {
    title: 'Test FortiGuard Connectivity & Signature Download',
    command: 'diagnose autoupdate status\nexecute update-now',
    description: 'Validates communication with FortiGuard servers and triggers manual signature update.',
    category: 'FortiGuard',
  },
];
