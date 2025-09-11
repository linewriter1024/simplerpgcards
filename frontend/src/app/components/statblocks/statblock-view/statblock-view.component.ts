import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { StatblockService } from '../../../services/statblock.service';
import { StatBlock, StatBlockFilter } from '../../../models/statblock.model';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DiceLinkifyPipe } from '../../../shared/dice/dice-linkify.pipe';
import { DiceClickDirective } from '../../../shared/dice/dice-click.directive';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-statblock-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatChipsModule,
  MatCheckboxModule,
  MatDialogModule,
  DiceLinkifyPipe,
  DiceClickDirective
  ],
  templateUrl: './statblock-view.component.html',
  styleUrl: './statblock-view.component.scss'
})
export class StatblockViewComponent implements OnInit {
  statblocks: StatBlock[] = [];
  filteredStatblocks: StatBlock[] = [];
  allTags: string[] = [];
  searchControl = new FormControl('');
  selection = new SelectionModel<StatBlock>(true, []);
  bulkTagInput: string = '';

  constructor(
    private statblockService: StatblockService,
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.loadStatblocks();
    
    // Load initial filters from URL query parameters
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchControl.setValue(params['search'], { emitEvent: false });
      }
      this.applyFilters();
      this.updatePageTitle();
    });
    
    // Real-time search with URL updates
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
      this.updatePageTitle();
      this.updateUrl();
    });
  }

  loadStatblocks(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statblockService.getStatblocks().subscribe({
        next: (statblocks) => {
          this.statblocks = statblocks;
          this.extractTags();
          this.applyFilters();
          resolve();
        },
        error: (error) => {
          console.error('Error loading statblocks:', error);
          reject(error);
        }
      });
    });
  }

  extractTags(): void {
    const tagSet = new Set<string>();
    this.statblocks.forEach(statblock => {
      if (statblock.tags) {
        statblock.tags.forEach(tag => tagSet.add(tag));
      }
    });
    this.allTags = Array.from(tagSet).sort();
  }

  applyFilters(): void {
    let filtered = [...this.statblocks];
    
    // Apply search filter with exact quoted terms support
    const rawSearch = this.searchControl.value?.trim() || '';
    const tokens = this.parseSearchTerms(rawSearch);

    if (tokens.length > 0) {
      filtered = filtered.filter(statblock => this.matchesAllTokens(statblock, tokens));
    }
    
    // Always sort by name in view mode
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    this.filteredStatblocks = filtered;
  }

  // Parse into tokens, preserving whether the term was quoted (exact)
  private parseSearchTerms(searchText: string): Array<{ value: string; exact: boolean }> {
    const tokens: Array<{ value: string; exact: boolean }> = [];
    if (!searchText) return tokens;

    let current = '';
    let inQuotes = false;
    let tokenWasQuoted = false;

    for (let i = 0; i < searchText.length; i++) {
      const ch = searchText[i];
      if (ch === '"') {
        // toggle quotes; mark token as quoted
        inQuotes = !inQuotes;
        tokenWasQuoted = true;
        continue;
      }
      if (ch === ' ' && !inQuotes) {
        const v = current.trim();
        if (v) tokens.push({ value: v, exact: tokenWasQuoted });
        current = '';
        tokenWasQuoted = false;
      } else {
        current += ch;
      }
    }
    const v = current.trim();
    if (v) tokens.push({ value: v, exact: tokenWasQuoted });

    return tokens;
  }

  private tokensToSearchText(tokens: Array<{ value: string; exact: boolean }>): string {
    return tokens.map(t => t.exact ? `"${t.value}"` : t.value).join(' ');
  }

  private escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private matchesAllTokens(statblock: StatBlock, tokens: Array<{ value: string; exact: boolean }>): boolean {
    const name = (statblock.name || '').toLowerCase();
    const tags = (statblock.tags || []).map(t => t.toLowerCase());

    return tokens.every(tok => {
      const q = tok.value.toLowerCase();
      if (tok.exact) {
        // exact: whole word in name, or exact tag match
        const wordRe = new RegExp(`\\b${this.escapeRegExp(q)}\\b`, 'i');
        const inName = wordRe.test(name);
        const inTags = tags.some(t => t === q);
        return inName || inTags;
      } else {
        // fuzzy includes in name or tags
        const inName = name.includes(q);
        const inTags = tags.some(t => t.includes(q));
        return inName || inTags;
      }
    });
  }

  isTagHighlighted(tag: string): boolean {
    const raw = this.searchControl.value?.trim() || '';
    const tokens = this.parseSearchTerms(raw);
    return tokens.some(t => t.value.toLowerCase() === tag.toLowerCase());
  }

  toggleTagFilter(tag: string): void {
    const currentSearch = this.searchControl.value || '';
    const tokens = this.parseSearchTerms(currentSearch);
    const tagLower = tag.toLowerCase();

    const idx = tokens.findIndex(t => t.value.toLowerCase() === tagLower);
    if (idx >= 0) {
      tokens.splice(idx, 1);
    } else {
      // Add as exact term in quotes
      tokens.push({ value: tag, exact: true });
    }

    const newText = this.tokensToSearchText(tokens);
    this.searchControl.setValue(newText);
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.applyFilters();
    this.updatePageTitle();
    this.updateUrl();
  }

  private updateUrl(): void {
    const queryParams: any = {};
    
    const searchValue = this.searchControl.value?.trim();
    if (searchValue) {
      queryParams.search = searchValue;
    }
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  private updatePageTitle(): void {
    let title = 'View Statblocks';
    const searchValue = this.searchControl.value?.trim();
    const activeFilters: string[] = [];
    
    if (searchValue) {
      // Don't double-quote if already quoted
      const quotedValue = searchValue.startsWith('"') && searchValue.endsWith('"') 
        ? searchValue 
        : `"${searchValue}"`;
      activeFilters.push(quotedValue);
    }
    
    if (activeFilters.length > 0) {
      title += ` - ${activeFilters.join(', ')}`;
    }
    
    this.titleService.setTitle(title);
  }

  getModifier(abilityScore: number): string {
    const modifier = Math.floor((abilityScore - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  formatSpellSlots(spellSlots: number[]): string {
    if (!spellSlots || spellSlots.length === 0) return '';
    
    const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
    return spellSlots
      .map((slots, index) => `${ordinals[index] || `${index + 1}th`}: ${slots}`)
      .join(', ');
  }

  getFirstHalfSpells(spells: { name: string }[]): { name: string }[] {
    if (!spells || spells.length === 0) return [];
    const halfIndex = Math.ceil(spells.length / 2);
    return spells.slice(0, halfIndex);
  }

  getSecondHalfSpells(spells: { name: string }[]): { name: string }[] {
    if (!spells || spells.length === 0) return [];
    const halfIndex = Math.ceil(spells.length / 2);
    return spells.slice(halfIndex);
  }

  isAllSelected(): boolean {
    const numSelectedInFiltered = this.selection.selected.filter(statblock => 
      this.filteredStatblocks.includes(statblock)
    ).length;
    const numFilteredRows = this.filteredStatblocks.length;
    return numFilteredRows > 0 && numSelectedInFiltered === numFilteredRows;
  }

  isIndeterminate(): boolean {
    const numSelectedInFiltered = this.selection.selected.filter(statblock => 
      this.filteredStatblocks.includes(statblock)
    ).length;
    const numFilteredRows = this.filteredStatblocks.length;
    return numSelectedInFiltered > 0 && numSelectedInFiltered < numFilteredRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.filteredStatblocks.forEach(statblock => this.selection.deselect(statblock));
    } else {
      this.selection.select(...this.filteredStatblocks);
    }
  }

  toggleRowSelection(row: StatBlock): void {
    this.selection.toggle(row);
  }

  editStatblock(statblock: StatBlock): void {
    this.router.navigate(['/statblocks/edit'], { 
      queryParams: { jumpTo: statblock.id }
    });
  }

  switchToEditMode(): void {
    this.router.navigate(['/statblocks/edit']);
  }

  addTagToSelected(): void {
    const tagToAdd = this.bulkTagInput.trim();
    if (!tagToAdd || this.selection.selected.length === 0) return;

    // Prevent tags with spaces
    if (tagToAdd.includes(' ')) {
      alert('Tags cannot contain spaces. Please use underscores or hyphens instead.');
      return;
    }

    const selectedStatblocks = this.selection.selected;
    const updates: Promise<any>[] = [];

    selectedStatblocks.forEach(statblock => {
      if (!statblock.tags) {
        statblock.tags = [];
      }
      
      // Add tag if it doesn't already exist
      if (!statblock.tags.includes(tagToAdd)) {
        const updatedTags = [...statblock.tags, tagToAdd];
        // Remove duplicates just in case
        const uniqueTags = Array.from(new Set(updatedTags));
        const updateData = {
          name: statblock.name,
          type: statblock.type,
          cr: statblock.cr,
          ac: statblock.ac,
          str: statblock.str,
          dex: statblock.dex,
          con: statblock.con,
          int: statblock.int,
          wis: statblock.wis,
          cha: statblock.cha,
          attacks: statblock.attacks || [],
          spells: statblock.spells || [],
          spellSlots: statblock.spellSlots || [],
          skills: statblock.skills || [],
          resistances: statblock.resistances || [],
          tags: uniqueTags
        };

        updates.push(this.statblockService.updateStatblock(statblock.id!, updateData).toPromise());
      }
    });

    if (updates.length > 0) {
      // Preserve selected IDs to restore selection after reload
      const selectedIds = this.selection.selected.map(s => s.id);
      
      Promise.all(updates).then(() => {
        this.bulkTagInput = '';
        this.loadStatblocks().then(() => {
          // Restore selection based on IDs
          this.restoreSelection(selectedIds);
        });
      }).catch(error => {
        console.error('Error adding tags:', error);
      });
    } else {
      this.bulkTagInput = '';
    }
  }

  removeTagFromSelected(): void {
    const tagToRemove = this.bulkTagInput.trim();
    if (!tagToRemove || this.selection.selected.length === 0) return;

    // Prevent tags with spaces
    if (tagToRemove.includes(' ')) {
      alert('Tags cannot contain spaces. Please use underscores or hyphens instead.');
      return;
    }

    const selectedStatblocks = this.selection.selected;
    const updates: Promise<any>[] = [];

    selectedStatblocks.forEach(statblock => {
      if (statblock.tags && statblock.tags.includes(tagToRemove)) {
        const updatedTags = statblock.tags.filter(tag => tag !== tagToRemove);
        const updateData = {
          name: statblock.name,
          type: statblock.type,
          cr: statblock.cr,
          ac: statblock.ac,
          str: statblock.str,
          dex: statblock.dex,
          con: statblock.con,
          int: statblock.int,
          wis: statblock.wis,
          cha: statblock.cha,
          attacks: statblock.attacks || [],
          spells: statblock.spells || [],
          spellSlots: statblock.spellSlots || [],
          skills: statblock.skills || [],
          resistances: statblock.resistances || [],
          tags: updatedTags
        };

        updates.push(this.statblockService.updateStatblock(statblock.id!, updateData).toPromise());
      }
    });

    if (updates.length > 0) {
      // Preserve selected IDs to restore selection after reload
      const selectedIds = this.selection.selected.map(s => s.id);
      
      Promise.all(updates).then(() => {
        this.bulkTagInput = '';
        this.loadStatblocks().then(() => {
          // Restore selection based on IDs
          this.restoreSelection(selectedIds);
        });
      }).catch(error => {
        console.error('Error removing tags:', error);
      });
    } else {
      this.bulkTagInput = '';
    }
  }

  restoreSelection(selectedIds: (string | undefined)[]): void {
    // Clear current selection first
    this.selection.clear();
    
    // Restore selection for items that still exist
    this.statblocks.forEach(statblock => {
      if (selectedIds.includes(statblock.id)) {
        this.selection.select(statblock);
      }
    });
  }

  calculateExperience(cr: string): number {
    // D&D 5e Experience Point values by Challenge Rating
    const expTable: { [key: string]: number } = {
      '0': 10,
      '1/8': 25,
      '1/4': 50,
      '1/2': 100,
      '1': 200,
      '2': 450,
      '3': 700,
      '4': 1100,
      '5': 1800,
      '6': 2300,
      '7': 2900,
      '8': 3900,
      '9': 5000,
      '10': 5900,
      '11': 7200,
      '12': 8400,
      '13': 10000,
      '14': 11500,
      '15': 13000,
      '16': 15000,
      '17': 18000,
      '18': 20000,
      '19': 22000,
      '20': 25000,
      '21': 33000,
      '22': 41000,
      '23': 50000,
      '24': 62000,
      '25': 75000,
      '26': 90000,
      '27': 105000,
      '28': 120000,
      '29': 135000,
      '30': 155000
    };

    return expTable[cr] || 0;
  }

  getSpellLevel(spellLine: string): string | null {
    if (!spellLine) return null;
    const m = spellLine.match(/^\s*(\d+)\./);
    return m ? `${m[1]}.` : null;
  }

  getSpellText(spellLine: string): string {
    if (!spellLine) return '';
    return spellLine.replace(/^\s*\d+\.?\s*/, '');
  }

  isFirstSpell(index: number): boolean {
    return index === 0;
  }

  formatHp(hp: string | number | undefined): string {
    if (hp === undefined || hp === null) return '';
    const hpStr = String(hp).trim();

    // If already formatted like "avg (dice)" or contains parentheses, keep as is
    if (/\(.*\)/.test(hpStr)) return hpStr;

    // If pure number, return as-is
    if (/^\d+(\.\d+)?$/.test(hpStr)) return hpStr;

    // Try to parse dice notation like "3d10 + 6" or "6d6+8"
    const diceMatch = hpStr.match(/(\d*)\s*[dD]\s*(\d+)/);
    if (!diceMatch) return hpStr;

    const n = diceMatch[1] ? parseInt(diceMatch[1], 10) : 1;
    const m = parseInt(diceMatch[2], 10);

    // Sum all +X and -X modifiers in the string
    let modifier = 0;
    const modRegex = /([+-])\s*(\d+)/g;
    let modMatch: RegExpExecArray | null;
    while ((modMatch = modRegex.exec(hpStr)) !== null) {
      const sign = modMatch[1] === '-' ? -1 : 1;
      modifier += sign * parseInt(modMatch[2], 10);
    }

    if (!isFinite(n) || !isFinite(m) || m <= 0) return hpStr;

    const avgPerDie = (m + 1) / 2; // expected value of 1..m
    const avg = Math.floor(n * avgPerDie + modifier); // D&D averages round down

    const normalized = this.normalizeDiceNotation(hpStr);
    return `${avg} (${normalized})`;
  }

  private normalizeDiceNotation(input: string): string {
    // Collapse whitespace around +/-, and standardize 'd'
    let s = input.trim();
    s = s.replace(/\s*[dD]\s*/g, 'd');
    s = s.replace(/\s*([+\-])\s*/g, ' $1 ');
    s = s.replace(/\s+/g, ' ');
    return s;
  }
}
