import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
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
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './card-form.component.html',
  styleUrl: './card-form.component.scss'
})
export class CardFormComponent implements OnInit {
  cardForm: FormGroup;
  allTags: string[] = [];
  selectedTags: string[] = [];
  isEditing = false;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

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
    this.loadTags();
    
    if (this.isEditing && this.data.card) {
      this.cardForm.patchValue(this.data.card);
      this.selectedTags = this.data.card.tags || [];
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      frontText: [''],
      backText: [''],
      tagInput: [''] // For tag input
    });
  }

  loadTags(): void {
    this.cardService.getTags().subscribe(tags => {
      this.allTags = tags;
    });
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    
    if (value) {
      // Parse tag input - support space-separated or comma-separated tags
      const tags = value.split(/[,\s]+/).filter(tag => tag.trim().length > 0);
      
      tags.forEach(tag => {
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag && !this.selectedTags.includes(normalizedTag)) {
          this.selectedTags.push(normalizedTag);
        }
      });
    }

    // Clear the input value
    event.chipInput!.clear();
    this.cardForm.get('tagInput')?.setValue('');
  }

  removeTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.cardForm.valid) {
      const cardData: CreateCardDto = {
        title: this.cardForm.get('title')?.value,
        frontText: this.cardForm.get('frontText')?.value,
        backText: this.cardForm.get('backText')?.value,
        tags: this.selectedTags
      };
      
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
}
