import { CanvasState, HistoryState } from '@/types';

const MAX_HISTORY_STEPS = 20;

export const createHistoryState = (initialState: CanvasState): HistoryState => ({
  past: [],
  present: initialState,
  future: [],
});

export const canUndo = (history: HistoryState): boolean => {
  return history.past.length > 0;
};

export const canRedo = (history: HistoryState): boolean => {
  return history.future.length > 0;
};

export const undo = (history: HistoryState): HistoryState => {
  if (!canUndo(history)) return history;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, history.past.length - 1);

  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  };
};

export const redo = (history: HistoryState): HistoryState => {
  if (!canRedo(history)) return history;

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  };
};

export const pushToHistory = (history: HistoryState, newState: CanvasState): HistoryState => {
  const newPast = [...history.past, history.present];
  
  // Limit history to MAX_HISTORY_STEPS
  if (newPast.length > MAX_HISTORY_STEPS) {
    newPast.shift();
  }

  return {
    past: newPast,
    present: newState,
    future: [], // Clear future when new action is performed
  };
};

export const getHistoryInfo = (history: HistoryState) => ({
  canUndo: canUndo(history),
  canRedo: canRedo(history),
  pastSteps: history.past.length,
  futureSteps: history.future.length,
  totalSteps: history.past.length + history.future.length + 1,
});
