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
import { MatSliderModule } from "@angular/material/slider";
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
    MatSliderModule,
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
              <div class="image-preview" [class.checkerboard]="true">
                <img
                  [src]="frontImageUrl"
                  alt="Front image"
                  crossorigin="anonymous"
                />
              </div>
              <div class="image-actions">
                <button mat-stroked-button (click)="frontFileInput.click()">
                  <mat-icon>upload</mat-icon> Replace
                </button>
                <button
                  mat-stroked-button
                  (click)="removeBackground('front')"
                  [disabled]="isProcessing"
                >
                  <mat-icon>auto_fix_high</mat-icon> Remove BG
                </button>
              </div>
              @if (showBgRemovalControls === "front") {
                <div class="bg-removal-controls">
                  <label>Tolerance: {{ bgTolerance }}</label>
                  <mat-slider min="1" max="100" step="1" discrete>
                    <input matSliderThumb [(ngModel)]="bgTolerance" />
                  </mat-slider>
                  <div class="bg-actions">
                    <button
                      mat-flat-button
                      color="primary"
                      (click)="applyBackgroundRemoval('front')"
                      [disabled]="isProcessing"
                    >
                      {{ isProcessing ? "Processing..." : "Apply" }}
                    </button>
                    <button mat-button (click)="cancelBgRemoval()">
                      Cancel
                    </button>
                  </div>
                </div>
              }
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
              <div class="image-preview" [class.checkerboard]="hasBackImage">
                @if (hasBackImage) {
                  <img
                    [src]="backImageUrl"
                    alt="Back image"
                    crossorigin="anonymous"
                  />
                } @else {
                  <div class="no-image">
                    <mat-icon>image</mat-icon>
                    <span>No back image</span>
                  </div>
                }
              </div>
              <div class="image-actions">
                <button mat-stroked-button (click)="backFileInput.click()">
                  <mat-icon>upload</mat-icon>
                  {{ hasBackImage ? "Replace" : "Add" }}
                </button>
                @if (hasBackImage) {
                  <button
                    mat-stroked-button
                    (click)="removeBackground('back')"
                    [disabled]="isProcessing"
                  >
                    <mat-icon>auto_fix_high</mat-icon> Remove BG
                  </button>
                  <button
                    mat-stroked-button
                    color="warn"
                    (click)="removeBackImage()"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </div>
              @if (showBgRemovalControls === "back") {
                <div class="bg-removal-controls">
                  <label>Tolerance: {{ bgTolerance }}</label>
                  <mat-slider min="1" max="100" step="1" discrete>
                    <input matSliderThumb [(ngModel)]="bgTolerance" />
                  </mat-slider>
                  <div class="bg-actions">
                    <button
                      mat-flat-button
                      color="primary"
                      (click)="applyBackgroundRemoval('back')"
                      [disabled]="isProcessing"
                    >
                      {{ isProcessing ? "Processing..." : "Apply" }}
                    </button>
                    <button mat-button (click)="cancelBgRemoval()">
                      Cancel
                    </button>
                  </div>
                </div>
              }
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

      .image-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .checkerboard {
        background-image:
          linear-gradient(45deg, #3a3a3a 25%, transparent 25%),
          linear-gradient(-45deg, #3a3a3a 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #3a3a3a 75%),
          linear-gradient(-45deg, transparent 75%, #3a3a3a 75%);
        background-size: 16px 16px;
        background-position:
          0 0,
          0 8px,
          8px -8px,
          -8px 0px;
        background-color: #2a2a2a;
      }

      .bg-removal-controls {
        margin-top: 12px;
        padding: 12px;
        background-color: #333;
        border-radius: 8px;

        label {
          display: block;
          font-size: 12px;
          color: #b0b0b0;
          margin-bottom: 4px;
        }

        mat-slider {
          width: 100%;
        }

        .bg-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
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

  // Background removal
  showBgRemovalControls: "front" | "back" | null = null;
  bgTolerance = 50; // Default to middle - allows ~15 RGB difference per channel
  isProcessing = false;
  imageModified = false; // Track if any image was modified
  private originalFrontUrl = "";
  private originalBackUrl = "";

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
            this.imageModified = true;
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
            this.imageModified = true;
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
        this.imageModified = true;
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
        this.imageModified = true;
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
      // Close with true if images were modified to trigger refresh
      this.dialogRef.close(this.imageModified);
    }
  }

  removeBackground(target: "front" | "back"): void {
    // Store original URLs for cancel
    if (target === "front") {
      this.originalFrontUrl = this.frontImageUrl;
    } else {
      this.originalBackUrl = this.backImageUrl;
    }
    this.showBgRemovalControls = target;
  }

  cancelBgRemoval(): void {
    // Restore original URL if needed
    if (this.showBgRemovalControls === "front" && this.originalFrontUrl) {
      this.frontImageUrl = this.originalFrontUrl;
    } else if (this.showBgRemovalControls === "back" && this.originalBackUrl) {
      this.backImageUrl = this.originalBackUrl;
    }
    this.showBgRemovalControls = null;
  }

  applyBackgroundRemoval(target: "front" | "back"): void {
    const imageUrl =
      target === "front" ? this.frontImageUrl : this.backImageUrl;
    this.isProcessing = true;

    this.processBackgroundRemoval(imageUrl, this.bgTolerance)
      .then((resultBase64) => {
        if (!this.data.mini) return;

        const saveMethod =
          target === "front"
            ? this.miniService.setFrontImageFromBase64(
                this.data.mini.id,
                resultBase64,
              )
            : this.miniService.setBackImageFromBase64(
                this.data.mini.id,
                resultBase64,
              );

        saveMethod.subscribe({
          next: () => {
            if (target === "front") {
              this.frontImageUrl = resultBase64;
            } else {
              this.backImageUrl = resultBase64;
            }
            this.showBgRemovalControls = null;
            this.isProcessing = false;
            this.imageModified = true;
            this.snackBar.open("Background removed", "Dismiss", {
              duration: 2000,
            });
          },
          error: () => {
            this.isProcessing = false;
            this.snackBar.open("Failed to save image", "Dismiss", {
              duration: 3000,
            });
          },
        });
      })
      .catch(() => {
        this.isProcessing = false;
        this.snackBar.open("Failed to process image", "Dismiss", {
          duration: 3000,
        });
      });
  }

  private processBackgroundRemoval(
    imageUrl: string,
    tolerance: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Sample background color from corners
          const bgColor = this.sampleBackgroundColor(
            data,
            canvas.width,
            canvas.height,
          );

          // Remove background using flood fill from edges
          this.floodFillEdges(
            data,
            canvas.width,
            canvas.height,
            bgColor,
            tolerance,
          );

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));

      // Handle both URLs and data URLs
      if (imageUrl.startsWith("data:")) {
        img.src = imageUrl;
      } else {
        // Add cache-busting and fetch with CORS
        img.src =
          imageUrl + (imageUrl.includes("?") ? "&" : "?") + "_t=" + Date.now();
      }
    });
  }

  private sampleBackgroundColor(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): [number, number, number] {
    // Sample from all edge pixels to better detect background color
    const colorCounts = new Map<
      string,
      { count: number; r: number; g: number; b: number }
    >();

    // Sample top and bottom edges
    for (let x = 0; x < width; x++) {
      this.addColorSample(data, width, x, 0, colorCounts);
      this.addColorSample(data, width, x, height - 1, colorCounts);
    }
    // Sample left and right edges
    for (let y = 1; y < height - 1; y++) {
      this.addColorSample(data, width, 0, y, colorCounts);
      this.addColorSample(data, width, width - 1, y, colorCounts);
    }

    // Find the most common color (quantized to reduce noise)
    let maxCount = 0;
    let bgColor: [number, number, number] = [255, 255, 255];

    for (const [, value] of colorCounts) {
      if (value.count > maxCount) {
        maxCount = value.count;
        bgColor = [
          Math.round(value.r / value.count),
          Math.round(value.g / value.count),
          Math.round(value.b / value.count),
        ];
      }
    }

    return bgColor;
  }

  private addColorSample(
    data: Uint8ClampedArray,
    width: number,
    x: number,
    y: number,
    colorCounts: Map<
      string,
      { count: number; r: number; g: number; b: number }
    >,
  ): void {
    const i = (y * width + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Quantize color to 8-value buckets to group similar colors
    const qr = Math.floor(r / 32) * 32;
    const qg = Math.floor(g / 32) * 32;
    const qb = Math.floor(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;

    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
      existing.r += r;
      existing.g += g;
      existing.b += b;
    } else {
      colorCounts.set(key, { count: 1, r, g, b });
    }
  }

  private floodFillEdges(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    bgColor: [number, number, number],
    tolerance: number,
  ): void {
    const visited = new Set<number>();
    const stack: [number, number][] = [];

    // Add all edge pixels to starting stack
    for (let x = 0; x < width; x++) {
      stack.push([x, 0]);
      stack.push([x, height - 1]);
    }
    for (let y = 0; y < height; y++) {
      stack.push([0, y]);
      stack.push([width - 1, y]);
    }

    // Scale tolerance: slider 1-100 maps to actual RGB difference of ~0.3 to 30
    // This makes low values very strict (near-exact match only)
    const actualTolerance = tolerance * 0.3;
    const toleranceSq = actualTolerance * actualTolerance * 3;

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = y * width + x;

      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) {
        continue;
      }

      visited.add(key);
      const i = key * 4;

      // Check if this pixel is similar to background color
      const dr = data[i] - bgColor[0];
      const dg = data[i + 1] - bgColor[1];
      const db = data[i + 2] - bgColor[2];
      const distSq = dr * dr + dg * dg + db * db;

      if (distSq <= toleranceSq) {
        // Make transparent
        data[i + 3] = 0;

        // Add neighbors
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }
    }
  }
}
