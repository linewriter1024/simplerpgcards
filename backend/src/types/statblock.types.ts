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
  type?: string;
  cr: string;
  hp?: string;
  ac: string;
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
  notes?: string; // new optional field
}

export interface StatBlockFilter {
  search?: string;
  tags?: string[];
  crRange?: {
    min?: number;
    max?: number;
  };
}
