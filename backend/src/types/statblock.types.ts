export interface AttackDto {
  name: string;
  toHitModifier: number;
  damage: string;
  additionalEffect?: string;
}

export interface SpellDto {
  name: string;
  description: string;
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
  attacks: AttackDto[];
  spells: SpellDto[];
  spellSlots: number[];
  skills: string[];
  resistances: string[];
  tags: string[];
}

export interface StatBlockFilter {
  search?: string;
  tags?: string[];
  crRange?: {
    min?: number;
    max?: number;
  };
}
