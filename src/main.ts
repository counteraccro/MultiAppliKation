import './style.css';
import { startApp } from './app';
import { ProfileStore } from './core/profiles';
import { getStorage } from './core/storage';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('#app introuvable');

startApp(root, new ProfileStore(getStorage()));
