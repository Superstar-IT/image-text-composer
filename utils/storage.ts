import { CanvasState } from '@/types';

const STORAGE_KEY = 'image-text-composer-state';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Save the current canvas state to localStorage
export const saveToStorage = (state: CanvasState): void => {
  if (!isBrowser) return;
  
  // Check if background image data URL is too large (limit to ~5MB)
  if (state.backgroundImage?.src && state.backgroundImage.src.length > 5 * 1024 * 1024) {
    console.warn('Background image is too large for localStorage, removing it to prevent storage issues');
    state = {
      ...state,
      backgroundImage: undefined
    };
  }

  const dataToSave = {
    state,
    timestamp: Date.now(),
  };
  const serializedData = JSON.stringify(dataToSave);
  
  try {
    window.localStorage.setItem(STORAGE_KEY, serializedData);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    // If localStorage is full, try to clear old data and retry
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        window.localStorage.clear();
        window.localStorage.setItem(STORAGE_KEY, serializedData);
      } catch (retryError) {
        console.error('Failed to save even after clearing localStorage:', retryError);
      }
    }
  }
};

// Load the canvas state from localStorage
export const loadFromStorage = (): CanvasState | null => {
  if (!isBrowser) return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedData = JSON.parse(stored);
      // Handle both old format (just state) and new format (with timestamp)
      let state: CanvasState;
      if (parsedData.state) {
        state = parsedData.state as CanvasState;
      } else {
        state = parsedData as CanvasState;
      }
      
      // Validate background image data
      if (state.backgroundImage && (!state.backgroundImage.src || typeof state.backgroundImage.src !== 'string')) {
        console.warn('Invalid background image data found in storage, removing it');
        state.backgroundImage = undefined;
      }
      
      return state;
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
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
  if (!isBrowser) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    console.error('Failed to check localStorage:', error);
    return false;
  }
};

export const getLastSaveTime = (): Date | null => {
  if (!isBrowser) return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedData = JSON.parse(stored);
      if (parsedData.timestamp) {
        return new Date(parsedData.timestamp);
      }
    }
  } catch (error) {
    console.error('Failed to get last save time:', error);
  }
  return null;
};
