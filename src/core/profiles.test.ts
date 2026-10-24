import { describe, expect, it } from 'vitest';
import { ProfileStore } from './profiles';
import { CURRENT_VERSION, STORAGE_KEY, createMemoryStorage, loadSave } from './storage';

describe('loadSave', () => {
  it('renvoie une sauvegarde vide au premier lancement', () => {
    expect(loadSave(createMemoryStorage())).toEqual({ version: CURRENT_VERSION, profiles: [] });
  });

  it('met de côté une sauvegarde abîmée au lieu de la perdre', () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, '{pas du json');
    expect(loadSave(storage).profiles).toEqual([]);
    const backupKey = [...Array(storage.length).keys()]
      .map((i) => storage.key(i))
      .find((k) => k?.startsWith(`${STORAGE_KEY}.backup.`));
    expect(backupKey && storage.getItem(backupKey)).toBe('{pas du json');
  });

  it('garde telle quelle une sauvegarde d’une version plus récente', () => {
    const storage = createMemoryStorage();
    const future = { version: CURRENT_VERSION + 1, profiles: [], extra: true };
    storage.setItem(STORAGE_KEY, JSON.stringify(future));
    expect(loadSave(storage)).toEqual(future);
  });
});

describe('ProfileStore', () => {
  it('crée un profil et le retrouve après rechargement', () => {
    const storage = createMemoryStorage();
    const profile = new ProfileStore(storage).create('  Léa ', '#4d96ff');
    expect(profile.name).toBe('Léa');

    const reloaded = new ProfileStore(storage);
    expect(reloaded.list()).toHaveLength(1);
    expect(reloaded.get(profile.id)?.name).toBe('Léa');
  });

  it('refuse un prénom vide, trop long ou déjà pris', () => {
    const store = new ProfileStore(createMemoryStorage());
    store.create('Léa', '#4d96ff');
    expect(store.validateName('   ')).not.toBeNull();
    expect(store.validateName('a'.repeat(21))).not.toBeNull();
    expect(store.validateName('léa')).not.toBeNull();
    expect(store.validateName('Tom')).toBeNull();
    expect(() => store.create('LÉA', '#ff6b6b')).toThrow();
  });

  it('range les données de chaque activité dans le profil', () => {
    const storage = createMemoryStorage();
    const store = new ProfileStore(storage);
    const lea = store.create('Léa', '#4d96ff');
    const tom = store.create('Tom', '#ff6b6b');

    store.setActivityData(lea.id, 'tables', { stars: { 2: 3 } });

    const reloaded = new ProfileStore(storage);
    expect(reloaded.getActivityData(lea.id, 'tables')).toEqual({ stars: { 2: 3 } });
    expect(reloaded.getActivityData(tom.id, 'tables')).toBeUndefined();
  });

  it('supprime un profil sans toucher aux autres', () => {
    const storage = createMemoryStorage();
    const store = new ProfileStore(storage);
    const lea = store.create('Léa', '#4d96ff');
    const tom = store.create('Tom', '#ff6b6b');
    store.setActivityData(tom.id, 'tables', { record: 42 });

    store.remove(lea.id);

    const reloaded = new ProfileStore(storage);
    expect(reloaded.list().map((p) => p.name)).toEqual(['Tom']);
    expect(reloaded.getActivityData(tom.id, 'tables')).toEqual({ record: 42 });
  });
});
