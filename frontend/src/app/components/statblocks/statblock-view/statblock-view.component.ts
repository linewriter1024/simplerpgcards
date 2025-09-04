import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
              <input matInput [formControl]="searchControl" placeholder="Search names and tags...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <button mat-button (click)="clearFilters()">Clear Filters</button>
          </div>

          @if (allTags.length > 0) {
            <div class="tags-section">
              <h4>Filter by Tags:</h4>
              <div class="tags-grid">
                <mat-chip-listbox>
                  @for (tag of allTags; track tag) {
                    <mat-chip-option
                      [selected]="isTagSelected(tag)"
                      (click)="toggleTagFilter(tag)">
                      {{ tag }}
                    </mat-chip-option>
                  }
                </mat-chip-listbox>
              </div>
            </div>
          }

          <div class="action-row">
            <button mat-raised-button color="warn" (click)="deleteSelected()" [disabled]="selection.selected.length === 0">
              <mat-icon>delete</mat-icon>
              Delete Selected ({{selection.selected.length}})
            </button>

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
                      <div class="field-value">{{statblock.str}}</div>
                    </div>
                    <div class="field ability-field">
                      <div class="field-label">DEX</div>
                      <div class="field-value">{{statblock.dex}}</div>
                    </div>
                    <div class="field ability-field">
                      <div class="field-label">CON</div>
                      <div class="field-value">{{statblock.con}}</div>
                    </div>
                    <div class="field ability-field">
                      <div class="field-label">INT</div>
                      <div class="field-value">{{statblock.int}}</div>
                    </div>
                    <div class="field ability-field">
                      <div class="field-label">WIS</div>
                      <div class="field-value">{{statblock.wis}}</div>
                    </div>
                    <div class="field ability-field">
                      <div class="field-label">CHA</div>
                      <div class="field-value">{{statblock.cha}}</div>
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

    .action-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
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
      font-size: 10px;
      color: #ccc;
      font-weight: 500;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .field-value {
      color: #e0e0e0;
      font-size: 12px;
      min-height: 16px;
    }

    .name-field {
      min-width: 150px;
      flex: 1;
      max-width: 250px;
    }

    .compact-field {
      width: 60px;
      min-width: 60px;
    }

    .ability-field {
      width: 45px;
      min-width: 45px;
    }

    .attacks-field,
    .spells-field {
      min-width: 180px;
      flex: 1;
      max-width: 250px;
    }

    .spell-slots-field {
      min-width: 120px;
      width: 120px;
    }

    .text-field {
      min-width: 100px;
      flex: 1;
      max-width: 150px;
    }

    .tags-field {
      min-width: 120px;
      flex: 1;
      max-width: 200px;
    }

    .list-item {
      font-size: 11px;
      line-height: 1.2;
      margin-bottom: 1px;
    }

    .list-item:last-child {
      margin-bottom: 0;
    }

    .spell-slots {
      font-family: monospace;
      color: #4CAF50;
      font-size: 10px;
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
  selectedTags: string[] = [];
  selection = new SelectionModel<StatBlock>(true, []);

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

  loadStatblocks(): void {
    this.statblockService.getStatblocks().subscribe({
      next: (statblocks) => {
        this.statblocks = statblocks;
        this.extractTags();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading statblocks:', error);
      }
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
      filtered = filtered.filter(statblock => {
        return statblock.name.toLowerCase().includes(searchTerm) ||
               (statblock.tags && statblock.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
      });
    }
    
    // Apply tag filters
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(statblock => {
        return this.selectedTags.every(selectedTag => 
          statblock.tags && statblock.tags.includes(selectedTag)
        );
      });
    }
    
    this.filteredStatblocks = filtered;
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  toggleTagFilter(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedTags = [];
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
}
