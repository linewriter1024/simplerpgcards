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
        <div class="statblocks-list">
          @for (statblock of filteredStatblocks; track statblock.id) {
            <div class="statblock-card" 
                 [class.selected]="selection.isSelected(statblock)"
                 (click)="toggleRowSelection(statblock)">
              
              <!-- Card Header with Selection and Actions -->
              <div class="card-header">
                <mat-checkbox (change)="$event ? selection.toggle(statblock) : null"
                             [checked]="selection.isSelected(statblock)"
                             (click)="$event.stopPropagation()">
                </mat-checkbox>
                <h3 class="statblock-name">{{statblock.name}}</h3>
                <div class="card-actions">
                  <button mat-icon-button color="primary" (click)="editStatblock(statblock); $event.stopPropagation()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteStatblock(statblock); $event.stopPropagation()">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Card Content -->
              <div class="card-content">
                <!-- Basic Info Row -->
                <div class="basic-info-row">
                  <div class="info-item">
                    <span class="label">CR:</span>
                    <span class="value">{{statblock.cr}}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">AC:</span>
                    <span class="value">{{statblock.ac}}</span>
                  </div>
                </div>

                <!-- Abilities Row -->
                <div class="abilities-row">
                  <div class="ability-item">
                    <span class="ability-label">STR</span>
                    <span class="ability-value">{{statblock.str}} ({{getModifier(statblock.str)}})</span>
                  </div>
                  <div class="ability-item">
                    <span class="ability-label">DEX</span>
                    <span class="ability-value">{{statblock.dex}} ({{getModifier(statblock.dex)}})</span>
                  </div>
                  <div class="ability-item">
                    <span class="ability-label">CON</span>
                    <span class="ability-value">{{statblock.con}} ({{getModifier(statblock.con)}})</span>
                  </div>
                  <div class="ability-item">
                    <span class="ability-label">INT</span>
                    <span class="ability-value">{{statblock.int}} ({{getModifier(statblock.int)}})</span>
                  </div>
                  <div class="ability-item">
                    <span class="ability-label">WIS</span>
                    <span class="ability-value">{{statblock.wis}} ({{getModifier(statblock.wis)}})</span>
                  </div>
                  <div class="ability-item">
                    <span class="ability-label">CHA</span>
                    <span class="ability-value">{{statblock.cha}} ({{getModifier(statblock.cha)}})</span>
                  </div>
                </div>

                <!-- Details Rows -->
                <div class="details-section">
                  @if (statblock.attacks && statblock.attacks.length > 0) {
                    <div class="detail-row">
                      <span class="detail-label">Attacks:</span>
                      <div class="detail-content">
                        @for (attack of statblock.attacks; track attack.name) {
                          <div class="attack-item">{{attack.name}}</div>
                        }
                      </div>
                    </div>
                  }

                  @if (statblock.spells && statblock.spells.length > 0) {
                    <div class="detail-row">
                      <span class="detail-label">Spells:</span>
                      <div class="detail-content">
                        @for (spell of statblock.spells; track spell.name) {
                          <div class="spell-item">{{spell.name}}</div>
                        }
                      </div>
                    </div>
                  }

                  @if (statblock.spellSlots && statblock.spellSlots.length > 0) {
                    <div class="detail-row">
                      <span class="detail-label">Spell Slots:</span>
                      <div class="detail-content spell-slots">
                        {{formatSpellSlots(statblock.spellSlots)}}
                      </div>
                    </div>
                  }

                  @if (statblock.skills && statblock.skills.length > 0) {
                    <div class="detail-row">
                      <span class="detail-label">Skills:</span>
                      <div class="detail-content">{{statblock.skills.join(', ')}}</div>
                    </div>
                  }

                  @if (statblock.resistances && statblock.resistances.length > 0) {
                    <div class="detail-row">
                      <span class="detail-label">Resistances:</span>
                      <div class="detail-content">{{statblock.resistances.join(', ')}}</div>
                    </div>
                  }

                  @if (statblock.tags && statblock.tags.length > 0) {
                    <div class="detail-row">
                      <span class="detail-label">Tags:</span>
                      <div class="detail-content tags-content">
                        @for (tag of statblock.tags; track tag) {
                          <span class="tag-chip">{{tag}}</span>
                        }
                      </div>
                    </div>
                  }
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

    .statblocks-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }

    .statblock-card {
      background-color: #2d2d2d;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .statblock-card:hover {
      background-color: rgba(255, 255, 255, 0.04);
      border-color: #666;
    }

    .statblock-card.selected {
      background-color: rgba(63, 81, 181, 0.2);
      border-color: rgba(63, 81, 181, 0.5);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #444;
    }

    .statblock-name {
      flex: 1;
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: #e0e0e0;
    }

    .card-actions {
      display: flex;
      gap: 4px;
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .basic-info-row {
      display: flex;
      gap: 24px;
      align-items: center;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .label {
      font-weight: 500;
      color: #ccc;
    }

    .value {
      color: #e0e0e0;
    }

    .abilities-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .ability-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
    }

    .ability-label {
      font-size: 10px;
      color: #ccc;
      font-weight: 500;
      text-transform: uppercase;
    }

    .ability-value {
      font-size: 12px;
      color: #e0e0e0;
      text-align: center;
    }

    .details-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-row {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .detail-label {
      font-weight: 500;
      color: #ccc;
      min-width: 80px;
      flex-shrink: 0;
    }

    .detail-content {
      flex: 1;
      color: #e0e0e0;
      font-size: 14px;
    }

    .attack-item, .spell-item {
      margin-bottom: 4px;
      font-size: 13px;
      line-height: 1.3;
    }

    .attack-item:last-child, .spell-item:last-child {
      margin-bottom: 0;
    }

    .spell-slots {
      font-family: monospace;
      color: #4CAF50;
    }

    .tags-content {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .tag-chip {
      background-color: #3f51b5;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      white-space: nowrap;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .basic-info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .abilities-row {
        justify-content: space-between;
      }

      .detail-row {
        flex-direction: column;
        gap: 4px;
      }

      .detail-label {
        min-width: auto;
      }

      .card-header {
        flex-wrap: wrap;
      }

      .statblock-name {
        font-size: 16px;
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
