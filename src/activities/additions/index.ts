import { ADDITION } from '../tables/questions';
import { tablesActivity } from '../tables';

// Mêmes modes que les Tables (voir .ai/analyse/14-additions.md) : seule l'opération change.
export const additions = tablesActivity({ id: 'additions', emoji: '+', color: '#ff9f43' }, ADDITION);
