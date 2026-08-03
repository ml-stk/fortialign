export type HaMode = 'Standalone' | 'Active-Passive' | 'Active-Active';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type PhaseId = 'planning' | 'hardware' | 'syntax' | 'validation';

export interface PhaseInfo {
  id: PhaseId;
  title: string;
  number: number;
  description: string;
  iconName: string;
}

export interface ChecklistTask {
  id: string;
  phaseId: PhaseId;
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  category: string;
  cliCommand?: string;
  note?: string;
  isDynamic?: boolean;
  dynamicReason?: 'ha' | 'vdom' | 'firmware' | 'custom';
  tags?: string[];
}

export interface MigrationSpec {
  sourceModel: string;
  destinationModel: string;
  sourceFirmware: string;
  destinationFirmware: string;
  haMode: HaMode;
  vdomsEnabled: boolean;
  vdomNames: string;
  notes: string;
}

export interface MigrationPreset {
  id: string;
  name: string;
  description: string;
  spec: MigrationSpec;
}

export interface CliCommandRef {
  title: string;
  command: string;
  description: string;
  category: 'HA' | 'VDOM' | 'Routing' | 'System' | 'VPN' | 'FortiGuard';
}
