import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
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
export class CardFormComponent implements OnInit, OnDestroy {
  cardForm: FormGroup;
  allTags: string[] = [];
  isEditing = false;
  previewPdfUrl: SafeResourceUrl | null = null;
  private currentBlobUrl: string | null = null;
  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private cardService: CardService,
    private dialogRef: MatDialogRef<CardFormComponent>,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: { card?: Card }
  ) {
    this.isEditing = !!data?.card;
    this.cardForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadTags();
    
    if (this.isEditing && this.data.card) {
      this.cardForm.patchValue({
        title: this.data.card.title,
        frontText: this.data.card.frontText,
        backText: this.data.card.backText,
        tags: this.data.card.tags ? this.data.card.tags.join(' ') : ''
      });
    }
    
    // Generate initial preview
    this.updatePreview();
    
    // Update preview when form changes
    this.subscription.add(
      this.cardForm.valueChanges.subscribe(() => {
        this.updatePreview();
      })
    );
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      frontText: [''],
      backText: [''],
      tags: [''] // Simple text field for tags
    });
  }

  loadTags(): void {
    this.cardService.getTags().subscribe(tags => {
      this.allTags = tags;
    });
  }

  updatePreview(): void {
    const tagsString = this.cardForm.get('tags')?.value || '';
    const tagsArray = tagsString.split(/\s+/).filter((tag: string) => tag.trim().length > 0);
    
    const cardData: CreateCardDto = {
      title: this.cardForm.get('title')?.value || '',
      frontText: this.cardForm.get('frontText')?.value || '',
      backText: this.cardForm.get('backText')?.value || '',
      tags: tagsArray
    };
    
    // Only generate preview if there's content
    if (cardData.title || cardData.frontText || cardData.backText) {
      this.subscription.add(
        this.cardService.generatePreviewPdf(cardData).subscribe(blob => {
          // Clean up previous URL
          if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
          }
          
          // Create new blob URL
          this.currentBlobUrl = URL.createObjectURL(blob);
          this.previewPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentBlobUrl);
        })
      );
    }
  }

  onSubmit(): void {
    if (this.cardForm.valid) {
      const tagsString = this.cardForm.get('tags')?.value || '';
      const tagsArray = tagsString.split(/\s+/).filter((tag: string) => tag.trim().length > 0);
      
      const cardData: CreateCardDto = {
        title: this.cardForm.get('title')?.value,
        frontText: this.cardForm.get('frontText')?.value,
        backText: this.cardForm.get('backText')?.value,
        tags: tagsArray
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
    // Clean up blob URL
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
  }
}
