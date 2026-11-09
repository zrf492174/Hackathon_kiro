export type PressResult = 'lit' | 'unlit' | 'reset' | 'solved';

/**
 * 5-pumpkin puzzle. Pumpkins must be lit in `order`. Lighting a wrong pumpkin or
 * unlighting any pumpkin before solving resets the row. Once solved it stays solved.
 */
export class PumpkinPuzzle {
  private lit: boolean[];
  private progress = 0;
  private done = false;

  constructor(
    readonly order: readonly number[] = [2, 0, 4, 1, 3],
    readonly size = 5,
  ) {
    this.lit = Array(size).fill(false);
  }

  get solved(): boolean {
    return this.done;
  }

  get state(): readonly boolean[] {
    return this.lit;
  }

  press(i: number): PressResult {
    if (i < 0 || i >= this.size) throw new RangeError('pumpkin index out of range');
    if (this.done) {
      this.lit[i] = !this.lit[i];
      return this.lit[i] ? 'lit' : 'unlit';
    }
    if (this.lit[i]) {
      this.reset();
      return 'reset';
    }
    if (this.order[this.progress] !== i) {
      this.reset();
      return 'reset';
    }
    this.lit[i] = true;
    this.progress++;
    if (this.progress === this.order.length) {
      this.done = true;
      return 'solved';
    }
    return 'lit';
  }

  reset(): void {
    this.lit = Array(this.size).fill(false);
    this.progress = 0;
  }
}
