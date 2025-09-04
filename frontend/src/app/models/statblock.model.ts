export interface StatBlock {
  id?: string;
  name: string;
  cr: string;
  ac: number;
  spellSaveDC?: number;
  spellAttackModifier?: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  attacks: Attack[];
  spells: Spell[];
  spellSlots: number[];
  skills: string[];
  resistances: string[];
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Attack {
  id?: string;
  name: string;
  toHitModifier: number;
  damage: string; // e.g., "2d6 + 4"
  additionalEffect?: string; // e.g., "on hit 12 DC Con save or 1d4 poison damage"
}

export interface Spell {
  id?: string;
  name: string;
  description: string; // e.g., "3 1d4 + 4 arrows" or "3d6 fire damage, DC 12 dex save to halve"
}

export interface CreateStatBlockDto {
  name: string;
  cr: string;
  ac: number;
  spellSaveDC?: number;
  spellAttackModifier?: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  attacks: Omit<Attack, 'id'>[];
  spells: Omit<Spell, 'id'>[];
  spellSlots: number[];
  skills: string[];
  resistances: string[];
  tags: string[];
}

export interface StatBlockFilter {
  tags?: string[];
  search?: string;
  crRange?: {
    min?: number;
    max?: number;
  };
}
