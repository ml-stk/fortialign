import type { MigrationProfile } from '../utils/fortiEngine';

/** Initial production migration profile for the 100E -> 120G case. */
export const fortigate100ETo120G714Profile: MigrationProfile = {
  sourceModel: 'FortiGate 100E',
  destinationModel: 'FortiGate 120G',
  sourceFirmware: '7.0.19 build 0696',
  destinationFirmware: '7.4.12 build 2902',
  // Physical target ports must be confirmed against the actual appliance.
  interfaceMapping: {},
  reviewConfigs: [
    'system npu',
    'system virtual-switch',
    'system switch-interface',
    'system switch-controller',
  ],
};
