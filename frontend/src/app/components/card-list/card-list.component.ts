import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CardService } from '../../services/card.service';
import { Card, CardFilter } from '../../models/card.model';
import { SelectionModel } from '@angular/cdk/collections';
import { CardFormComponent } from '../card-form/card-form.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-card-list',
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatCardModule,
        MatToolbarModule,
        MatChipsModule,
        MatSortModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule
    ],
    templateUrl: './card-list.component.html',
    styleUrl: './card-list.component.scss'
})
export class CardListComponent implements OnInit {
  cards: Card[] = [];
  filteredCards: Card[] = [];
  allTags: string[] = [];
  searchControl = new FormControl('');
  selection = new SelectionModel<Card>(true, []);
  sortBy: 'title' | 'createdAt' = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  displayedColumns: string[] = ['select', 'title', 'tags', 'createdAt', 'actions'];

  constructor(private cardService: CardService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadCards();
    this.loadTags();
    
    // Real-time search
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.applyFilters();
    });
  }

  loadCards(): void {
    this.cardService.getAllCards().subscribe(cards => {
      this.cards = cards;
      this.applyFilters();
    });
  }

  loadTags(): void {
    this.cardService.getTags().subscribe(tags => {
      this.allTags = tags;
    });
  }

  applyFilters(): void {
    let filtered = [...this.cards];
    
    // Apply search filter - enhanced to support title and tag searching
    const searchTerm = this.searchControl.value?.toLowerCase().trim();
    if (searchTerm) {
      // Parse search terms - support quotes for exact matching
      const searchTerms = this.parseSearchTerms(searchTerm);
      
      filtered = filtered.filter(card => {
        return searchTerms.some(term => {
          // Search in title
          if (card.title.toLowerCase().includes(term.toLowerCase())) {
            return true;
          }
          
          // Search in tags
          if (card.tags && card.tags.length > 0) {
            return card.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase()));
          }
          
          return false;
        });
      });
    }
    
    // Note: Tag filtering is now handled through search functionality
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (this.sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (this.sortBy === 'createdAt') {
        const dateA = new Date(a.createdAt!).getTime();
        const dateB = new Date(b.createdAt!).getTime();
        comparison = dateB - dateA; // Newest first by default
      }
      
      return this.sortDirection === 'desc' ? comparison : -comparison;
    });
    
    this.filteredCards = filtered;
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

  setSortBy(field: 'title' | 'createdAt'): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = field === 'createdAt' ? 'desc' : 'asc';
    }
    this.applyFilters();
  }

  isAllSelected(): boolean {
    const numSelectedInFiltered = this.selection.selected.filter(card => 
      this.filteredCards.includes(card)
    ).length;
    const numFilteredRows = this.filteredCards.length;
    return numFilteredRows > 0 && numSelectedInFiltered === numFilteredRows;
  }

  isIndeterminate(): boolean {
    const numSelectedInFiltered = this.selection.selected.filter(card => 
      this.filteredCards.includes(card)
    ).length;
    const numFilteredRows = this.filteredCards.length;
    return numSelectedInFiltered > 0 && numSelectedInFiltered < numFilteredRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      // Deselect only the currently filtered cards
      this.filteredCards.forEach(card => this.selection.deselect(card));
    } else {
      // Select all currently filtered cards (preserving existing selections outside filter)
      this.selection.select(...this.filteredCards);
    }
  }

  toggleRowSelection(row: Card): void {
    this.selection.toggle(row);
  }

  editCard(card: Card): void {
    const dialogRef = this.dialog.open(CardFormComponent, {
      width: '100vw',
      maxWidth: '100vw',
      maxHeight: '95vh',
      panelClass: 'fullscreen-width-dialog',
      data: { 
        card,
        onCardSaved: (savedCard: any) => {
          // Refresh the list whenever a card is saved, even in bulk-add mode
          this.loadCards();
          this.loadTags();
        }
      }
    });

    // Focus the title input after the dialog has fully opened
    dialogRef.afterOpened().subscribe(() => {
      const titleInput = dialogRef.componentInstance.titleInput;
      if (titleInput) {
        setTimeout(() => {
          titleInput.nativeElement.focus();
        }, 50);
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Final refresh when dialog closes (for non-bulk-add cases)
        this.loadCards();
        this.loadTags();
      }
    });
  }

  createCard(): void {
    const dialogRef = this.dialog.open(CardFormComponent, {
      width: '100vw',
      maxWidth: '100vw',
      maxHeight: '95vh',
      panelClass: 'fullscreen-width-dialog',
      data: { 
        onCardSaved: (card: any) => {
          // Refresh the list whenever a card is saved, even in bulk-add mode
          this.loadCards();
          this.loadTags();
        }
      }
    });

    // Focus the title input after the dialog has fully opened
    dialogRef.afterOpened().subscribe(() => {
      const titleInput = dialogRef.componentInstance.titleInput;
      if (titleInput) {
        setTimeout(() => {
          titleInput.nativeElement.focus();
        }, 50);
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCards();
        this.loadTags(); // Refresh tags in case new ones were added
        // No need to handle bulk-add here anymore - it's handled within the dialog
      }
    });
  }

  deleteCard(card: Card): void {
    if (confirm(`Delete card "${card.title}"?`)) {
      this.cardService.deleteCard(card.id!).subscribe(() => {
        this.loadCards();
        this.loadTags(); // Refresh tags
      });
    }
  }

  deleteAllSelected(): void {
    const selectedCards = this.selection.selected;
    if (selectedCards.length === 0) {
      return;
    }

    const count = selectedCards.length;
    const message = count === 1 
      ? `Delete the selected card "${selectedCards[0].title}"?`
      : `Delete all ${count} selected cards?`;

    if (confirm(message)) {
      // Delete all selected cards
      const deletePromises = selectedCards.map(card => 
        this.cardService.deleteCard(card.id!).toPromise()
      );

      Promise.all(deletePromises).then(() => {
        this.selection.clear(); // Clear selection
        this.loadCards(); // Refresh the list
        this.loadTags(); // Refresh tags
      }).catch(error => {
        console.error('Error deleting cards:', error);
        alert('Error deleting some cards. Please try again.');
      });
    }
  }

  generatePdf(): void {
    const selectedCardIds = this.selection.selected.map(card => card.id!);
    if (selectedCardIds.length === 0) {
      alert('Please select at least one card');
      return;
    }

    const options = {
      cardIds: selectedCardIds,
      duplex: 'long' as const,
      titleSize: 48,
      bodySize: 36,
      marginMm: 4.0
    };

    this.cardService.generatePdf(options).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'rpg-cards.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
