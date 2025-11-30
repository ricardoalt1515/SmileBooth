import { describe, it, expect } from 'vitest';
import { boothReducer, type BoothFSMState, type BoothAction } from '../screens/UnifiedBoothScreen';

function reduce(state: BoothFSMState, action: BoothAction): BoothFSMState {
  return boothReducer(state, action);
}

describe('boothReducer', () => {
  it('starts session from idle with correct countdown', () => {
    const initial: BoothFSMState = {
      mode: 'idle',
      countdown: 0,
      pauseCountdown: 2,
      autoResetTimer: 30,
    };

    const next = reduce(initial, { type: 'START_SESSION', countdownSeconds: 5 });

    expect(next.mode).toBe('countdown');
    expect(next.countdown).toBe(5);
    expect(next.pauseCountdown).toBe(2);
    expect(next.autoResetTimer).toBe(30);
  });

  it('ticks countdown without going below zero', () => {
    const initial: BoothFSMState = {
      mode: 'countdown',
      countdown: 1,
      pauseCountdown: 2,
      autoResetTimer: 30,
    };

    const next = reduce(initial, { type: 'TICK_COUNTDOWN' });
    const next2 = reduce(next, { type: 'TICK_COUNTDOWN' });

    expect(next.countdown).toBe(0);
    expect(next2.countdown).toBe(0);
  });

  it('handles pause cycle and returns to countdown', () => {
    const paused: BoothFSMState = {
      mode: 'pausing',
      countdown: 3,
      pauseCountdown: 1,
      autoResetTimer: 30,
    };

    const afterTick = reduce(paused, { type: 'TICK_PAUSE' });
    const afterRestart = reduce(afterTick, { type: 'START_SESSION', countdownSeconds: 4 });

    expect(afterTick.pauseCountdown).toBe(0);
    expect(afterRestart.mode).toBe('countdown');
    expect(afterRestart.countdown).toBe(4);
  });

  it('resets all state correctly', () => {
    const busy: BoothFSMState = {
      mode: 'processing',
      countdown: 0,
      pauseCountdown: 0,
      autoResetTimer: 5,
    };

    const reset = reduce(busy, { type: 'RESET_ALL', countdownSeconds: 5 });

    expect(reset.mode).toBe('idle');
    expect(reset.countdown).toBe(5);
    expect(reset.pauseCountdown).toBe(2);
    expect(reset.autoResetTimer).toBe(30);
  });
});
