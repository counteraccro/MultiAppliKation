// Sauvegarde versionnée dans localStorage, sur l'appareil (voir .ai/analyse/06-profils-donnees.md).

export const STORAGE_KEY = 'multiapplikation';
export const CURRENT_VERSION = 1;

export interface Profile {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  // Chaque activité range sa progression sous son identifiant (ex. `tables`).
  activities: Record<string, unknown>;
}

export interface SaveData {
  version: number;
  profiles: Profile[];
}

export function emptySave(): SaveData {
  return { version: CURRENT_VERSION, profiles: [] };
}

// Une étape par version : migrations[n] transforme une sauvegarde v(n) en v(n+1).
// Un ajout de champ ou d'activité passe par ici, sans perdre la progression.
const migrations: Record<number, (data: any) => any> = {};

function migrate(data: any): SaveData {
  let current = data;
  while (current.version < CURRENT_VERSION) {
    const step = migrations[current.version];
    if (!step) throw new Error(`Pas de migration depuis la version ${current.version}`);
    current = { ...step(current), version: current.version + 1 };
  }
  return current as SaveData;
}

function isSaveShape(data: unknown): data is { version: number; profiles: unknown[] } {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return typeof d.version === 'number' && Array.isArray(d.profiles);
}

export function loadSave(storage: Storage): SaveData {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return emptySave();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isSaveShape(parsed)) throw new Error('Sauvegarde illisible');
    // Sauvegarde écrite par une version plus récente de l'app : on la garde telle quelle.
    if (parsed.version > CURRENT_VERSION) return parsed as SaveData;
    return migrate(parsed);
  } catch {
    // On ne jette jamais une progression : la sauvegarde abîmée est mise de côté.
    storage.setItem(`${STORAGE_KEY}.backup.${Date.now()}`, raw);
    return emptySave();
  }
}

export function writeSave(storage: Storage, data: SaveData): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// localStorage peut être indisponible (navigation privée, réglages) :
// l'app reste utilisable, sans sauvegarde.
export function getStorage(): Storage {
  try {
    const probe = `${STORAGE_KEY}.probe`;
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return createMemoryStorage();
  }
}

export function createMemoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, String(value)),
  };
}
