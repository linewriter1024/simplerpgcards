import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
    private router: Router
  ) {}

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
    this.router.navigate(['/statblocks'], { 
      queryParams: { jumpTo: statblock.id }
    });
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
