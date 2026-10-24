import type { Grade } from './grades';
import { loadSave, writeSave, type Profile, type SaveData } from './storage';

export const PROFILE_COLORS = [
  '#ff6b6b', // rouge
  '#ff9f43', // orange
  '#f7c948', // jaune
  '#2ecc71', // vert
  '#1abc9c', // turquoise
  '#4d96ff', // bleu
  '#9b5de5', // violet
  '#f15bb5', // rose
] as const;

export const NAME_MAX_LENGTH = 20;

function newId(): string {
  // crypto.randomUUID n'existe qu'en HTTPS : en essai sur le réseau local (http), on s'en passe.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class ProfileStore {
  private data: SaveData;

  constructor(private readonly storage: Storage) {
    this.data = loadSave(storage);
  }

  list(): readonly Profile[] {
    return this.data.profiles;
  }

  get(id: string): Profile | undefined {
    return this.data.profiles.find((p) => p.id === id);
  }

  /** Message d'erreur à afficher, ou null si le prénom convient (`exceptId` : le profil qu'on modifie). */
  validateName(name: string, exceptId?: string): string | null {
    const trimmed = name.trim();
    if (trimmed.length === 0) return 'Écris ton prénom.';
    if (trimmed.length > NAME_MAX_LENGTH) return `${NAME_MAX_LENGTH} lettres au maximum.`;
    const taken = this.data.profiles.some(
      (p) => p.id !== exceptId && p.name.toLocaleLowerCase('fr') === trimmed.toLocaleLowerCase('fr'),
    );
    if (taken) return 'Ce prénom existe déjà.';
    return null;
  }

  create(name: string, color: string, grade?: Grade): Profile {
    const error = this.validateName(name);
    if (error) throw new Error(error);
    const profile: Profile = {
      id: newId(),
      name: name.trim(),
      color,
      grade,
      createdAt: Date.now(),
      activities: {},
    };
    this.data.profiles.push(profile);
    this.save();
    return profile;
  }

  /** Prénom, couleur, classe : la progression ne bouge pas. */
  update(id: string, changes: Partial<Pick<Profile, 'name' | 'color' | 'grade'>>): Profile {
    const profile = this.get(id);
    if (!profile) throw new Error(`Profil inconnu : ${id}`);
    if (changes.name !== undefined) {
      const error = this.validateName(changes.name, id);
      if (error) throw new Error(error);
      profile.name = changes.name.trim();
    }
    if (changes.color !== undefined) profile.color = changes.color;
    if (changes.grade !== undefined) profile.grade = changes.grade;
    this.save();
    return profile;
  }

  remove(id: string): void {
    this.data.profiles = this.data.profiles.filter((p) => p.id !== id);
    this.save();
  }

  getActivityData<T>(profileId: string, activityId: string): T | undefined {
    return this.get(profileId)?.activities[activityId] as T | undefined;
  }

  setActivityData<T>(profileId: string, activityId: string, value: T): void {
    const profile = this.get(profileId);
    if (!profile) throw new Error(`Profil inconnu : ${profileId}`);
    profile.activities[activityId] = value;
    this.save();
  }

  private save(): void {
    writeSave(this.storage, this.data);
  }
}
