import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/stores/appStore';

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.setState({ bankrollVersion: 0, strategyVersion: 0 });
  });

  it('starts with version 0', () => {
    expect(useAppStore.getState().bankrollVersion).toBe(0);
    expect(useAppStore.getState().strategyVersion).toBe(0);
  });

  it('bumpBankroll increments bankrollVersion', () => {
    useAppStore.getState().bumpBankroll();
    expect(useAppStore.getState().bankrollVersion).toBe(1);
  });

  it('bumpStrategy increments strategyVersion', () => {
    useAppStore.getState().bumpStrategy();
    useAppStore.getState().bumpStrategy();
    expect(useAppStore.getState().strategyVersion).toBe(2);
  });

  it('bumps are independent', () => {
    useAppStore.getState().bumpBankroll();
    useAppStore.getState().bumpStrategy();
    expect(useAppStore.getState().bankrollVersion).toBe(1);
    expect(useAppStore.getState().strategyVersion).toBe(1);
  });
});
