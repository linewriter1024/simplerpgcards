import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChildren, QueryList, HostListener } from '@angular/core';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { StatblockService } from '../../../services/statblock.service';
import { StatBlock, StatBlockFilter } from '../../../models/statblock.model';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DiceLinkifyPipe } from '../../../shared/dice/dice-linkify.pipe';
import { DiceClickDirective } from '../../../shared/dice/dice-click.directive';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

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
  MatMenuModule,
  MatDividerModule,
  MatSlideToggleModule,
  MatTooltipModule,
  DiceLinkifyPipe,
  DiceClickDirective
  ],
  templateUrl: './statblock-view.component.html',
  styleUrl: './statblock-view.component.scss'
})
export class StatblockViewComponent implements OnInit, AfterViewInit, OnDestroy {
  statblocks: StatBlock[] = [];
  filteredStatblocks: StatBlock[] = [];
  allTags: string[] = [];
  searchControl = new FormControl('');
  selection = new SelectionModel<StatBlock>(true, []);
  bulkTagInput: string = '';
  showActiveOnly: boolean = false; // Toggle for showing only active statblocks
  showContextOnly: boolean = false; // Toggle for showing only context statblocks
  contextTag: string = 'campaign'; // The tag used for context operations, persisted in localStorage
  // Image slicing state
  private imgDims: Record<string, { width: number; height: number }> = {};
  private imgLoadRequested = new Set<string>();
  private sliceOffsets: Record<string, number> = {};
  // User-controlled image scale bias per statblock id (1 = default)
  private userScale: Record<string, number> = {};
  // Keep rows compact; desired displayed slice height in CSS px
  readonly chunkHeight = 180;
  // Cap each tile's width to avoid horizontal overflow; tiles will wrap
  readonly maxTileWidth = 99999; // effectively no cap; real cap comes from container width
  // Layout controls
  readonly maxRows = 2; // keep overall row height compact
  readonly tileGap = 6; // must match SCSS gap
  @ViewChildren('slicesContainer') private slicesContainers!: QueryList<ElementRef<HTMLDivElement>>;
  private containerWidths: Record<string, number> = {};
  private layoutById: Record<string, { tileWidth: number; scale: number; chunkImgPx: number; columns: number }> = {};
  private measureScheduled = false;

  private getChunkHeightFor(id: string): number {
    const containerW = this.containerWidths[id] ?? 800;
  // Smaller, tighter rows: scale down further for better horizontal fill
  const dynamic = Math.round(Math.min(130, Math.max(80, containerW / 20)));
    return dynamic;
  }

  getSlicesContainerStyle(sb: StatBlock): { [k: string]: any } {
    const id = sb.id!;
    const h = this.getChunkHeightFor(id);
    const s = this.userScale[id] ?? 1;
    // Cap the container to two rows worth of height, but allow it to shrink
    return {
      'max-height.px': Math.round(h * this.maxRows * s)
    };
  }

