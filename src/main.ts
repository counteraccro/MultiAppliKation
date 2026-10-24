import './style.css';
import { startApp } from './app';
import { showUpdateDialog } from './components/update-dialog';
import { ProfileStore } from './core/profiles';
import { unlockAudioOnFirstTouch } from './core/sound';
import { getStorage } from './core/storage';
import { watchForUpdates } from './core/version';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('#app introuvable');

startApp(root, new ProfileStore(getStorage()));
unlockAudioOnFirstTouch();
watchForUpdates(showUpdateDialog);
