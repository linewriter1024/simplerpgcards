import { Component, OnInit, OnDestroy, Inject, ViewChild, AfterViewInit, ElementRef } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { CardService } from '../../services/card.service';
import { Card, CreateCardDto } from '../../models/card.model';

@Component({
    selector: 'app-card-form',
    imports: [
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
],
    templateUrl: './card-form.component.html',
    styleUrl: './card-form.component.scss'
})
export class CardFormComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;
  cardForm: FormGroup;
  allTags: string[] = [];
  isEditing = false;
  isBulkAddEnabled = false; // Separate property for bulk-add checkbox
  previewPdfUrl: SafeResourceUrl | null = null;
  private currentBlobUrl: string | null = null;
  private subscription = new Subscription();
  private onCardSaved?: (card: Card) => void; // Callback for when card is saved

  constructor(
    private fb: FormBuilder,
    private cardService: CardService,
    private dialogRef: MatDialogRef<CardFormComponent>,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: { card?: Card, bulkAddData?: any, onCardSaved?: (card: Card) => void }
  ) {
    this.isEditing = !!data?.card;
    this.cardForm = this.createForm();
    this.onCardSaved = data?.onCardSaved;
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
    } else if (this.data.bulkAddData) {
      // Pre-fill form for bulk add mode (everything except title)
      this.cardForm.patchValue({
        title: '', // Keep title empty for bulk add
        frontText: this.data.bulkAddData.frontText || '',
        backText: this.data.bulkAddData.backText || '',
        tags: this.data.bulkAddData.tags || ''
      });
      this.isBulkAddEnabled = this.data.bulkAddData.bulkAdd || false;
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

  ngAfterViewInit(): void {
    // Focus the title input after the view initializes
    // Use a longer delay to ensure dialog focus management has completed
    setTimeout(() => {
      if (this.titleInput && this.titleInput.nativeElement) {
        this.titleInput.nativeElement.focus();
      }
    }, 300);
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
          // Notify parent component about the card save
          if (this.onCardSaved) {
            this.onCardSaved(card);
          }
          
          if (this.isBulkAddEnabled) {
            // For bulk add in edit mode, reset form for new card creation
            this.switchToBulkAddMode(tagsString, cardData.frontText || '', cardData.backText || '');
          } else {
            this.dialogRef.close(card);
          }
        });
      } else {
        this.cardService.createCard(cardData).subscribe(card => {
          // Notify parent component about the card save
          if (this.onCardSaved) {
            this.onCardSaved(card);
          }
          
          if (this.isBulkAddEnabled) {
            // For bulk add, reset form for next card
            this.resetFormForBulkAdd(tagsString, cardData.frontText || '', cardData.backText || '');
          } else {
            this.dialogRef.close(card);
          }
        });
      }
    }
  }

  private switchToBulkAddMode(tags: string, frontText: string, backText: string): void {
    // Switch from edit mode to create mode
    this.isEditing = false;
    this.data.card = undefined;
    
    // Reset form for new card creation
    this.resetFormForBulkAdd(tags, frontText, backText);
  }

  private resetFormForBulkAdd(tags: string, frontText: string, backText: string): void {
    // Keep everything except title, and ensure bulk-add stays enabled
    this.cardForm.patchValue({
      title: '',
      frontText: frontText,
      backText: backText,
      tags: tags
    });
    this.isBulkAddEnabled = true;
    
    // Focus the title input for the next card
    setTimeout(() => {
      if (this.titleInput && this.titleInput.nativeElement) {
        this.titleInput.nativeElement.focus();
      }
    }, 100);
    
    // Update the preview
    this.updatePreview();
  }

  onCancel(): void {
    // Clean up blob URL
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
    this.dialogRef.close();
  }

  onKeyDown(event: KeyboardEvent): void {
    // Handle Ctrl+Enter to submit the form
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.onSubmit();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
  }
}