  constructor(
  public statblockService: StatblockService,
    private router: Router,
    private route: ActivatedRoute,
  private titleService: Title,
  private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Load context tag from localStorage
    const savedContextTag = localStorage.getItem('statblockContextTag');
    if (savedContextTag) {
      this.contextTag = savedContextTag;
    }
    
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

  ngAfterViewInit(): void {
    // Measure after view renders
    this.scheduleMeasureCompute();
    // Recompute when containers change (list update)
    this.slicesContainers.changes.subscribe(() => this.scheduleMeasureCompute());
    // Fallback measure after initial paint
    setTimeout(() => this.scheduleMeasureCompute(), 0);
    setTimeout(() => this.scheduleMeasureCompute(), 100);
    setTimeout(() => this.scheduleMeasureCompute(), 500);
  }

  ngOnDestroy(): void {
    // nothing to clean beyond subscriptions owned by Angular
  }

  loadStatblocks(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statblockService.getStatblocks().subscribe({
        next: (statblocks) => {
          this.statblocks = statblocks;
          // Load image settings (offset/scale) for statblocks with images
          this.statblocks.filter(sb => sb.hasImage && sb.id).forEach(sb => {
            const id = sb.id!;
            this.statblockService.getImageSettings(id).subscribe({
              next: (s) => {
                if (typeof s.offset === 'number') this.sliceOffsets[id] = s.offset;
                if (typeof s.scale === 'number') this.userScale[id] = s.scale;
                this.scheduleMeasureCompute();
              },
              error: () => {/* ignore */}
            });
          });
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
    this.scheduleMeasureCompute();
    
    // Update toggle states based on current search
    this.updateToggleStatesFromSearch();
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
  this.bulkTagInput = '';
    this.showActiveOnly = false; // Reset active toggle when clearing all filters
    this.showContextOnly = false; // Reset context toggle when clearing all filters
    this.applyFilters();
    this.updatePageTitle();
    this.updateUrl();
  }

  // Active statblock helpers
  isStatblockActive(statblock: StatBlock): boolean {
    return statblock.tags?.includes('active') ?? false;
  }

  toggleActiveOnly(): void {
    const currentSearch = this.searchControl.value || '';
    const tokens = this.parseSearchTerms(currentSearch);
    
    const activeTokenIndex = tokens.findIndex(t => t.value.toLowerCase() === 'active' && t.exact);
    
    if (this.showActiveOnly) {
      // Add "active" as exact search term if not already present
      if (activeTokenIndex === -1) {
        tokens.push({ value: 'active', exact: true });
      }
    } else {
      // Remove "active" search term if present
      if (activeTokenIndex >= 0) {
        tokens.splice(activeTokenIndex, 1);
      }
    }
    
    const newText = this.tokensToSearchText(tokens);
    this.searchControl.setValue(newText);
    this.applyFilters();
  }

  toggleContextOnly(): void {
    const currentSearch = this.searchControl.value || '';
    const tokens = this.parseSearchTerms(currentSearch);
    
    const contextTokenIndex = tokens.findIndex(t => t.value.toLowerCase() === this.contextTag.toLowerCase() && t.exact);
    
    if (this.showContextOnly) {
      // Add context tag as exact search term if not already present
      if (contextTokenIndex === -1) {
        tokens.push({ value: this.contextTag, exact: true });
      }
    } else {
      // Remove context tag search term if present
      if (contextTokenIndex >= 0) {
        tokens.splice(contextTokenIndex, 1);
      }
    }
    
    const newText = this.tokensToSearchText(tokens);
    this.searchControl.setValue(newText);
    this.applyFilters();
  }

  addActiveToSelected(): void {
    if (this.selection.selected.length === 0) return;

    const selectedStatblocks = this.selection.selected;
    const updates: Promise<any>[] = [];

    selectedStatblocks.forEach(statblock => {
      if (!this.isStatblockActive(statblock)) {
        const updatedTags = [...(statblock.tags || []), 'active'];
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
          tags: updatedTags,
          notes: statblock.notes
        };

        updates.push(this.statblockService.updateStatblock(statblock.id!, updateData).toPromise());
      }
    });

    if (updates.length > 0) {
      const selectedIds = this.selection.selected.map(s => s.id);
      
      Promise.all(updates).then(() => {
        this.loadStatblocks().then(() => {
          this.restoreSelection(selectedIds);
        });
      }).catch(error => {
        console.error('Error adding active tag:', error);
      });
    }
  }

  removeActiveFromSelected(): void {
    if (this.selection.selected.length === 0) return;

    const selectedStatblocks = this.selection.selected;
    const updates: Promise<any>[] = [];

    selectedStatblocks.forEach(statblock => {
      if (this.isStatblockActive(statblock)) {
        const updatedTags = (statblock.tags || []).filter(tag => tag !== 'active');
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
          tags: updatedTags,
          notes: statblock.notes
        };

        updates.push(this.statblockService.updateStatblock(statblock.id!, updateData).toPromise());
      }
    });

    if (updates.length > 0) {
      const selectedIds = this.selection.selected.map(s => s.id);
      
      Promise.all(updates).then(() => {
        this.loadStatblocks().then(() => {
          this.restoreSelection(selectedIds);
        });
      }).catch(error => {
        console.error('Error removing active tag:', error);
      });
    }
  }

  // Update toggle states based on current search filter
  private updateToggleStatesFromSearch(): void {
    const currentSearch = this.searchControl.value || '';
    const tokens = this.parseSearchTerms(currentSearch);
    
    // Check if "active" tag is present in search (exact match)
    const hasActiveTag = tokens.some(t => t.value.toLowerCase() === 'active' && t.exact);
    this.showActiveOnly = hasActiveTag;
    
    // Check if current context tag is present in search (exact match)
    const hasContextTag = tokens.some(t => t.value.toLowerCase() === this.contextTag.toLowerCase() && t.exact);
    this.showContextOnly = hasContextTag;
  }

  // Context tag helpers
  isStatblockContext(statblock: StatBlock): boolean {
    return statblock.tags?.includes(this.contextTag) ?? false;
  }

  addContextToSelected(): void {
    if (this.selection.selected.length === 0 || !this.contextTag.trim()) return;

    const selectedStatblocks = this.selection.selected;
    const updates: Promise<any>[] = [];

    selectedStatblocks.forEach(statblock => {
      if (!this.isStatblockContext(statblock)) {
        const updatedTags = [...(statblock.tags || []), this.contextTag];
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
          tags: updatedTags,
          notes: statblock.notes
        };

        updates.push(this.statblockService.updateStatblock(statblock.id!, updateData).toPromise());
      }
    });

    if (updates.length > 0) {
      const selectedIds = this.selection.selected.map(s => s.id);
      
      Promise.all(updates).then(() => {
        this.loadStatblocks().then(() => {
          this.restoreSelection(selectedIds);
        });
      }).catch(error => {
        console.error('Error adding context tag:', error);
      });
    }
  }

  removeContextFromSelected(): void {
    if (this.selection.selected.length === 0 || !this.contextTag.trim()) return;

    const selectedStatblocks = this.selection.selected;
    const updates: Promise<any>[] = [];

    selectedStatblocks.forEach(statblock => {
      if (this.isStatblockContext(statblock)) {
        const updatedTags = (statblock.tags || []).filter(tag => tag !== this.contextTag);
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
          tags: updatedTags,
          notes: statblock.notes
        };

        updates.push(this.statblockService.updateStatblock(statblock.id!, updateData).toPromise());
      }
    });

    if (updates.length > 0) {
      const selectedIds = this.selection.selected.map(s => s.id);
      
      Promise.all(updates).then(() => {
        this.loadStatblocks().then(() => {
          this.restoreSelection(selectedIds);
        });
      }).catch(error => {
        console.error('Error removing context tag:', error);
      });
    }
  }

