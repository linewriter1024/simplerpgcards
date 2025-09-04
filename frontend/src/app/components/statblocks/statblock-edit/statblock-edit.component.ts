import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { StatblockService } from '../../../services/statblock.service';
import { StatBlock, CreateStatBlockDto } from '../../../models/statblock.model';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-statblock-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  templateUrl: './statblock-edit.component.html',
  styleUrl: './statblock-edit.component.scss'
})
export class StatblockEditComponent implements OnInit {
  editableRows: EditableStatBlock[] = [];
  dataSource = new MatTableDataSource<EditableStatBlock>([]);
  selection = new SelectionModel<EditableStatBlock>(true, []);
  
  // Search and filtering
  searchControl = new FormControl('');
  allStatblocks: EditableStatBlock[] = [];
  
  displayedColumns: string[] = [
    'actions', 'select', 'name', 'cr', 'ac', 'abilities', 'attacks', 'spells', 'skills', 'resistances', 'tags', 'notes'
  ];

  constructor(
    private statblockService: StatblockService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Set up search functionality
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applySearch();
    });

    this.loadStatblocks().then(() => {
      // Check for jumpTo query parameter
      this.route.queryParams.subscribe(params => {
        if (params['jumpTo']) {
          this.scrollToStatblock(params['jumpTo']);
        }
      });
    });
  }

  loadStatblocks(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statblockService.getStatblocks().subscribe({
        next: (statblocks) => {
          // Sort by name initially in edit mode, but preserve order for new rows later
          const sortedStatblocks = statblocks.sort((a, b) => a.name.localeCompare(b.name));
          this.allStatblocks = sortedStatblocks.map(sb => this.convertToEditableRow(sb));
          this.editableRows = [...this.allStatblocks];
          this.dataSource.data = this.editableRows;
          // Apply search filter if search text exists
          this.applySearch();
          // Trigger change detection to ensure textareas resize properly
          setTimeout(() => {
            this.cdr.detectChanges();
            resolve();
          }, 0);
        },
        error: (error) => {
          console.error('Error loading statblocks:', error);
          reject(error);
        }
      });
    });
  }

  scrollToStatblock(statblockId: string): void {
    // Find the statblock row with the matching ID
    const targetRowIndex = this.editableRows.findIndex(row => row.id === statblockId);
    if (targetRowIndex !== -1) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        const elements = document.querySelectorAll('.statblock-row');
        if (elements[targetRowIndex]) {
          elements[targetRowIndex].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // Optionally add a highlight effect
          elements[targetRowIndex].classList.add('highlight-jump');
          setTimeout(() => {
            elements[targetRowIndex].classList.remove('highlight-jump');
          }, 2000);
        }
      }, 100);
    }
  }

  applySearch(): void {
    const searchTerm = this.searchControl.value?.toLowerCase().trim();
    let filtered = this.allStatblocks;

    if (searchTerm) {
      const searchTerms = this.parseSearchTerms(searchTerm);
      filtered = this.allStatblocks.filter(statblock => {
        return searchTerms.every(term => {
          const searchableText = `${statblock.name} ${statblock.tags?.join(' ') || ''}`.toLowerCase();
          return searchableText.includes(term.toLowerCase());
        });
      });
    }

    this.editableRows = filtered;
    this.dataSource.data = this.editableRows;
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
    
    return terms.filter(term => term.length > 0);
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
    
    // Update search control with new terms
    this.searchControl.setValue(searchTerms.join(' '));
  }

  convertToEditableRow(statblock: StatBlock): EditableStatBlock {
    return {
      ...statblock,
      notes: '',
      attacksText: statblock.attacks?.map(a => a.name).join('\n') || '',
      spellsText: statblock.spells?.map(s => s.name).join('\n') || '',
      spellSlotsText: statblock.spellSlots?.join(' ') || '',
      skillsText: statblock.skills?.join('\n') || '',
      resistancesText: statblock.resistances?.join('\n') || '',
      tagsText: statblock.tags?.join(' ') || '',
      isNew: false,
      hasUnsavedChanges: false
    };
  }

  addNewRowInternal(): void {
    const newRow: EditableStatBlock = {
      name: '',
      type: '',
      cr: '',
      ac: '10',
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
      attacks: [],
      spells: [],
      spellSlots: [],
      skills: [],
      resistances: [],
      tags: [],
      notes: '',
      attacksText: '',
      spellsText: '',
      spellSlotsText: '',
      skillsText: '',
      resistancesText: '',
      tagsText: '',
      isNew: true,
      hasUnsavedChanges: true
    };
    
    // Add to both allStatblocks and editableRows to make it visible regardless of search
    this.allStatblocks.unshift(newRow);
    this.editableRows.unshift(newRow);
    this.dataSource.data = [...this.editableRows];
  }

  onFieldChange(row: EditableStatBlock): void {
    row.hasUnsavedChanges = true;
  }

  onAttacksChange(row: EditableStatBlock): void {
    // Convert text to attacks array
    const lines = row.attacksText.split('\n').filter(line => line.trim());
    row.attacks = lines.map(line => ({
      name: line.trim(),
      toHitModifier: 0,
      damage: '',
      additionalEffect: undefined
    }));
    this.onFieldChange(row);
    // Trigger change detection for textarea resizing
    this.cdr.detectChanges();
  }

  onSpellsChange(row: EditableStatBlock): void {
    // Convert text to spells array
    const lines = row.spellsText.split('\n').filter(line => line.trim());
    row.spells = lines.map(line => ({
      name: line.trim(),
      description: ''
    }));
    this.onFieldChange(row);
    // Trigger change detection for textarea resizing
    this.cdr.detectChanges();
  }

  onSpellSlotsChange(row: EditableStatBlock): void {
    // Convert space-separated text to spell slots array
    const allText = row.spellSlotsText.replace(/\n/g, ' '); // Replace newlines with spaces
    row.spellSlots = allText.split(' ')
      .filter(slot => slot.trim())
      .map(slot => parseInt(slot.trim()))
      .filter(slot => !isNaN(slot) && slot >= 0);
    this.onFieldChange(row);
  }

  onSkillsChange(row: EditableStatBlock): void {
    // Convert text to skills array
    const lines = row.skillsText.split('\n').filter(line => line.trim());
    row.skills = lines.map(line => line.trim());
    this.onFieldChange(row);
    // Trigger change detection for textarea resizing
    this.cdr.detectChanges();
  }

  onResistancesChange(row: EditableStatBlock): void {
    // Convert text to resistances array
    const lines = row.resistancesText.split('\n').filter(line => line.trim());
    row.resistances = lines.map(line => line.trim());
    this.onFieldChange(row);
    // Trigger change detection for textarea resizing
    this.cdr.detectChanges();
  }

  onTagsChange(row: EditableStatBlock): void {
    // Convert space-separated text to tags array (across multiple lines)
    const allText = row.tagsText.replace(/\n/g, ' '); // Replace newlines with spaces
    const tags = allText.split(' ').filter(tag => tag.trim()).map(tag => tag.trim());
    
    // Remove duplicates by converting to Set and back to array
    row.tags = Array.from(new Set(tags));
    this.onFieldChange(row);
  }

  getTextareaRows(text: string): number {
    if (!text) return 3; // Minimum 3 rows for better usability
    
    // More accurate calculation based on actual text field constraints
    // Text fields: min-width 120px, max-width 200px, typical width ~160px
    // Account for padding, borders, and scrollbar: ~140px effective content width
    // Default font size (14px) with typical character width ~7-8px
    const effectiveWidth = 140; // Content width in pixels after padding/borders
    const charWidth = 7; // More conservative character width estimate
    const charsPerLine = Math.floor(effectiveWidth / charWidth); // ~20 chars per line
    
    const lines = text.split('\n');
    let totalRows = 0;
    
    lines.forEach(line => {
      if (line.length === 0) {
        totalRows += 1;
      } else {
        // Calculate how many visual rows this line will take due to wrapping
        const wrappedRows = Math.ceil(line.length / charsPerLine);
        totalRows += Math.max(wrappedRows, 1);
      }
    });
    
    // Add extra row for cursor/editing space, minimum 3 rows
    return Math.max(totalRows + 2, 3);
  }

  addNewRow(): void {
    // Clear search when adding a new row so user can see it
    this.searchControl.setValue('');
    this.addNewRowInternal();
  }

  saveRow(row: EditableStatBlock): void {
    // Don't save if the row doesn't have required fields
    if (!row.name || !row.name.trim()) {
      return;
    }

    const statblockData: CreateStatBlockDto = {
      name: row.name,
      cr: row.cr,
      ac: row.ac,
      str: row.str,
      dex: row.dex,
      con: row.con,
      int: row.int,
      wis: row.wis,
      cha: row.cha,
      attacks: row.attacks,
      spells: row.spells,
      spellSlots: row.spellSlots,
      skills: row.skills,
      resistances: row.resistances,
      tags: row.tags
    };

    if (row.isNew) {
      this.statblockService.createStatblock(statblockData).subscribe({
        next: (created) => {
          Object.assign(row, created);
          row.isNew = false;
          row.hasUnsavedChanges = false;
          console.log('Statblock created:', created);
        },
        error: (error) => {
          console.error('Error creating statblock:', error);
        }
      });
    } else if (row.id) {
      this.statblockService.updateStatblock(row.id, statblockData).subscribe({
        next: (updated) => {
          Object.assign(row, updated);
          row.hasUnsavedChanges = false;
          console.log('Statblock updated:', updated);
        },
        error: (error) => {
          console.error('Error updating statblock:', error);
        }
      });
    }
  }

  saveAll(): void {
    // This method is no longer needed but kept for backwards compatibility
  }

  deleteRow(row: EditableStatBlock): void {
    if (row.isNew) {
      // Just remove from both arrays
      this.allStatblocks = this.allStatblocks.filter(r => r !== row);
      this.editableRows = this.editableRows.filter(r => r !== row);
      this.dataSource.data = [...this.editableRows];
    } else if (row.id) {
      if (confirm(`Delete statblock "${row.name}"?`)) {
        this.statblockService.deleteStatblock(row.id).subscribe({
          next: () => {
            this.allStatblocks = this.allStatblocks.filter(r => r !== row);
            this.editableRows = this.editableRows.filter(r => r !== row);
            this.dataSource.data = [...this.editableRows];
          },
          error: (error) => {
            console.error('Error deleting statblock:', error);
          }
        });
      }
    }
  }

  deleteSelected(): void {
    const selectedRows = this.selection.selected;
    if (selectedRows.length === 0) return;

    if (confirm(`Delete ${selectedRows.length} selected statblocks?`)) {
      const toDelete = selectedRows.filter(row => !row.isNew && row.id);
      const newRows = selectedRows.filter(row => row.isNew);

      // Delete new rows immediately from both arrays
      newRows.forEach(row => {
        this.allStatblocks = this.allStatblocks.filter(r => r !== row);
        this.editableRows = this.editableRows.filter(r => r !== row);
      });

      // Update dataSource after removing new rows
      this.dataSource.data = [...this.editableRows];

      // Delete existing rows via API
      if (toDelete.length > 0) {
        const ids = toDelete.map(row => row.id!);
        this.statblockService.deleteStatblocks(ids).subscribe({
          next: () => {
            toDelete.forEach(row => {
              this.allStatblocks = this.allStatblocks.filter(r => r !== row);
              this.editableRows = this.editableRows.filter(r => r !== row);
            });
            this.dataSource.data = [...this.editableRows];
            this.selection.clear();
          },
          error: (error) => {
            console.error('Error deleting statblocks:', error);
          }
        });
      } else {
        this.selection.clear();
      }
    }
  }

  hasChanges(): boolean {
    return this.editableRows.some(row => row.hasUnsavedChanges);
  }

  isAllSelected(): boolean {
    return this.editableRows.length > 0 && this.selection.selected.length === this.editableRows.length;
  }

  isIndeterminate(): boolean {
    return this.selection.selected.length > 0 && !this.isAllSelected();
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.editableRows);
    }
  }
}

interface EditableStatBlock extends StatBlock {
  notes: string;
  attacksText: string;
  spellsText: string;
  spellSlotsText: string;
  skillsText: string;
  resistancesText: string;
  tagsText: string;
  isNew: boolean;
  hasUnsavedChanges: boolean;
}
