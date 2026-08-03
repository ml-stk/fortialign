import { ChecklistTask, MigrationSpec } from '../types';

const STORAGE_KEY_SPEC = 'fortigate_migration_spec_v1';
const STORAGE_KEY_TASKS = 'fortigate_migration_tasks_v1';

export function saveToStorage(spec: MigrationSpec, tasks: ChecklistTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SPEC, JSON.stringify(spec));
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function loadFromStorage(): { spec: MigrationSpec | null; tasks: ChecklistTask[] | null } {
  try {
    const rawSpec = localStorage.getItem(STORAGE_KEY_SPEC);
    const rawTasks = localStorage.getItem(STORAGE_KEY_TASKS);

    return {
      spec: rawSpec ? JSON.parse(rawSpec) : null,
      tasks: rawTasks ? JSON.parse(rawTasks) : null,
    };
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return { spec: null, tasks: null };
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SPEC);
    localStorage.removeItem(STORAGE_KEY_TASKS);
  } catch (err) {
    console.error('Failed to clear localStorage:', err);
  }
}
