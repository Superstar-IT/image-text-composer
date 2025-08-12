import { CanvasState } from '@/types';

const STORAGE_KEY = 'image-text-composer-state';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Intentionally no-op to avoid persisting state across refreshes
export const saveToStorage = (_state: CanvasState): void => {
  if (!isBrowser) return;
  try {
    // Do not persist any design; clear stored value if present
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to modify localStorage:', error);
  }
};

// Always start fresh (no restore)
export const loadFromStorage = (): CanvasState | null => {
  return null;
};

export const clearStorage = (): void => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

export const hasStoredData = (): boolean => {
  return false;
};
