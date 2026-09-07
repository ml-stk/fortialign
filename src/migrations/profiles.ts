import type { MigrationProfile } from '../utils/fortiEngine';

/** Initial production migration profile for the 100E -> 120G case. */
export const fortigate100ETo120G714Profile: MigrationProfile = {
  sourceModel: 'FortiGate 100E',
  destinationModel: 'FortiGate 120G',
  sourceFirmware: '7.0.19 build 0696',
  destinationFirmware: '7.4.12 build 2902',
  // Deterministic same-name mappings are safe for the 120G target.
  // Interfaces without an exact target equivalent remain explicitly unmapped
  // and are surfaced for engineering review rather than silently assigned.
  interfaceMapping: {
    '"wan1"': '"wan1"',
    '"wan2"': '"wan2"',
    '"mgmt"': '"mgmt"',
    '"port1"': '"port1"',
    '"port2"': '"port2"',
    '"port3"': '"port3"',
    '"port4"': '"port4"',
    '"port5"': '"port5"',
    '"port6"': '"port6"',
    '"port7"': '"port7"',
    '"port8"': '"port8"',
    '"port9"': '"port9"',
    '"port10"': '"port10"',
    '"port11"': '"port11"',
    '"port12"': '"port12"',
    '"port13"': '"port13"',
    '"port14"': '"port14"',
    '"port15"': '"port15"',
    '"port16"': '"port16"',
  },
  reviewConfigs: [
    'system npu',
    'system virtual-switch',
    'system switch-interface',
    'system switch-controller',
  ],
};
