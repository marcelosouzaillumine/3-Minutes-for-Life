import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Unified key/value storage: Capacitor Preferences on native (secure, off-webview storage),
// localStorage on web. This makes token storage safe from XSS on native builds.

const isNative = Capacitor.isNativePlatform();

export const storage = {
  async get(key: string): Promise<string | null> {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    if (isNative) {
      await Preferences.set({ key, value });
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[Storage] localStorage.setItem failed:', e);
    }
  },

  async remove(key: string): Promise<void> {
    if (isNative) {
      await Preferences.remove({ key });
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('[Storage] localStorage.removeItem failed:', e);
    }
  },
};
