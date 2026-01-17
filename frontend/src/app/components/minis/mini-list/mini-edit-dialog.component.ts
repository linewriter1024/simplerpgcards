import { Component, Inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { MatChipInputEvent } from "@angular/material/chips";
import { MiniService } from "../../../services/mini.service";
import { Mini } from "../../../models/mini.model";

export interface MiniEditDialogData {
  mini?: Mini;
}

@Component({
  selector: "app-mini-edit-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? "Edit Mini" : "Create Mini" }}</h2>
    <mat-dialog-content>
      <div class="form-content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="name" placeholder="Mini name" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tags</mat-label>
          <mat-chip-grid #chipGrid>
            @for (tag of tags; track tag) {
              <mat-chip-row (removed)="removeTag(tag)">
                {{ tag }}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip-row>
            }
            <input
              placeholder="Add tag..."
              [matChipInputFor]="chipGrid"
              [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
              (matChipInputTokenEnd)="addTag($event)"
            />
          </mat-chip-grid>
        </mat-form-field>

        @if (isEdit) {
          <div class="image-sections">
            <div class="image-section">
              <h4>Front Image</h4>
              <div class="image-preview">
                <img [src]="frontImageUrl" alt="Front image" />
              </div>
              <button mat-stroked-button (click)="frontFileInput.click()">
                <mat-icon>upload</mat-icon> Replace
              </button>
              <input
                #frontFileInput
                type="file"
                accept="image/*"
                hidden
                (change)="onFrontImageSelect($event)"
              />
            </div>

            @if (hasBackImage) {
              <button
                mat-stroked-button
                class="swap-btn"
                (click)="swapImages()"
              >
                <mat-icon>swap_horiz</mat-icon>
                Swap Front &amp; Back
              </button>
            }

            <div class="image-section">
              <h4>Back Image (Optional)</h4>
              <div class="image-preview">
                @if (hasBackImage) {
                  <img [src]="backImageUrl" alt="Back image" />
                } @else {
                  <div class="no-image">
                    <mat-icon>image</mat-icon>
                    <span>No back image</span>
                  </div>
                }
              </div>
              <div class="back-actions">
                <button mat-stroked-button (click)="backFileInput.click()">
                  <mat-icon>upload</mat-icon>
                  {{ hasBackImage ? "Replace" : "Add" }}
                </button>
                @if (hasBackImage) {
                  <button
                    mat-stroked-button
                    color="warn"
                    (click)="removeBackImage()"
                  >
                    <mat-icon>delete</mat-icon> Remove
                  </button>
                }
              </div>
              <input
                #backFileInput
                type="file"
                accept="image/*"
                hidden
                (change)="onBackImageSelect($event)"
              />
            </div>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="save()"
        [disabled]="isSaving"
      >
        {{ isSaving ? "Saving..." : "Save" }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form-content {
        min-width: 400px;
      }

      .full-width {
        width: 100%;
      }

      .image-sections {
        display: flex;
        gap: 24px;
        margin-top: 16px;
      }

      .image-section {
        flex: 1;

        h4 {
          margin: 0 0 8px 0;
          color: #b0b0b0;
          font-size: 14px;
        }
      }

      .image-preview {
        width: 100%;
        height: 150px;
        background-color: #2a2a2a;
        border: 1px solid #404040;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin-bottom: 8px;

        img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .no-image {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #666;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
          }

          span {
            font-size: 12px;
          }
        }
      }

      .back-actions {
        display: flex;
        gap: 8px;
      }

      .swap-btn {
        width: 100%;
        margin-bottom: 16px;
      }
    `,
  ],
})
export class MiniEditDialogComponent implements OnInit {
  name = "";
  tags: string[] = [];
  separatorKeyCodes = [ENTER, COMMA];
  isEdit = false;
  isSaving = false;
  hasBackImage = false;
  frontImageUrl = "";
  backImageUrl = "";

  constructor(
    private dialogRef: MatDialogRef<MiniEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MiniEditDialogData,
    private miniService: MiniService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    if (this.data.mini) {
      this.isEdit = true;
      this.name = this.data.mini.name;
      this.tags = [...(this.data.mini.tags || [])];
      this.hasBackImage = this.data.mini.hasBackImage;
      this.frontImageUrl = this.miniService.getFrontImageUrl(this.data.mini.id);
      this.backImageUrl = this.miniService.getBackImageUrl(this.data.mini.id);
    }
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || "").trim();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  onFrontImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.data.mini) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.miniService
        .setFrontImageFromBase64(this.data.mini!.id, base64)
        .subscribe({
          next: () => {
            this.frontImageUrl = base64;
            this.snackBar.open("Front image updated", "Dismiss", {
              duration: 2000,
            });
          },
          error: () => {
            this.snackBar.open("Failed to update image", "Dismiss", {
              duration: 3000,
            });
          },
        });
    };
    reader.readAsDataURL(file);
    input.value = "";
  }

  onBackImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.data.mini) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.miniService
        .setBackImageFromBase64(this.data.mini!.id, base64)
        .subscribe({
          next: () => {
            this.backImageUrl = base64;
            this.hasBackImage = true;
            this.snackBar.open("Back image added", "Dismiss", {
              duration: 2000,
            });
          },
          error: () => {
            this.snackBar.open("Failed to add back image", "Dismiss", {
              duration: 3000,
            });
          },
        });
    };
    reader.readAsDataURL(file);
    input.value = "";
  }

  removeBackImage(): void {
    if (!this.data.mini) return;
    this.miniService.deleteBackImage(this.data.mini.id).subscribe({
      next: () => {
        this.hasBackImage = false;
        this.snackBar.open("Back image removed", "Dismiss", { duration: 2000 });
      },
      error: () => {
        this.snackBar.open("Failed to remove back image", "Dismiss", {
          duration: 3000,
        });
      },
    });
  }

  swapImages(): void {
    if (!this.data.mini) return;
    this.miniService.swapImages(this.data.mini.id).subscribe({
      next: () => {
        // Swap the displayed URLs by adding cache-busting param
        const timestamp = Date.now();
        this.frontImageUrl =
          this.miniService.getFrontImageUrl(this.data.mini!.id) +
          "?t=" +
          timestamp;
        this.backImageUrl =
          this.miniService.getBackImageUrl(this.data.mini!.id) +
          "?t=" +
          timestamp;
        this.snackBar.open("Images swapped", "Dismiss", { duration: 2000 });
      },
      error: () => {
        this.snackBar.open("Failed to swap images", "Dismiss", {
          duration: 3000,
        });
      },
    });
  }

  save(): void {
    if (!this.name.trim()) {
      this.snackBar.open("Name is required", "Dismiss", { duration: 3000 });
      return;
    }

    this.isSaving = true;

    if (this.isEdit && this.data.mini) {
      this.miniService
        .updateMini(this.data.mini.id, {
          name: this.name.trim(),
          tags: this.tags,
        })
        .subscribe({
          next: () => {
            this.dialogRef.close(true);
          },
          error: () => {
            this.snackBar.open("Failed to update mini", "Dismiss", {
              duration: 3000,
            });
            this.isSaving = false;
          },
        });
    } else {
      this.dialogRef.close(true);
    }
  }
}
