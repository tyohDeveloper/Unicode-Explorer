/**
 * CONTROLLER: the one mutable home of Settings. Holds state, applies the pure
 * reducer, notifies subscribers. No DOM, no timers; effects (hash sync, render)
 * subscribe from main.ts.
 */
import type { Settings } from "../state/settings.js";
import { initialSettings } from "../state/settings.js";
import type { SettingsAction } from "../state/settingsActions.js";
import { settingsReducer } from "../state/settingsReducer.js";

export type Listener = (next: Settings, previous: Settings) => void;

export interface SettingsStore {
  get(): Settings;
  dispatch(action: SettingsAction): void;
  subscribe(listener: Listener): () => void;
}

export function createSettingsStore(start: Settings = initialSettings): SettingsStore {
  let state = start;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    dispatch(action) {
      const previous = state;
      state = settingsReducer(state, action);
      if (state !== previous) for (const l of listeners) l(state, previous);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
