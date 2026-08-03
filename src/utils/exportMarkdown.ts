import { ChecklistTask, MigrationSpec, PhaseInfo } from '../types';

export function generateMarkdownRunbook(
  spec: MigrationSpec,
  phases: PhaseInfo[],
  tasks: ChecklistTask[]
): string {
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const timestamp = new Date().toLocaleString();

  let md = `# FortiGate Appliance Migration Audit Checklist & Runbook

**Generated:** ${timestamp}  
**Overall Completion:** ${progressPercent}% (${completedCount}/${totalCount} tasks)

---

## 📋 Migration Specifications

| Parameter | Value |
| :--- | :--- |
| **Source Model** | ${spec.sourceModel || 'Not Specified'} |
| **Destination Model** | ${spec.destinationModel || 'Not Specified'} |
| **Source Firmware** | ${spec.sourceFirmware || 'Not Specified'} |
| **Destination Firmware** | ${spec.destinationFirmware || 'Not Specified'} |
| **HA Mode** | ${spec.haMode} |
| **VDOMs Enabled** | ${spec.vdomsEnabled ? 'Yes' : 'No'} |
${spec.vdomsEnabled && spec.vdomNames ? `| **Active VDOMs** | ${spec.vdomNames} |\n` : ''}${spec.notes ? `| **Notes** | ${spec.notes} |\n` : ''}

---

## 🛠️ Phase Checklist & Execution Plan

`;

  phases.forEach((phase) => {
    const phaseTasks = tasks.filter((t) => t.phaseId === phase.id);
    const phaseDone = phaseTasks.filter((t) => t.completed).length;
    const phasePercent = phaseTasks.length > 0 ? Math.round((phaseDone / phaseTasks.length) * 100) : 0;

    md += `### Phase ${phase.number}: ${phase.title} (${phasePercent}% - ${phaseDone}/${phaseTasks.length})\n`;
    md += `*${phase.description}*\n\n`;

    if (phaseTasks.length === 0) {
      md += `*No tasks configured for this phase.*\n\n`;
    } else {
      phaseTasks.forEach((task) => {
        const check = task.completed ? '[x]' : '[ ]';
        const dynamicBadge = task.isDynamic ? ` \`[DYNAMIC: ${task.dynamicReason?.toUpperCase()}]\`` : '';
        const priorityBadge = `**[${task.priority}]**`;

        md += `- ${check} ${priorityBadge} **${task.title}**${dynamicBadge}\n`;
        md += `  - *Category:* ${task.category}\n`;
        md += `  - ${task.description.replace(/\n/g, ' ')}\n`;

        if (task.cliCommand) {
          md += `  - **CLI Command Reference:**\n`;
          md += `    \`\`\`fortios\n`;
          task.cliCommand.split('\n').forEach((line) => {
            md += `    ${line}\n`;
          });
          md += `    \`\`\`\n`;
        }

        if (task.note && task.note.trim()) {
          md += `  - 📝 **Engineer Note:** ${task.note.trim()}\n`;
        }

        md += `\n`;
      });
    }

    md += `---\n\n`;
  });

  md += `## 🔒 Sign-off & Audit Notes\n\n`;
  md += `- **Lead Migration Engineer:** _________________________\n`;
  md += `- **Network Peer Reviewer:** _________________________\n`;
  md += `- **Maintenance Window Date:** _________________________\n`;
  md += `- **Approval Status:** [ ] Approved  [ ] Rollback Required  [ ] Pending Audit\n`;

  return md;
}

export function downloadMarkdownFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
