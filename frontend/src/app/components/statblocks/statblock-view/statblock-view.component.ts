import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
    MatCheckboxModule
  ],
  template: `
    <div class="view-container">
      <mat-card class="filter-card">
        <mat-card-header>
          <mat-card-title>Filters & Search</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="filter-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search</mat-label>
              <input matInput [formControl]="searchControl" placeholder="Search names and tags... Use quotes for exact matches">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <button mat-button (click)="clearFilters()">Clear Filters</button>
          </div>

          @if (allTags.length > 0) {
            <div class="tags-section">
              <h4>Search Tags:</h4>
              <div class="tags-grid">
                <mat-chip-listbox>
                  @for (tag of allTags; track tag) {
                    <mat-chip-option
                      [selected]="isTagHighlighted(tag)"
                      (click)="toggleTagFilter(tag)"
                      [class.highlighted-tag]="isTagHighlighted(tag)">
                      {{ tag }}
                    </mat-chip-option>
                  }
                </mat-chip-listbox>
              </div>
            </div>
          }

          <div class="action-row">
            <div class="selection-controls">
              <mat-checkbox (change)="$event ? toggleAllRows() : null"
                           [checked]="isAllSelected()"
                           [indeterminate]="isIndeterminate()">
                Select All
              </mat-checkbox>
            </div>

            <div class="bulk-actions">
              <button mat-raised-button color="warn" (click)="deleteSelected()" [disabled]="selection.selected.length === 0">
                <mat-icon>delete</mat-icon>
                Delete Selected ({{selection.selected.length}})
              </button>

              @if (selection.selected.length > 0) {
                <div class="tag-actions">
                  <mat-form-field appearance="outline" class="tag-input">
                    <mat-label>Bulk Tag Action</mat-label>
                    <input matInput [(ngModel)]="bulkTagInput" placeholder="Enter single tag (no spaces)">
                  </mat-form-field>
                  <button mat-raised-button color="primary" (click)="addTagToSelected()" [disabled]="!bulkTagInput.trim()">
                    <mat-icon>add</mat-icon>
                    Add Tag
                  </button>
                  <button mat-raised-button color="accent" (click)="removeTagFromSelected()" [disabled]="!bulkTagInput.trim()">
                    <mat-icon>remove</mat-icon>
                    Remove Tag
                  </button>
                </div>
              }
            </div>

            <span class="statblock-count">{{ filteredStatblocks.length }} statblocks</span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="statblocks-display">
        <div class="statblocks-table">
          @for (statblock of filteredStatblocks; track statblock.id) {
            <div class="statblock-row" 
                 [class.selected]="selection.isSelected(statblock)"
                 (click)="toggleRowSelection(statblock)">
              
              <!-- Row Actions -->
              <div class="row-actions">
                <mat-checkbox (change)="$event ? selection.toggle(statblock) : null"
                             [checked]="selection.isSelected(statblock)"
                             (click)="$event.stopPropagation()">
                </mat-checkbox>
                <button mat-icon-button color="primary" (click)="editStatblock(statblock); $event.stopPropagation()">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteStatblock(statblock); $event.stopPropagation()">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>

              <!-- All Fields in Flex Layout -->
              <div class="row-content">
                <!-- Basic Info Row -->
                <div class="basic-info-section">
                  <div class="field name-field">
                    <div class="field-label">Name</div>
                    <div class="field-value">{{statblock.name}}</div>
                  </div>

                  @if (statblock.type) {
                    <div class="field type-field">
                      <div class="field-label">Type</div>
                      <div class="field-value">{{statblock.type}}</div>
                    </div>
                  }

                  <div class="field compact-field">
                    <div class="field-label">CR</div>
                    <div class="field-value">{{statblock.cr}}</div>
                  </div>

                  <div class="field compact-field">
                    <div class="field-label">AC</div>
                    <div class="field-value">{{statblock.ac}}</div>
                  </div>

                  <div class="abilities-group">
                    <div class="field ability-field">
                      <div class="field-label">STR</div>
                      <div class="field-value">{{statblock.str}} ({{getModifier(statblock.str)}})</div>
                    </div>
                    <div class="field ability-field">
                      <div class="field-label">DEX</div>
                      <div class="field-value">{{statblock.dex}} ({{getModifier(statblock.dex)}})</div>
                    </div>
                    <div class="field ability-field">
                      <div class="field-label">CON</div>
                      <div class="field-value">{{statblock.con}} ({{getModifier(statblock.con)}})</div>
                    </div>
                    <div class="field ability-field">
                      <div class="field-label">INT</div>
                      <div class="field-value">{{statblock.int}} ({{getModifier(statblock.int)}})</div>
                    </div>
                    <div class="field ability-field">
                      <div class="field-label">WIS</div>
                      <div class="field-value">{{statblock.wis}} ({{getModifier(statblock.wis)}})</div>
                    </div>
                    <div class="field ability-field">
                      <div class="field-label">CHA</div>
                      <div class="field-value">{{statblock.cha}} ({{getModifier(statblock.cha)}})</div>
                    </div>
                  </div>
                </div>

                <!-- Text Fields Row -->
                <div class="text-fields-section">
                  <div class="field attacks-field">
                    <div class="field-label">Attacks</div>
                    <div class="field-value">
                      @if (statblock.attacks && statblock.attacks.length > 0) {
                        @for (attack of statblock.attacks; track attack.name) {
                          <div class="list-item">{{attack.name}}</div>
                        }
                      }
                    </div>
                  </div>

                  <div class="field spells-field">
                    <div class="field-label">Spells</div>
                    <div class="field-value">
                      @if (statblock.spells && statblock.spells.length > 0) {
                        @for (spell of statblock.spells; track spell.name) {
                          <div class="list-item">{{spell.name}}</div>
                        }
                      }
                    </div>
                  </div>

                  <div class="field spell-slots-field">
                    <div class="field-label">Spell Slots</div>
                    <div class="field-value spell-slots">
                      @if (statblock.spellSlots && statblock.spellSlots.length > 0) {
                        {{formatSpellSlots(statblock.spellSlots)}}
                      }
                    </div>
                  </div>

                  <div class="field text-field">
                    <div class="field-label">Skills</div>
                    <div class="field-value">
                      @if (statblock.skills && statblock.skills.length > 0) {
                        @for (skill of statblock.skills; track skill) {
                          <div class="list-item">{{skill}}</div>
                        }
                      }
                    </div>
                  </div>

                  <div class="field text-field">
                    <div class="field-label">Resistances</div>
                    <div class="field-value">
                      @if (statblock.resistances && statblock.resistances.length > 0) {
                        @for (resistance of statblock.resistances; track resistance) {
                          <div class="list-item">{{resistance}}</div>
                        }
                      }
                    </div>
                  </div>

                  <div class="field tags-field">
                    <div class="field-label">Tags</div>
                    <div class="field-value">
                      @if (statblock.tags && statblock.tags.length > 0) {
                        @for (tag of statblock.tags; track tag) {
                          <span class="tag-chip">{{tag}}</span>
                        }
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .view-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .filter-card {
      margin-bottom: 24px;
    }

    .filter-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      align-items: center;
    }

    .search-field {
      flex: 1;
      max-width: 400px;
    }

    .tags-section {
      margin: 16px 0;
    }

    .tags-section h4 {
      margin-bottom: 8px;
      color: #e0e0e0;
    }

    .highlighted-tag {
      background-color: #4CAF50 !important;
      color: white !important;
    }

    .action-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 16px;
      gap: 16px;
    }

    .selection-controls {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .bulk-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }

    .tag-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .tag-input {
      min-width: 200px;
      flex: 1;
      max-width: 300px;
    }

    .statblock-count {
      color: #aaa;
      font-size: 14px;
    }

    .statblocks-display {
      overflow-x: auto;
    }

    .statblocks-table {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
    }

    .statblock-row {
      display: flex;
      background-color: #2d2d2d;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 12px;
      gap: 12px;
      align-items: stretch;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .statblock-row:hover {
      background-color: rgba(255, 255, 255, 0.04);
      border-color: #666;
    }

    .statblock-row.selected {
      background-color: rgba(63, 81, 181, 0.2);
      border-color: rgba(63, 81, 181, 0.5);
    }

    .row-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 60px;
      justify-content: flex-start;
    }

    .row-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .basic-info-section {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .abilities-group {
      display: flex;
      gap: 8px;
    }

    .text-fields-section {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .field {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .field-label {
      font-size: 11px;
      color: #ccc;
      font-weight: 500;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .field-value {
      color: #e0e0e0;
      font-size: 14px;
      min-height: 18px;
    }

    .name-field {
      min-width: 150px;
      flex: 2;
    }

    .type-field {
      min-width: 100px;
      flex: 1;
    }

    .compact-field {
      min-width: 60px;
      flex: 0 0 auto;
    }

    .ability-field {
      min-width: 60px;
      flex: 0 0 auto;
    }

    .attacks-field,
    .spells-field {
      min-width: 180px;
      flex: 2;
    }

    .spell-slots-field {
      min-width: 120px;
      flex: 1;
    }

    .text-field {
      min-width: 100px;
      flex: 1;
    }

    .tags-field {
      min-width: 120px;
      flex: 1;
    }

    .list-item {
      font-size: 13px;
      line-height: 1.3;
      margin-bottom: 2px;
    }

    .list-item:last-child {
      margin-bottom: 0;
    }

    .spell-slots {
      font-family: monospace;
      color: #4CAF50;
      font-size: 12px;
    }

    .tag-chip {
      background-color: #3f51b5;
      color: white;
      padding: 1px 4px;
      border-radius: 8px;
      font-size: 9px;
      margin-right: 2px;
      margin-bottom: 2px;
      display: inline-block;
      white-space: nowrap;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .basic-info-section {
        flex-direction: column;
        gap: 8px;
      }

      .abilities-group {
        flex-wrap: wrap;
        justify-content: space-between;
      }

      .text-fields-section {
        flex-direction: column;
        gap: 8px;
      }

      .attacks-field,
      .spells-field,
      .text-field,
      .tags-field,
      .name-field {
        max-width: none;
      }

      .statblock-row {
        flex-direction: column;
        gap: 8px;
      }

      .row-actions {
        flex-direction: row;
        justify-content: space-between;
        min-width: auto;
      }

      .filter-row {
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
      }

      .action-row {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .selection-controls {
        justify-content: center;
      }

      .tag-actions {
        flex-direction: column;
        gap: 8px;
      }

      .tag-input {
        max-width: none;
      }

      .search-field {
        max-width: none;
      }
    }
  `]
})
export class StatblockViewComponent implements OnInit {
  statblocks: StatBlock[] = [];
  filteredStatblocks: StatBlock[] = [];
  allTags: string[] = [];
  searchControl = new FormControl('');
  selection = new SelectionModel<StatBlock>(true, []);
  bulkTagInput: string = '';

