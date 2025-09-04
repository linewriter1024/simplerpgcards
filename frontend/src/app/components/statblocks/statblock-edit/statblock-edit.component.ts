import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
    private route: ActivatedRoute,
    private router: Router
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

  clearFilters(): void {
    this.searchControl.setValue('');
    this.applySearch();
  }

  switchToViewMode(): void {
    this.router.navigate(['/statblocks/view']);
  }

  convertToEditableRow(statblock: StatBlock): EditableStatBlock {
    return {
      ...statblock,
      notes: statblock.notes || '',
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
    // Convert text to resistances array (line-separated for textarea)
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

  getTextareaRows(text: string, textareaElement?: HTMLTextAreaElement): number {
    if (!text) return 2; // Minimum 2 rows for empty content - enough for typing
    
    const lines = text.split('\n');
    
    // Get real measurements from the specific textarea or find one in the DOM
    const measurements = this.getRealDOMMeasurements(textareaElement);
    if (!measurements) {
      // Fallback to simple line count if we can't measure
      return Math.max(lines.length, 2);
    }
    
    // Calculate exact visual rows by measuring actual text width
    let totalVisualRows = 0;
    
    lines.forEach(line => {
      if (line.length === 0) {
        totalVisualRows += 1; // Empty line still takes one row
      } else {
        // Measure the actual rendered width of this line
        const lineWidth = this.measureTextWidthDOM(line, measurements.canvas);
        const availableWidth = measurements.availableWidth;
        
        // Calculate how many visual rows this line will actually take
        const visualRowsForLine = Math.ceil(lineWidth / availableWidth);
        totalVisualRows += Math.max(visualRowsForLine, 1);
      }
    });
    
    return Math.max(totalVisualRows, 2); // Minimum 2 rows total
  }

  private getRealDOMMeasurements(specificTextarea?: HTMLTextAreaElement): { availableWidth: number; canvas: CanvasRenderingContext2D; } | null {
    // Use the specific textarea if provided, otherwise find any textarea in the DOM
    const textarea = specificTextarea || document.querySelector('.text-field textarea') as HTMLTextAreaElement;
    if (!textarea) {
      return null;
    }
    
    // Get the computed styles from the actual element
    const computedStyles = window.getComputedStyle(textarea);
    
    // Create canvas with the exact same font settings
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }
    
    // Use the exact font from the DOM element
    const fontSize = computedStyles.fontSize || '14px';
    const fontFamily = computedStyles.fontFamily || 'JetBrains Mono, monospace';
    const fontWeight = computedStyles.fontWeight || 'normal';
    context.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    
    // Get the actual content width of the textarea
    const textareaRect = textarea.getBoundingClientRect();
    const paddingLeft = parseFloat(computedStyles.paddingLeft || '0');
    const paddingRight = parseFloat(computedStyles.paddingRight || '0');
    const borderLeft = parseFloat(computedStyles.borderLeftWidth || '0');
    const borderRight = parseFloat(computedStyles.borderRightWidth || '0');
    
    // Calculate actual available width for text
    const availableWidth = textareaRect.width - paddingLeft - paddingRight - borderLeft - borderRight - 17; // 17px for scrollbar
    
    return {
      availableWidth: Math.max(availableWidth, 50), // Minimum 50px
      canvas: context
    };
  }

  private measureTextWidthDOM(text: string, context: CanvasRenderingContext2D): number {
    // Measure actual text width using the DOM-derived canvas context
    const textMetrics = context.measureText(text);
    return textMetrics.width;
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
      type: row.type,
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
      tags: row.tags,
      notes: row.notes
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
