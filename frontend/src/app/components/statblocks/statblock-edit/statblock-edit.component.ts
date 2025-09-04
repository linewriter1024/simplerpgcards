import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
  template: `
    <div class="edit-container">
      <div class="toolbar">
        <button mat-raised-button color="primary" (click)="addNewRow()">
          <mat-icon>add</mat-icon>
          Add New Statblock
        </button>
        
        <mat-checkbox (change)="$event ? toggleAllRows() : null"
                      [checked]="isAllSelected()"
                      [indeterminate]="isIndeterminate()">
          Select All
        </mat-checkbox>
        
        <button mat-raised-button color="warn" (click)="deleteSelected()" [disabled]="selection.selected.length === 0">
          <mat-icon>delete</mat-icon>
          Delete Selected ({{selection.selected.length}})
        </button>

        <span class="spacer"></span>
        <span class="row-count">{{ editableRows.length }} statblocks</span>
      </div>

      <div class="table-container">
        <div class="statblocks-list">
          @for (row of editableRows; track row) {
            <div class="statblock-row" 
                 [class.new-row]="row.isNew"
                 [class.unsaved-row]="row.hasUnsavedChanges">
              
              <!-- Row Header with Actions and Selection -->
              <div class="row-header">
                <mat-checkbox (change)="$event ? selection.toggle(row) : null"
                             [checked]="selection.isSelected(row)">
                </mat-checkbox>
                <button mat-icon-button color="primary" (click)="saveRow(row)" 
                        [disabled]="!row.hasUnsavedChanges" 
                        [matTooltip]="row.hasUnsavedChanges ? 'Save changes' : 'No changes to save'">
                  <mat-icon>{{ row.hasUnsavedChanges ? 'save' : 'check' }}</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteRow(row)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>

              <!-- Main Content Area -->
              <div class="row-content">
                <!-- Top Row: Basic Info -->
                <div class="basic-info-row">
                  <mat-form-field appearance="outline" class="name-field">
                    <mat-label>Name</mat-label>
                    <input matInput [(ngModel)]="row.name" (input)="onFieldChange(row)">
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="compact-field">
                    <mat-label>CR</mat-label>
                    <input matInput [(ngModel)]="row.cr" (input)="onFieldChange(row)">
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="compact-field">
                    <mat-label>AC</mat-label>
                    <input matInput type="number" [(ngModel)]="row.ac" (input)="onFieldChange(row)">
                  </mat-form-field>

                  <!-- Abilities with Material labels -->
                  <mat-form-field appearance="outline" class="ability-field">
                    <mat-label>STR</mat-label>
                    <input matInput type="number" [(ngModel)]="row.str" (input)="onFieldChange(row)">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="ability-field">
                    <mat-label>DEX</mat-label>
                    <input matInput type="number" [(ngModel)]="row.dex" (input)="onFieldChange(row)">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="ability-field">
                    <mat-label>CON</mat-label>
                    <input matInput type="number" [(ngModel)]="row.con" (input)="onFieldChange(row)">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="ability-field">
                    <mat-label>INT</mat-label>
                    <input matInput type="number" [(ngModel)]="row.int" (input)="onFieldChange(row)">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="ability-field">
                    <mat-label>WIS</mat-label>
                    <input matInput type="number" [(ngModel)]="row.wis" (input)="onFieldChange(row)">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="ability-field">
                    <mat-label>CHA</mat-label>
                    <input matInput type="number" [(ngModel)]="row.cha" (input)="onFieldChange(row)">
                  </mat-form-field>
                </div>

                <!-- Bottom Row: Text Fields -->
                <div class="text-fields-row">
                  <mat-form-field appearance="outline" class="text-field">
                    <mat-label>Attacks</mat-label>
                    <textarea matInput [(ngModel)]="row.attacksText" (input)="onAttacksChange(row)" 
                              placeholder="one per line" [rows]="getTextareaRows(row.attacksText)"></textarea>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="text-field">
                    <mat-label>Spells</mat-label>
                    <textarea matInput [(ngModel)]="row.spellsText" (input)="onSpellsChange(row)" 
                              placeholder="one per line" [rows]="getTextareaRows(row.spellsText)"></textarea>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="text-field">
                    <mat-label>Spell Slots</mat-label>
                    <input matInput [(ngModel)]="row.spellSlotsText" (input)="onSpellSlotsChange(row)" 
                           placeholder="space delimited (e.g., 1 2 3 4)">
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="text-field">
                    <mat-label>Skills</mat-label>
                    <textarea matInput [(ngModel)]="row.skillsText" (input)="onSkillsChange(row)" 
                              placeholder="one per line" [rows]="getTextareaRows(row.skillsText)"></textarea>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="text-field">
                    <mat-label>Resistances</mat-label>
                    <textarea matInput [(ngModel)]="row.resistancesText" (input)="onResistancesChange(row)" 
                              placeholder="one per line" [rows]="getTextareaRows(row.resistancesText)"></textarea>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="text-field">
                    <mat-label>Tags</mat-label>
                    <textarea matInput [(ngModel)]="row.tagsText" (input)="onTagsChange(row)" 
                              placeholder="space separated" [rows]="getTextareaRows(row.tagsText)"></textarea>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="text-field">
                    <mat-label>Notes</mat-label>
                    <textarea matInput [(ngModel)]="row.notes" (input)="onFieldChange(row)" 
                              placeholder="general notes" [rows]="getTextareaRows(row.notes)"></textarea>
                  </mat-form-field>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
      
      <div class="bottom-toolbar">
        <button mat-raised-button color="primary" (click)="addNewRow()">
          <mat-icon>add</mat-icon>
          Add New Statblock
        </button>
      </div>
    </div>
  `,
  styles: [`
    .edit-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .toolbar {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 16px;
      background-color: #2d2d2d;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .row-count {
      color: #aaa;
      font-size: 14px;
    }

    .table-container {
      flex: 1;
      overflow: auto;
      border: 1px solid #444;
      border-radius: 4px;
    }

    .statblocks-list {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .statblock-row {
      display: flex;
      background-color: #2d2d2d;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 12px;
      gap: 12px;
      align-items: stretch;
    }

    .statblock-row.new-row {
      background-color: rgba(76, 175, 80, 0.15);
      border-color: rgba(76, 175, 80, 0.5);
    }

    .statblock-row.unsaved-row {
      background-color: rgba(255, 193, 7, 0.15);
      border-color: rgba(255, 193, 7, 0.5);
    }

    .row-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      min-width: 60px;
      justify-content: flex-start;
      padding-top: 8px;
    }

    .row-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .basic-info-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .text-fields-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .ability-field {
      width: 60px;
    }

    .name-field {
      min-width: 180px;
      flex: 1;
      max-width: 250px;
    }

    .compact-field {
      width: 80px;
      min-width: 80px;
    }

    .text-field {
      min-width: 120px;
      flex: 1;
      max-width: 200px;
    }

    /* Compact form field styling */
    .compact-field ::ng-deep .mat-mdc-form-field-subscript-wrapper,
    .ability-field ::ng-deep .mat-mdc-form-field-subscript-wrapper,
    .text-field ::ng-deep .mat-mdc-form-field-subscript-wrapper,
    .name-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .compact-field ::ng-deep .mat-mdc-text-field-wrapper,
    .ability-field ::ng-deep .mat-mdc-text-field-wrapper {
      padding: 2px;
    }

    .compact-field ::ng-deep .mat-mdc-form-field-infix,
    .ability-field ::ng-deep .mat-mdc-form-field-infix {
      padding: 6px 0;
      min-height: 24px;
    }

    .text-field ::ng-deep .mat-mdc-text-field-wrapper,
    .name-field ::ng-deep .mat-mdc-text-field-wrapper {
      padding: 4px;
    }

    .text-field ::ng-deep .mat-mdc-form-field-infix,
    .name-field ::ng-deep .mat-mdc-form-field-infix {
      padding: 8px 0;
      min-height: 32px;
    }

    .text-field ::ng-deep textarea {
      min-height: 60px;
      resize: vertical;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .basic-info-row {
        flex-direction: column;
        gap: 8px;
      }

      .text-fields-row {
        flex-direction: column;
        gap: 8px;
      }

      .text-field,
      .name-field {
        max-width: none;
      }

      .statblock-row {
        flex-direction: column;
        gap: 8px;
      }

      .row-header {
        flex-direction: row;
        justify-content: space-between;
        min-width: auto;
        padding-top: 0;
      }
    }

    .bottom-toolbar {
      display: flex;
      justify-content: center;
      padding: 16px;
      background-color: #2d2d2d;
      border-radius: 4px;
      margin-top: 16px;
    }
  `]
})
export class StatblockEditComponent implements OnInit {
  editableRows: EditableStatBlock[] = [];
  dataSource = new MatTableDataSource<EditableStatBlock>([]);
  selection = new SelectionModel<EditableStatBlock>(true, []);
  
