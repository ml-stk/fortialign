import React from 'react';
import {
  Server,
  Layers,
  Activity,
  Sliders,
  CheckCircle2,
  Sparkles,
  Info,
  ChevronDown,
} from 'lucide-react';
import { FIRMWARE_VERSIONS, POPULAR_MODELS, PRESETS } from '../data/defaultChecklist';
import { HaMode, MigrationPreset, MigrationSpec } from '../types';

interface SidebarProps {
  spec: MigrationSpec;
  onChangeSpec: (newSpec: MigrationSpec) => void;
  onApplyPreset: (preset: MigrationPreset) => void;
  dynamicCount: { ha: number; vdom: number; firmware: number };
}

export const Sidebar: React.FC<SidebarProps> = ({
  spec,
  onChangeSpec,
  onApplyPreset,
  dynamicCount,
}) => {
  const [showModelPresets, setShowModelPresets] = React.useState(false);

  const handleInputChange = (field: keyof MigrationSpec, value: any) => {
    onChangeSpec({ ...spec, [field]: value });
  };

  return (
    <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 p-4 shrink-0 space-y-6 overflow-y-auto">
      {/* Quick Presets Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Preset Scenarios</span>
          </label>
        </div>
        <select
          onChange={(e) => {
            const found = PRESETS.find((p) => p.id === e.target.value);
            if (found) onApplyPreset(found);
          }}
          defaultValue=""
          className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-red-500 cursor-pointer"
        >
          <option value="" disabled>
            -- Load Quick Preset Template --
          </option>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t border-slate-800 pt-4 space-y-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Sliders className="w-3.5 h-3.5 text-red-400" />
          <span>Appliance Transition Specs</span>
        </h2>

        {/* Source Model */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span>Source Model</span>
            <span className="text-[10px] text-slate-500">e.g., FG-60E</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={spec.sourceModel}
              onChange={(e) => handleInputChange('sourceModel', e.target.value)}
              placeholder="e.g. FortiGate 60E"
              className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Destination Model */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span>Destination Model</span>
            <span className="text-[10px] text-slate-500">e.g., FG-70F</span>
          </label>
          <input
            type="text"
            value={spec.destinationModel}
            onChange={(e) => handleInputChange('destinationModel', e.target.value)}
            placeholder="e.g. FortiGate 70F"
            className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 placeholder-slate-600"
          />
        </div>

        {/* Quick Pick Model Badges Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowModelPresets(!showModelPresets)}
            className="text-[11px] text-red-400 hover:text-red-300 font-medium flex items-center space-x-1 focus:outline-none cursor-pointer"
          >
            <span>{showModelPresets ? 'Hide model picks' : 'Quick model picks'}</span>
            <ChevronDown className={`w-3 h-3 transform transition-transform ${showModelPresets ? 'rotate-180' : ''}`} />
          </button>
          {showModelPresets && (
            <div className="mt-2 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-950 rounded-lg border border-slate-800">
              {POPULAR_MODELS.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => {
                    if (!spec.sourceModel) handleInputChange('sourceModel', model);
                    else handleInputChange('destinationModel', model);
                  }}
                  className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
                >
                  {model}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Source Firmware */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Source Firmware</label>
          <select
            value={spec.sourceFirmware}
            onChange={(e) => handleInputChange('sourceFirmware', e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            {FIRMWARE_VERSIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Destination Firmware */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Destination Firmware</label>
          <select
            value={spec.destinationFirmware}
            onChange={(e) => handleInputChange('destinationFirmware', e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            {FIRMWARE_VERSIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* High Availability (HA) Setup Radio Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>High Availability (HA) Setup</span>
            </label>
            {dynamicCount.ha > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded font-mono">
                +{dynamicCount.ha} steps
              </span>
            )}
          </div>
          <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            {(['Standalone', 'Active-Passive', 'Active-Active'] as HaMode[]).map((mode) => (
              <label
                key={mode}
                className={`flex items-center space-x-2 text-xs p-1.5 rounded cursor-pointer transition-colors ${
                  spec.haMode === mode
                    ? 'bg-red-950/40 border border-red-500/30 text-slate-100 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="haMode"
                  value={mode}
                  checked={spec.haMode === mode}
                  onChange={() => handleInputChange('haMode', mode)}
                  className="text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700"
                />
                <span>{mode}</span>
              </label>
            ))}
          </div>
        </div>

        {/* VDOMs Enabled Toggle Switch */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>VDOMs Enabled?</span>
            </label>
            <button
              type="button"
              onClick={() => handleInputChange('vdomsEnabled', !spec.vdomsEnabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                spec.vdomsEnabled ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  spec.vdomsEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {spec.vdomsEnabled && (
            <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800 animate-in fade-in duration-200">
              <label className="text-[11px] text-slate-400 font-medium">VDOM Names (comma-separated)</label>
              <input
                type="text"
                value={spec.vdomNames}
                onChange={(e) => handleInputChange('vdomNames', e.target.value)}
                placeholder="root, DMZ_VDOM, Internal_VDOM"
                className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-100 rounded px-2 py-1.5 focus:outline-none focus:border-purple-500 placeholder-slate-600"
              />
              <div className="text-[10px] text-purple-400 flex items-center space-x-1 mt-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Adds +{dynamicCount.vdom} VDOM-specific audit tasks</span>
              </div>
            </div>
          )}
        </div>

        {/* Migration Notes / Context */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <label className="text-xs font-medium text-slate-300">Project / Change Window Notes</label>
          <textarea
            value={spec.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="e.g. CR-8849: Datacenter Firewall Maintenance Window (Saturday 01:00 UTC)..."
            rows={3}
            className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-red-500 placeholder-slate-600 resize-none"
          />
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center space-x-1.5 text-slate-200 font-medium">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>Model-Agnostic Engine</span>
        </div>
        <p className="leading-relaxed text-slate-400">
          Modifying HA or VDOM toggles immediately injects or removes specialized FortiOS audit tasks into the checklist.
        </p>
      </div>
    </aside>
  );
};
