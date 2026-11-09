import type { GhostLimits } from './gating';

export interface SchedulerDeps {
  limits: () => GhostLimits;
  spawn: () => void;
  rng?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (id: unknown) => void;
}

/** Pure timing logic for popup ghosts: spawn limit, random cooldown, pause when hidden. */
export class GhostScheduler {
  private active = 0;
  private timer: unknown = null;
  private paused = false;
  private running = false;
  private readonly rng: () => number;
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly clearTimer: (id: unknown) => void;

  constructor(private deps: SchedulerDeps) {
    this.rng = deps.rng ?? Math.random;
    this.setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer =
      deps.clearTimer ?? ((id) => clearTimeout(id as ReturnType<typeof setTimeout>));
  }

  get activeCount(): number {
    return this.active;
  }

  nextDelay(): number {
    const { minCooldownMs, maxCooldownMs } = this.deps.limits();
    return minCooldownMs + this.rng() * (maxCooldownMs - minCooldownMs);
  }

  start(): void {
    this.running = true;
    this.arm();
  }

  stop(): void {
    this.running = false;
    this.disarm();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.disarm();
    else if (this.running) this.arm();
  }

  /** Call when a ghost is banished or fades away. */
  released(): void {
    this.active = Math.max(0, this.active - 1);
  }

  private disarm(): void {
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
  }

  private arm(): void {
    this.disarm();
    if (!this.running || this.paused) return;
    this.timer = this.setTimer(() => {
      this.timer = null;
      const limits = this.deps.limits();
      if (limits.enabled && this.active < limits.max) {
        this.active++;
        this.deps.spawn();
      }
      this.arm();
    }, this.nextDelay());
  }
}