  displayedColumns: string[] = [
    'actions', 'select', 'name', 'cr', 'ac', 'abilities', 'attacks', 'spells', 'skills', 'resistances', 'tags', 'notes'
  ];

  constructor(
    private statblockService: StatblockService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStatblocks();
  }

  loadStatblocks(): void {
    this.statblockService.getStatblocks().subscribe({
      next: (statblocks) => {
        this.editableRows = statblocks.map(sb => this.convertToEditableRow(sb));
        this.dataSource.data = this.editableRows;
        // Trigger change detection to ensure textareas resize properly
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (error) => {
        console.error('Error loading statblocks:', error);
      }
    });
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
      cr: '',
      ac: 10,
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
    row.tags = allText.split(' ').filter(tag => tag.trim()).map(tag => tag.trim());
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
      // Just remove from the array
      const index = this.editableRows.indexOf(row);
      this.editableRows = this.editableRows.filter((_, i) => i !== index);
      this.dataSource.data = [...this.editableRows];
    } else if (row.id) {
      if (confirm(`Delete statblock "${row.name}"?`)) {
        this.statblockService.deleteStatblock(row.id).subscribe({
          next: () => {
            const index = this.editableRows.indexOf(row);
            this.editableRows = this.editableRows.filter((_, i) => i !== index);
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

      // Delete new rows immediately
      newRows.forEach(row => {
        const index = this.editableRows.indexOf(row);
        this.editableRows.splice(index, 1);
      });

      // Update dataSource after removing new rows
      this.dataSource.data = [...this.editableRows];

      // Delete existing rows via API
      if (toDelete.length > 0) {
        const ids = toDelete.map(row => row.id!);
        this.statblockService.deleteStatblocks(ids).subscribe({
          next: () => {
            toDelete.forEach(row => {
              const index = this.editableRows.indexOf(row);
              this.editableRows.splice(index, 1);
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
