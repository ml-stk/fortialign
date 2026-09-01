# Migration profiles

Profiles define source/target FortiGate models and FortiOS releases. Hardware capability data is kept separate from the migration profile so the physical interface inventory can be replaced with the actual target appliance inventory when it arrives.

## 100E → 120G

Source: FortiGate 100E / FortiOS 7.0.19 build 0696
Target: FortiGate 120G / FortiOS 7.4.12 build 2902

The profile intentionally has no physical interface mapping until the target appliance is inspected. A production compilation must block on required unmapped interfaces.
