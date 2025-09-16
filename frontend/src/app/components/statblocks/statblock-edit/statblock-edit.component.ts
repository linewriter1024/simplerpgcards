import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { TextFieldModule } from '@angular/cdk/text-field';
import { StatblockService } from '../../../services/statblock.service';
import { StatBlock, CreateStatBlockDto } from '../../../models/statblock.model';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

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
  MatTooltipModule,
  MatDialogModule,
    TextFieldModule
  ],
  templateUrl: './statblock-edit.component.html',
  styleUrl: './statblock-edit.component.scss'
})
export class StatblockEditComponent implements OnInit, OnDestroy {
  editableRows: EditableStatBlock[] = [];
  dataSource = new MatTableDataSource<EditableStatBlock>([]);
  selection = new SelectionModel<EditableStatBlock>(true, []);
  private isAddingNewRow = false;
  // Image selected in sidebar to apply to the next created statblock
  pendingImage: File | { url: string } | { base64: string } | null = null;
  pendingImagePreview: string | null = null;
  
  // Search and filtering
  searchControl = new FormControl('');
  allStatblocks: EditableStatBlock[] = [];
  
  displayedColumns: string[] = [
  'actions', 'select', 'image', 'name', 'cr', 'ac', 'abilities', 'attacks', 'spells', 'skills', 'resistances', 'tags', 'notes'
  ];

