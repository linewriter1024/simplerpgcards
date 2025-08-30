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
  standalone: true,
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
  selectedTags: string[] = [];
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
    
    // Apply search filter
    const searchTerm = this.searchControl.value?.toLowerCase().trim();
    if (searchTerm) {
      filtered = filtered.filter(card =>
        card.title.toLowerCase().includes(searchTerm) ||
        card.frontText?.toLowerCase().includes(searchTerm) ||
        card.backText?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply tag filter
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(card => {
        if (!card.tags || card.tags.length === 0) return false;
        return this.selectedTags.every(tag => 
          card.tags!.some(cardTag => cardTag.toLowerCase().includes(tag.toLowerCase()))
        );
      });
    }
    
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
    this.selectedTags = [];
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
    const numSelected = this.selection.selected.length;
    const numRows = this.filteredCards.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.filteredCards);
  }

  editCard(card: Card): void {
    const dialogRef = this.dialog.open(CardFormComponent, {
      width: '1200px', // Increased from 1000px to accommodate larger preview cards
      maxHeight: '95vh', // Increased from 90vh
      data: { card }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCards();
        this.loadTags(); // Refresh tags in case new ones were added
      }
    });
  }

  createCard(): void {
    const dialogRef = this.dialog.open(CardFormComponent, {
      width: '1200px', // Increased from 1000px to accommodate larger preview cards
      maxHeight: '95vh', // Increased from 90vh
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCards();
        this.loadTags(); // Refresh tags in case new ones were added
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

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.cardService.importCards(file).subscribe(result => {
        alert(result.message);
        this.loadCards();
        this.loadTags();
      });
    }
  }
}
