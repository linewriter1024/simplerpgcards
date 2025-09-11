import { Injectable } from '@angular/core';

export interface DiceTermResult {
  term: string; // e.g., "2d6"
  rolls: number[]; // e.g., [3,5]
  sum: number; // 8
}

export interface DiceRollResult {
  expression: string; // normalized expression
  terms: DiceTermResult[];
  modifiers: number[]; // individual +N / -N modifiers preserved by sign
  total: number;
}

@Injectable({ providedIn: 'root' })
export class DiceService {
  // Matches NdM (spaces allowed around 'd'), with optional uppercase
  private diceRe = /(\d+)\s*[dD]\s*(\d+)/g;
  private modRe = /([+-])\s*(\d+)/g;

  normalize(expr: string): string {
    // Standardize to e.g., "2d6 + 3 - 1d4"
    let s = expr.trim();
    s = s.replace(/\s*[dD]\s*/g, 'd');
    s = s.replace(/\s*([+\-])\s*/g, ' $1 ');
    s = s.replace(/\s+/g, ' ');
    return s;
  }

  parseTerms(expr: string): { dice: Array<{ n: number; m: number; raw: string }>; modifiers: number[] } {
    const dice: Array<{ n: number; m: number; raw: string }> = [];
    const modifiers: number[] = [];

    // Copy for iteration
    const s = expr;

    let m: RegExpExecArray | null;
    this.diceRe.lastIndex = 0;
    while ((m = this.diceRe.exec(s)) !== null) {
      const n = parseInt(m[1], 10);
      const sides = parseInt(m[2], 10);
      if (isFinite(n) && isFinite(sides) && n > 0 && sides > 0) {
        dice.push({ n, m: sides, raw: `${n}d${sides}` });
      }
    }

    this.modRe.lastIndex = 0;
    let mm: RegExpExecArray | null;
    while ((mm = this.modRe.exec(s)) !== null) {
      const sign = mm[1] === '-' ? -1 : 1;
      const val = parseInt(mm[2], 10) * sign;
      if (isFinite(val)) modifiers.push(val);
    }

    return { dice, modifiers };
  }

  roll(expr: string, rng: () => number = Math.random): DiceRollResult {
    const normalized = this.normalize(expr);
    const { dice, modifiers } = this.parseTerms(normalized);

    const terms: DiceTermResult[] = dice.map(t => {
      const rolls: number[] = [];
      for (let i = 0; i < t.n; i++) {
        const r = 1 + Math.floor(rng() * t.m);
        rolls.push(r);
      }
      const sum = rolls.reduce((a, b) => a + b, 0);
      return { term: t.raw, rolls, sum };
    });

    const total = terms.reduce((acc, t) => acc + t.sum, 0) + modifiers.reduce((a, b) => a + b, 0);

    return {
      expression: normalized,
      terms,
      modifiers,
      total
    };
  }
}
