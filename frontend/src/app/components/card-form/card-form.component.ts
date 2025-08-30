import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CardService } from '../../services/card.service';
import { Card, CreateCardDto } from '../../models/card.model';

@Component({
  selector: 'app-card-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './card-form.component.html',
  styleUrl: './card-form.component.scss'
})
export class CardFormComponent implements OnInit {
  cardForm: FormGroup;
  categories: string[] = [];
  levels: string[] = [];
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private cardService: CardService,
    private dialogRef: MatDialogRef<CardFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { card?: Card }
  ) {
    this.isEditing = !!data?.card;
    this.cardForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadLevels();
    
    if (this.isEditing && this.data.card) {
      this.cardForm.patchValue(this.data.card);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      frontText: [''],
      backText: [''],
      category: [''],
      level: [''],
      range: [''],
      duration: [''],
      notes: ['']
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

  onSubmit(): void {
    if (this.cardForm.valid) {
      const cardData: CreateCardDto = this.cardForm.value;
      
      if (this.isEditing) {
        this.cardService.updateCard(this.data.card!.id!, cardData).subscribe(card => {
          this.dialogRef.close(card);
        });
      } else {
        this.cardService.createCard(cardData).subscribe(card => {
          this.dialogRef.close(card);
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Preview methods for real-time preview
  getPreviewFront(): string {
    const title = this.cardForm.get('title')?.value || 'Card Title';
    const frontText = this.cardForm.get('frontText')?.value || '';
    return `${title.toUpperCase()}\n${frontText.toUpperCase()}`;
  }

  getPreviewBack(): string {
    const title = this.cardForm.get('title')?.value || 'Card Title';
    const backText = this.cardForm.get('backText')?.value || '';
    return `${title.toUpperCase()}\n${backText.toUpperCase()}`;
  }
}