  getActiveStatblocksCount(): number {
    return this.statblocks.filter(sb => this.isStatblockActive(sb)).length;
  }

  getContextStatblocksCount(): number {
    return this.statblocks.filter(sb => this.isStatblockContext(sb)).length;
  }

  // Change the context tag and persist to localStorage
  setContextTag(newTag: string): void {
    if (!newTag || newTag.trim() === '') return;
    
    const trimmedTag = newTag.trim();
    // Prevent tags with spaces
    if (trimmedTag.includes(' ')) {
      alert('Context tag cannot contain spaces. Please use underscores or hyphens instead.');
      return;
    }
    
    // Update showContextOnly based on whether the current search includes the old context tag
    const currentSearch = this.searchControl.value || '';
    const tokens = this.parseSearchTerms(currentSearch);
    const hasOldContextTag = tokens.some(t => t.value.toLowerCase() === this.contextTag.toLowerCase() && t.exact);
    
    this.contextTag = trimmedTag;
    localStorage.setItem('statblockContextTag', trimmedTag);
    
    // Update the search to use the new context tag if it was previously included
    if (hasOldContextTag && this.showContextOnly) {
      const newTokens = tokens.map(t => 
        t.value.toLowerCase() === this.contextTag.toLowerCase() && t.exact 
          ? { value: trimmedTag, exact: true } 
          : t
      );
      const newText = this.tokensToSearchText(newTokens);
      this.searchControl.setValue(newText);
      this.applyFilters();
    } else {
      // Update toggle states even if search didn't change
      this.updateToggleStatesFromSearch();
    }
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

  openImage(statblock: StatBlock): void {
    if (!statblock.id) return;
    const url = this.statblockService.getImageUrl(statblock.id);
    this.dialog.open(ImageDialogComponent, {
      data: { url, name: statblock.name },
      panelClass: 'image-dialog-panel',
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh'
    });
  }

  // Consider a statblock "empty" if all text arrays are empty and core text fields (except name) are blank
  // This allows image-only statblocks to have names while still being treated as image-only
  isStatblockEmpty(sb: StatBlock): boolean {
    const textEmpty = !((sb.type && sb.type.trim()) || (sb.cr && sb.cr.trim()) || (sb.hp && String(sb.hp).trim()) || (sb.ac && String(sb.ac).trim()) || (sb.notes && sb.notes.trim()));
    const arraysEmpty = (!sb.attacks || sb.attacks.length === 0)
      && (!sb.spells || sb.spells.length === 0)
      && (!sb.spellSlots || sb.spellSlots.length === 0)
      && (!sb.skills || sb.skills.length === 0)
      && (!sb.resistances || sb.resistances.length === 0)
      && (!sb.tags || sb.tags.length === 0);
    return textEmpty && arraysEmpty;
  }

  // --- Image slicing helpers ---
  private ensureImageDims(sb: StatBlock): void {
    if (!sb.id) return;
    if (this.imgDims[sb.id] || this.imgLoadRequested.has(sb.id)) return;
    this.imgLoadRequested.add(sb.id);
    const img = new Image();
    img.onload = () => {
      this.imgDims[sb.id!] = { width: img.naturalWidth, height: img.naturalHeight };
      
      // Recompute layouts once we know dimensions
      this.scheduleMeasureCompute();
    };
    img.onerror = () => {
      console.error(`Failed to load image for statblock ${sb.id}`);
      this.imgLoadRequested.delete(sb.id!);
    };
    img.src = this.statblockService.getImageUrl(sb.id);
  }

  getSlicesArray(sb: StatBlock): number[] {
    if (!sb.id || !sb.hasImage) return [];
    this.ensureImageDims(sb);
    const dims = this.imgDims[sb.id];
    const layout = this.layoutById[sb.id];
    if (!dims || !layout) {
      // Force a measurement attempt if we don't have layout yet
      if (dims && !layout) {
        this.scheduleMeasureCompute();
      }
      return [];
    }
    const chunkImgPx = layout.chunkImgPx;
    const offset = this.sliceOffsets[sb.id] ?? 0;
    const remaining = Math.max(0, dims.height - offset);
    const count = Math.ceil(remaining / chunkImgPx);
    
    return Array.from({ length: count }, (_, i) => i);
  }

  getSliceStyle(sb: StatBlock, index: number): { [k: string]: any } {
    const id = sb.id!;
    const dims = this.imgDims[id];
    const url = this.statblockService.getImageUrl(id);
    const layout = this.layoutById[id];
  if (!dims || !layout) return { 'display': 'none' };
    const { tileWidth, scale, chunkImgPx } = layout;
    const s = this.userScale[id] ?? 1;
    const offset = this.sliceOffsets[id] ?? 0;
    const topImgPx = offset + index * chunkImgPx;
    const effectiveScale = scale * s;
    const effectiveTileW = Math.round(tileWidth * s);
    const heightCss = Math.max(0, Math.min(Math.round(this.getChunkHeightFor(id) * s), Math.floor(effectiveScale * ((dims?.height || 0) - topImgPx))));
    return {
      'background-image': `url(${url})`,
      'background-size': `${effectiveTileW}px auto`,
      'background-position': `0px -${Math.round(effectiveScale * topImgPx)}px`,
      'background-repeat': 'no-repeat',
      'width.px': effectiveTileW,
      'height.px': heightCss,
      'border': '1px solid rgba(255,255,255,0.12)',
      'border-radius': '4px'
    };
  }

  adjustSliceOffset(sb: StatBlock, delta: number): void {
    if (!sb.id) return;
    const dims = this.imgDims[sb.id];
    if (!dims) { this.ensureImageDims(sb); return; }
    const layout = this.layoutById[sb.id];
    if (!layout) { this.scheduleMeasureCompute(); return; }
    const chunkImgPx = layout.chunkImgPx;
    const current = this.sliceOffsets[sb.id] ?? 0;
    let next = current + delta;
    // Keep offset within a single chunk height in image pixels
    if (next < 0) next = chunkImgPx - (Math.abs(next) % chunkImgPx);
    next = next % chunkImgPx;
  this.sliceOffsets[sb.id] = next;
    // Recompute layout since offset affects slice count/columns
    this.computeLayoutForId(sb.id);
  // Persist offset
  this.statblockService.updateImageSettings(sb.id, { offset: next }).subscribe({ next: () => {}, error: () => {} });
  }

  // Increase or decrease the visual scale of the image slices for a given statblock.
  // This biases the layout to use fewer or more columns to make tiles larger/smaller
  // while still respecting container width and row constraints.
  adjustImageScale(sb: StatBlock, dir: 'up' | 'down'): void {
    if (!sb.id) return;
    const id = sb.id;
    const current = this.userScale[id] ?? 1;
    const factor = dir === 'up' ? 1.1 : 1 / 1.1;
    // Clamp between 0.6x and 2.0x to keep things reasonable
    const next = Math.max(0.6, Math.min(2.0, current * factor));
  this.userScale[id] = next;
  this.computeLayoutForId(id);
  // Persist scale
  this.statblockService.updateImageSettings(id, { scale: next }).subscribe({ next: () => {}, error: () => {} });
  }

  // Reset image settings to defaults and persist
  resetImageSettings(sb: StatBlock): void {
    if (!sb.id) return;
    const id = sb.id;
    delete this.userScale[id];
    this.sliceOffsets[id] = 0;
    this.computeLayoutForId(id);
    this.scheduleMeasureCompute();
    this.statblockService.updateImageSettings(id, { offset: 0, scale: 1 }).subscribe({ next: (s) => {
      // Ensure in-sync with backend response if any rounding occurred
      this.sliceOffsets[id] = s.offset ?? 0;
      this.userScale[id] = s.scale ?? 1;
      this.scheduleMeasureCompute();
    }, error: () => {} });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleMeasureCompute();
  }

  private scheduleMeasureCompute(): void {
    if (this.measureScheduled) return;
    this.measureScheduled = true;
    requestAnimationFrame(() => {
      this.measureScheduled = false;
      this.measureContainers();
      // Only compute layout for statblocks that have images
      this.filteredStatblocks
        .filter(sb => sb.hasImage && sb.id)
        .forEach(sb => this.computeLayoutForId(sb.id!));
    });
  }

  private measureContainers(): void {
    if (!this.slicesContainers) return;
    this.slicesContainers.forEach(ref => {
      const el = ref.nativeElement;
      const id = el.dataset['id'];
      if (id) {
        this.containerWidths[id] = el.clientWidth;
        
      }
    });
  }

  private computeLayoutForId(id: string | undefined): void {
    if (!id) return;
    const dims = this.imgDims[id];
    const containerW = this.containerWidths[id];
    if (!dims || !containerW) {
      
      return;
    }
    
    // Prevent degenerate widths
    if (containerW < 80) {
      const scale = Math.max(0.1, (containerW - 8) / dims.width);
      const ch = this.getChunkHeightFor(id);
      this.layoutById[id] = {
        tileWidth: Math.max(40, containerW - 8),
        scale,
        chunkImgPx: Math.ceil(ch / scale),
        columns: 1
      };
      
      return;
    }
    const offset = this.sliceOffsets[id] ?? 0;
    const gap = this.tileGap;
    const borderX = 2; // 1px left + 1px right
    // Allow smaller tiles so we can achieve more columns and flow horizontally
  const minTileWidth = 130;
    // But also set a reasonable maximum number of columns to avoid tiny tiles
  const maxColsAbsolute = 16;
    const maxColsByWidth = Math.max(1, Math.min(maxColsAbsolute, Math.floor((containerW + gap) / (minTileWidth + gap + borderX))));

  const tryCols = (cols: number) => {
      const availableW = Math.max(0, containerW - (cols - 1) * gap - cols * borderX);
      let tw = Math.floor(Math.min(dims.width, availableW / cols));
      if (this.maxTileWidth !== 99999) tw = Math.min(tw, this.maxTileWidth);
      const scale = Math.max(0.05, tw / dims.width);
      // Limit chunk size to reasonable portions of the image height to ensure multiple slices when tall
      const ch = this.getChunkHeightFor(id);
      const maxReasonableChunk = Math.floor(dims.height / 2); // At least 2 chunks for tall images
      const chunkImgPx = Math.max(1, Math.min(maxReasonableChunk, Math.ceil(ch / scale)));
      const remaining = Math.max(0, dims.height - offset);
      const S = Math.ceil(remaining / chunkImgPx);
      const effCols = Math.max(1, Math.min(cols, S)); // never exceed number of slices
      const rows = Math.max(1, Math.ceil(S / effCols));
      return { tw, scale, chunkImgPx, rows, S, effCols };
    };

  // Prefer using available width to reduce empty space: pick the largest number of
  // effective columns that still respects max rows and min tile width.
    let best: { tw: number; scale: number; chunkImgPx: number; rows: number; S: number; effCols: number } | null = null;
  let bestCols = 1;
  for (let cols = maxColsByWidth; cols >= 1; cols--) {
      const res = tryCols(cols);
      if (res.tw >= minTileWidth && res.rows <= this.maxRows) {
    if (!best || res.effCols > best.effCols || (res.effCols === best.effCols && res.tw > best.tw)) {
          best = res;
          bestCols = res.effCols; // cap to slice count
        }
      }
    }

    // If nothing satisfies constraints, fall back to the widest feasible option
    if (!best) {
      best = tryCols(Math.max(1, Math.min(maxColsByWidth, 1)));
      bestCols = best.effCols;
    }

    // Start with the chosen effective columns
    let final = tryCols(bestCols);

    // Apply user scale bias by estimating a column count that achieves the desired tile width
    const scaleBias = this.userScale[id] ?? 1;
    if (scaleBias !== 1) {
      const desiredTw = Math.max(minTileWidth, Math.min(dims.width, Math.round(final.tw * scaleBias)));
      const approxCols = Math.max(
        1,
        Math.min(
          maxColsByWidth,
          Math.floor((containerW + gap) / (desiredTw + gap + borderX))
        )
      );
      const biased = tryCols(approxCols);
      // Accept if it respects row constraint and doesn't shrink below min tile width
      if (biased.rows <= this.maxRows && biased.tw >= minTileWidth) {
        final = biased;
      }
    }

  this.layoutById[id] = {
      tileWidth: final.tw,
      scale: final.scale,
      chunkImgPx: final.chunkImgPx,
      columns: final.effCols
    };
    
  }
}

import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-image-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="image-dialog" (click)="close()">
      <div class="title">{{data.name}}</div>
      <img [src]="data.url" alt="{{data.name}}" />
    </div>
  `,
  styles: [
    `.image-dialog{ width: 100vw; height: 100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 8px; cursor: zoom-out; padding: 0; }
     .image-dialog .title{ position: fixed; top: 8px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px; font-size: 14px; }
     .image-dialog img{ max-width: 100vw; max-height: 100vh; width: auto; height: auto; object-fit: contain; image-rendering: auto; }`
  ]
})
export class ImageDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ImageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { url: string; name: string }
  ) {}

  close(): void { this.dialogRef.close(); }
}
