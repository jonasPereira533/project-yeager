export interface ReloadGuardState {
  settled: string;
  current: string;
}

export function shouldWarnOnReload(state: ReloadGuardState): boolean {
  return state.current.trim() !== state.settled.trim();
}