  constructor(
    private statblockService: StatblockService,
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.updatePageTitle();
    
    // Load initial filters from URL query parameters
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchControl.setValue(params['search'], { emitEvent: false });
      }
      this.applySearch();
      this.updatePageTitle();
    });
    
    // Set up search functionality with URL updates
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applySearch();
      this.updatePageTitle();
      this.updateUrl();
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

  // Sidebar image handlers (apply to next created statblock)
  onSidebarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
  const file = input.files[0];
  this.pendingImage = file;
  this.makePreviewFromFile(file);
  this.handleSidebarImage(file);
    }
  }

  onSidebarPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (items && items.length > 0) {
      for (const item of Array.from(items)) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            this.pendingImage = file;
            this.makePreviewFromFile(file);
      this.handleSidebarImage(file);
      return;
          }
        }
      }
    }
    const text = event.clipboardData?.getData('text');
    if (text) {
      if (text.startsWith('data:image/')) {
        this.pendingImage = { base64: text };
        this.pendingImagePreview = text;
    this.handleSidebarImage({ base64: text });
      } else if (/^https?:\/\//i.test(text)) {
        this.pendingImage = { url: text };
        this.pendingImagePreview = text;
    this.handleSidebarImage({ url: text });
      }
    }
  }

  onSidebarDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.pendingImage = files[0];
      this.makePreviewFromFile(files[0]);
  this.handleSidebarImage(files[0]);
  return;
    }
    const url = event.dataTransfer?.getData('text/uri-list') || event.dataTransfer?.getData('text/plain');
    if (url) {
      this.pendingImage = { url };
      this.pendingImagePreview = url;
  this.handleSidebarImage({ url });
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  setSidebarImageFromUrl(): void {
  this.openUrlDialog();
  }

  clearPendingImage(): void {
    this.pendingImage = null;
    this.pendingImagePreview = null;
  }

  ngOnDestroy(): void {
    // Cleanup handled automatically by Angular
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
          // Allow DOM to render
          setTimeout(() => resolve(), 0);
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
    this.updatePageTitle();
    this.updateUrl();
  }

  switchToViewMode(): void {
    this.router.navigate(['/statblocks/view']);
  }

  private generateUid(): string {
    // Prefer crypto.randomUUID when available, fallback otherwise
    try {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        // @ts-ignore - TS may not know about randomUUID in some lib targets
        return crypto.randomUUID();
      }
    } catch {}
    return 'uid-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
  }

  convertToEditableRow(statblock: StatBlock): EditableStatBlock {
    return {
      uid: (statblock as any).id || this.generateUid(),
      ...statblock,
  hasImage: statblock.hasImage || false,
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
      uid: this.generateUid(),
      name: '',
      type: '',
      cr: '',
      hp: '10',
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
    
    // Add to source list and reapply search to derive editable list
    this.allStatblocks.unshift(newRow);
    this.applySearch();
    this.dataSource.data = [...this.editableRows];
  }

  addNewRow(): void {
    if (this.isAddingNewRow) return;
    this.isAddingNewRow = true;
    // Clear search when adding a new row so user can see it
    this.searchControl.setValue('');
    this.addNewRowInternal();
    // Release guard on next tick
    setTimeout(() => (this.isAddingNewRow = false));
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
  }

  onSpellsChange(row: EditableStatBlock): void {
    // Convert text to spells array
    const lines = row.spellsText.split('\n').filter(line => line.trim());
    row.spells = lines.map(line => ({
      name: line.trim(),
      description: ''
    }));
    this.onFieldChange(row);
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
  }

  onResistancesChange(row: EditableStatBlock): void {
    // Convert text to resistances array (line-separated for textarea)
    const lines = row.resistancesText.split('\n').filter(line => line.trim());
    row.resistances = lines.map(line => line.trim());
    this.onFieldChange(row);
  }

  onTagsChange(row: EditableStatBlock): void {
    // Convert space-separated text to tags array (across multiple lines)
    const allText = row.tagsText.replace(/\n/g, ' '); // Replace newlines with spaces
    const tags = allText.split(' ').filter(tag => tag.trim()).map(tag => tag.trim());
    
    // Remove duplicates by converting to Set and back to array
    row.tags = Array.from(new Set(tags));
    this.onFieldChange(row);
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
      hp: row.hp,
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

  private makePreviewFromFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => this.pendingImagePreview = reader.result as string;
    reader.readAsDataURL(file);
  }

  private async handleSidebarImage(source: File | { url: string } | { base64: string }): Promise<void> {
    try {
      // 1) Create a new statblock immediately with sensible defaults
      const defaults: CreateStatBlockDto = {
        name: '',
        type: '',
        cr: '',
        hp: '',
        ac: '',
        str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
        attacks: [], spells: [], spellSlots: [], skills: [], resistances: [], tags: [],
        notes: ''
      };
  const created = await firstValueFrom(this.statblockService.createStatblock(defaults));
      // 2) Insert into lists
      const row = this.convertToEditableRow(created);
      this.allStatblocks.unshift(row);
      this.applySearch();
      this.dataSource.data = [...this.editableRows];
      // 3) Upload image to new statblock
      if (row.id) {
        if (source instanceof File) {
          await firstValueFrom(this.statblockService.uploadImage(row.id, source));
        } else if ('url' in source) {
          await firstValueFrom(this.statblockService.setImageFromUrl(row.id, source.url));
        } else if ('base64' in source) {
          await firstValueFrom(this.statblockService.setImageFromBase64(row.id, source.base64));
        }
        row.hasImage = true;
        // Refresh the row thumb by changing uid
        row.uid = this.generateUid();
      }
      // Clear staged preview after applying
      this.clearPendingImage();
    } catch (e) {
      console.error('Failed to create statblock from image:', e);
    }
  }

  // Helper for row preview
  getImageUrl(row: EditableStatBlock): string | null {
    return row.id ? this.statblockService.getImageUrl(row.id) : null;
  }

  // Icon-only controls: open paste dialog
  openPasteDialog(): void {
    const ref = this.dialog.open(PasteImageDialogComponent, {
      width: '420px',
      autoFocus: true,
      restoreFocus: true
    });
    ref.afterClosed().subscribe((result: File | { url: string } | { base64: string } | undefined) => {
      if (!result) return;
      // Set preview for immediate feedback
      if (result instanceof File) {
        this.pendingImage = result;
        this.makePreviewFromFile(result);
        this.handleSidebarImage(result);
      } else if ('url' in result) {
        this.pendingImage = { url: result.url };
        this.pendingImagePreview = result.url;
        this.handleSidebarImage({ url: result.url });
      } else if ('base64' in result) {
        this.pendingImage = { base64: result.base64 };
        this.pendingImagePreview = result.base64;
        this.handleSidebarImage({ base64: result.base64 });
      }
    });
  }

  openUrlDialog(): void {
    const ref = this.dialog.open(UrlInputDialogComponent, {
      width: '420px',
      autoFocus: true,
      restoreFocus: true,
      data: {}
    });
    ref.afterClosed().subscribe((url?: string) => {
      if (url && /^https?:\/\//i.test(url)) {
        this.pendingImage = { url };
        this.pendingImagePreview = url;
        this.handleSidebarImage({ url });
      }
    });
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

  onRemoveImage(row: EditableStatBlock): void {
    if (!row.id || !row.hasImage) return;
    if (!confirm('Remove image from this statblock?')) return;
    this.statblockService.deleteImage(row.id).subscribe({
      next: () => {
        row.hasImage = false;
        // Bump uid to invalidate cached src if needed
        row.uid = this.generateUid();
      },
      error: (err) => {
        console.error('Failed to delete image', err);
        alert('Failed to delete image. See console for details.');
      }
    });
  }

  deleteSelected(): void {
    const selectedRows = this.selection.selected;
    if (selectedRows.length === 0) return;

    if (confirm(`Delete ${selectedRows.length} selected statblocks?`)) {
      const toDelete: EditableStatBlock[] = selectedRows.filter((row: EditableStatBlock) => !row.isNew && !!row.id);
      const newRows: EditableStatBlock[] = selectedRows.filter((row: EditableStatBlock) => row.isNew);

      // Delete new rows immediately from both arrays
      newRows.forEach((row) => {
        this.allStatblocks = this.allStatblocks.filter(r => r !== row);
        this.editableRows = this.editableRows.filter(r => r !== row);
      });

      // Update dataSource after removing new rows
      this.dataSource.data = [...this.editableRows];

      // Delete existing rows via API
      if (toDelete.length > 0) {
        const ids = toDelete.map((row) => row.id!) as string[];
        this.statblockService.deleteStatblocks(ids).subscribe({
          next: () => {
            toDelete.forEach((row) => {
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

  copyRow(source: EditableStatBlock): void {
    // Build a deep copy while resetting identifiers
    const copy: EditableStatBlock = {
      uid: this.generateUid(),
      id: undefined,
      name: source.name + ' (copy)',
      type: source.type,
      cr: source.cr,
      hp: source.hp,
      ac: source.ac,
      str: source.str,
      dex: source.dex,
      con: source.con,
      int: source.int,
      wis: source.wis,
      cha: source.cha,
      attacks: (source.attacks || []).map(a => ({ ...a })),
      spells: (source.spells || []).map(s => ({ ...s })),
      spellSlots: [...(source.spellSlots || [])],
      skills: [...(source.skills || [])],
      resistances: [...(source.resistances || [])],
      tags: [...(source.tags || [])],
      notes: source.notes || '',
      attacksText: source.attacksText || (source.attacks?.map(a => a.name).join('\n') || ''),
      spellsText: source.spellsText || (source.spells?.map(s => s.name).join('\n') || ''),
      spellSlotsText: source.spellSlotsText || (source.spellSlots?.join(' ') || ''),
      skillsText: source.skillsText || (source.skills?.join('\n') || ''),
      resistancesText: source.resistancesText || (source.resistances?.join('\n') || ''),
      tagsText: source.tagsText || (source.tags?.join(' ') || ''),
      isNew: true,
      hasUnsavedChanges: true
    } as EditableStatBlock;

    // Insert the copy immediately after the source in the master list
    const masterIndex = this.allStatblocks.indexOf(source);
    const insertIndex = masterIndex >= 0 ? masterIndex + 1 : this.allStatblocks.length;
    this.allStatblocks.splice(insertIndex, 0, copy);

    // Re-apply search filter to reflect current view
    const prevSearch = this.searchControl.value;
    this.applySearch();
    this.dataSource.data = [...this.editableRows];

    // Try to find the copy in the currently visible list; fallback to just scrolling to approximate index
    setTimeout(() => {
      // Find index by uid in the visible list
      const visibleIndex = this.editableRows.findIndex(r => r.uid === copy.uid);
      const elements = document.querySelectorAll('.statblock-row');

      if (visibleIndex !== -1 && elements[visibleIndex]) {
        elements[visibleIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        elements[visibleIndex].classList.add('highlight-jump');
        setTimeout(() => elements[visibleIndex].classList.remove('highlight-jump'), 2000);
      } else if (elements.length > 0) {
        // If filtered out, clear filter temporarily to show and focus the copy
        const restore = typeof prevSearch === 'string' ? prevSearch : '';
        this.searchControl.setValue('');
        this.applySearch();
        this.dataSource.data = [...this.editableRows];
        setTimeout(() => {
          const idx = this.editableRows.findIndex(r => r.uid === copy.uid);
          const els = document.querySelectorAll('.statblock-row');
          if (idx !== -1 && els[idx]) {
            els[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
            els[idx].classList.add('highlight-jump');
            setTimeout(() => els[idx].classList.remove('highlight-jump'), 2000);
          }
          // Restore prior search text
          this.searchControl.setValue(restore);
          this.applySearch();
          this.dataSource.data = [...this.editableRows];
        }, 50);
      }
    }, 50);
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
    let title = 'Edit Statblocks';
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
}

interface EditableStatBlock extends StatBlock {
  uid: string;
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

@Component({
  selector: 'app-url-input-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="url-dialog">
      <h3>Image URL</h3>
      <mat-form-field appearance="outline" style="width: 100%;">
        <mat-label>URL</mat-label>
        <input matInput [(ngModel)]="url" placeholder="https://..." autofocus />
      </mat-form-field>
      <div class="actions" style="display:flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
        <button mat-button (click)="close()">Cancel</button>
        <button mat-raised-button color="primary" (click)="ok()" [disabled]="!url">OK</button>
      </div>
    </div>
  `
})
export class UrlInputDialogComponent {
  url: string = '';
  constructor(private ref: MatDialogRef<UrlInputDialogComponent>) {}
  close() { this.ref.close(); }
  ok() { this.ref.close(this.url); }
}

@Component({
  selector: 'app-paste-image-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="paste-dialog">
      <h3>Paste image or link</h3>
      <textarea rows="8" placeholder="Paste here..." (paste)="onPaste($event)" autofocus style="width: 100%;"></textarea>
      <div class="actions" style="display:flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
        <button mat-button (click)="close()">Cancel</button>
      </div>
    </div>
  `
})
export class PasteImageDialogComponent {
  constructor(private ref: MatDialogRef<PasteImageDialogComponent>) {}
  close() { this.ref.close(); }
  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (items && items.length > 0) {
      for (const item of Array.from(items)) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            this.ref.close(file);
            return;
          }
        }
      }
    }
    const text = event.clipboardData?.getData('text');
    if (text) {
      if (text.startsWith('data:image/')) {
        this.ref.close({ base64: text });
      } else if (/^https?:\/\//i.test(text)) {
        this.ref.close({ url: text });
      }
    }
  }
}