  constructor(private statblockService: StatblockService) {}

  ngOnInit(): void {
    this.loadStatblocks();
    
    // Real-time search
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
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
    
    // Apply search filter
    const searchTerm = this.searchControl.value?.toLowerCase().trim();
    if (searchTerm) {
      const searchTerms = this.parseSearchTerms(searchTerm);
      filtered = filtered.filter(statblock => {
        return searchTerms.every(term => {
          const searchText = term.toLowerCase();
          return statblock.name.toLowerCase().includes(searchText) ||
                 (statblock.tags && statblock.tags.some(tag => tag.toLowerCase().includes(searchText)));
        });
      });
    }
    
    // Always sort by name in view mode
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    this.filteredStatblocks = filtered;
  }

  private parseSearchTerms(searchText: string): string[] {
    const terms: string[] = [];
    let currentTerm = '';
    let inQuotes = false;
    
    for (let i = 0; i < searchText.length; i++) {
      const char = searchText[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes) {
        if (currentTerm.trim()) {
          terms.push(currentTerm.trim());
          currentTerm = '';
        }
      } else {
        currentTerm += char;
      }
    }
    
    if (currentTerm.trim()) {
      terms.push(currentTerm.trim());
    }
    
    return terms;
  }

  isTagHighlighted(tag: string): boolean {
    const searchTerm = this.searchControl.value?.toLowerCase().trim();
    if (!searchTerm) return false;
    
    const searchTerms = this.parseSearchTerms(searchTerm);
    return searchTerms.some(term => tag.toLowerCase().includes(term.toLowerCase()));
  }

