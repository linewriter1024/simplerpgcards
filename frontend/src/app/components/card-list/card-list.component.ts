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
import { MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardService } from '../../services/card.service';
import { Card, CardFilter } from '../../models/card.model';
import { SelectionModel } from '@angular/cdk/collections';
import { CardFormComponent } from '../card-form/card-form.component';

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
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './card-list.component.html',
  styleUrl: './card-list.component.scss'
})
export class CardListComponent implements OnInit {
  cards: Card[] = [];
  filteredCards: Card[] = [];
  categories: string[] = [];
  levels: string[] = [];
  filter: CardFilter = {};
  selection = new SelectionModel<Card>(true, []);
  
  displayedColumns: string[] = ['select', 'title', 'category', 'level', 'actions'];

  constructor(private cardService: CardService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadCards();
    this.loadCategories();
    this.loadLevels();
  }

  loadCards(): void {
    this.cardService.getAllCards(this.filter).subscribe(cards => {
      this.cards = cards;
      this.filteredCards = cards;
    });
  }

  loadCategories(): void {
    this.cardService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  loadLevels(): void {
    this.cardService.getLevels().subscribe(levels => {
      this.levels = levels;
    });
  }

  applyFilter(): void {
    this.loadCards();
  }

  clearFilter(): void {
    this.filter = {};
    this.loadCards();
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
      width: '800px',
      data: { card }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCards();
      }
    });
  }

  createCard(): void {
    const dialogRef = this.dialog.open(CardFormComponent, {
      width: '800px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCards();
      }
    });
  }

  deleteCard(card: Card): void {
    if (confirm(`Delete card "${card.title}"?`)) {
      this.cardService.deleteCard(card.id!).subscribe(() => {
        this.loadCards();
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
      titleSize: 26,
      bodySize: 18,
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
      });
    }
  }
}