  toggleTagFilter(tag: string): void {
    const currentSearch = this.searchControl.value || '';
    const searchTerms = this.parseSearchTerms(currentSearch);
    
    // Check if tag is already in search
    const tagIndex = searchTerms.findIndex(term => term.toLowerCase() === tag.toLowerCase());
    
    if (tagIndex >= 0) {
      // Remove tag from search
      searchTerms.splice(tagIndex, 1);
    } else {
      // Add tag to search
      searchTerms.push(tag);
    }
    
    // Update search control
    const newSearchText = searchTerms.join(' ');
    this.searchControl.setValue(newSearchText);
    
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.applyFilters();
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
    // TODO: Implement edit functionality
    console.log('Edit statblock:', statblock);
  }

  deleteStatblock(statblock: StatBlock): void {
    if (confirm(`Delete statblock "${statblock.name}"?`)) {
      this.statblockService.deleteStatblock(statblock.id!).subscribe({
        next: () => {
          this.loadStatblocks();
        },
        error: (error) => {
          console.error('Error deleting statblock:', error);
        }
      });
    }
  }

  deleteSelected(): void {
    const selectedStatblocks = this.selection.selected;
    if (selectedStatblocks.length === 0) return;

    const count = selectedStatblocks.length;
    const message = count === 1 
      ? `Delete the selected statblock "${selectedStatblocks[0].name}"?`
      : `Delete all ${count} selected statblocks?`;

    if (confirm(message)) {
      const selectedIds = selectedStatblocks.map(s => s.id!);
      this.statblockService.deleteStatblocks(selectedIds).subscribe({
        next: () => {
          this.selection.clear();
          this.loadStatblocks();
        },
        error: (error) => {
          console.error('Error deleting statblocks:', error);
        }
      });
    }
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
}
