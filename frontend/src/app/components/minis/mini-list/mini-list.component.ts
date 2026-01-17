import {
  Component,
  OnInit,
  HostListener,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MiniService } from "../../../services/mini.service";
import { Mini } from "../../../models/mini.model";
import { MiniEditDialogComponent } from "./mini-edit-dialog.component";

@Component({
  selector: "app-mini-list",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  templateUrl: "./mini-list.component.html",
  styleUrl: "./mini-list.component.scss",
})
export class MiniListComponent implements OnInit {
  @ViewChild("backFileInput") backFileInput!: ElementRef<HTMLInputElement>;

  minis: Mini[] = [];
  filteredMinis: Mini[] = [];
  searchTerm = "";
  selectedMinis = new Set<string>();
  isLoading = false;
  isDragging = false;

  // For front+back upload flow
  private pendingFrontImage: string | null = null;
  private pendingFileName: string = "";

  constructor(
    private miniService: MiniService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadMinis();
  }

  loadMinis(): void {
    this.isLoading = true;
    this.miniService.getMinis().subscribe({
      next: (minis) => {
        this.minis = minis;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Failed to load minis:", err);
        this.snackBar.open("Failed to load minis", "Dismiss", {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredMinis = [...this.minis];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredMinis = this.minis.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.tags?.some((t) => t.toLowerCase().includes(term)),
      );
    }
  }

  getImageUrl(mini: Mini): string {
    return this.miniService.getFrontImageUrl(mini.id);
  }

  getBackImageUrl(mini: Mini): string {
    return this.miniService.getBackImageUrl(mini.id);
  }

  toggleSelection(mini: Mini): void {
    if (this.selectedMinis.has(mini.id)) {
      this.selectedMinis.delete(mini.id);
    } else {
      this.selectedMinis.add(mini.id);
    }
  }

  isSelected(mini: Mini): boolean {
    return this.selectedMinis.has(mini.id);
  }

  selectAll(): void {
    this.filteredMinis.forEach((m) => this.selectedMinis.add(m.id));
  }

  clearSelection(): void {
    this.selectedMinis.clear();
  }

  deleteSelected(): void {
    if (this.selectedMinis.size === 0) return;

    const ids = Array.from(this.selectedMinis);
    this.miniService.deleteMinis(ids).subscribe({
      next: () => {
        this.snackBar.open(`Deleted ${ids.length} mini(s)`, "Dismiss", {
          duration: 2000,
        });
        this.selectedMinis.clear();
        this.loadMinis();
      },
      error: (err) => {
        console.error("Failed to delete minis:", err);
        this.snackBar.open("Failed to delete minis", "Dismiss", {
          duration: 3000,
        });
      },
    });
  }

  openEditDialog(mini?: Mini): void {
    const dialogRef = this.dialog.open(MiniEditDialogComponent, {
      width: "500px",
      data: { mini },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMinis();
      }
    });
  }

  deleteMini(mini: Mini, event: Event): void {
    event.stopPropagation();
    this.miniService.deleteMini(mini.id).subscribe({
      next: () => {
        this.snackBar.open(`Deleted "${mini.name}"`, "Dismiss", {
          duration: 2000,
        });
        this.loadMinis();
      },
      error: (err) => {
        console.error("Failed to delete mini:", err);
        this.snackBar.open("Failed to delete mini", "Dismiss", {
          duration: 3000,
        });
      },
    });
  }

  @HostListener("paste", ["$event"])
  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          this.createMiniFromFile(file);
        }
        break;
      }
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      this.createMiniFromFile(files[i]);
    }
    input.value = "";
  }

  private createMiniFromFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const name = file.name.replace(/\.[^/.]+$/, "") || "New Mini";
      this.miniService.createMini(name, base64).subscribe({
        next: () => {
          this.snackBar.open(`Created mini "${name}"`, "Dismiss", {
            duration: 2000,
          });
          this.loadMinis();
        },
        error: (err) => {
          console.error("Failed to create mini:", err);
          this.snackBar.open("Failed to create mini", "Dismiss", {
            duration: 3000,
          });
        },
      });
    };
    reader.readAsDataURL(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith("image/")) {
        this.createMiniFromFile(files[i]);
      }
    }
  }

  startFrontBackUpload(): void {
    // Reset state and trigger front image selection
    this.pendingFrontImage = null;
    this.pendingFileName = "";
    // Use the regular file input but we'll handle it differently
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        this.pendingFrontImage = reader.result as string;
        this.pendingFileName = file.name.replace(/\.[^/.]+$/, "") || "New Mini";
        // Now prompt for back image
        setTimeout(() => this.backFileInput.nativeElement.click(), 100);
      };
      reader.readAsDataURL(file);
    };
    fileInput.click();
  }

  onBackFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!this.pendingFrontImage) {
      // No front image pending, just reset
      input.value = "";
      return;
    }

    if (!file) {
      // User cancelled - create mini with just front
      this.miniService
        .createMini(this.pendingFileName, this.pendingFrontImage)
        .subscribe({
          next: () => {
            this.snackBar.open(`Created "${this.pendingFileName}"`, "Dismiss", {
              duration: 2000,
            });
            this.loadMinis();
            this.pendingFrontImage = null;
          },
          error: () => {
            this.snackBar.open("Failed to create mini", "Dismiss", {
              duration: 3000,
            });
            this.pendingFrontImage = null;
          },
        });
      return;
    }

    // Read back image and create mini with both
    const reader = new FileReader();
    reader.onload = () => {
      const backData = reader.result as string;
      this.createMiniWithBothImages(
        this.pendingFrontImage!,
        backData,
        this.pendingFileName,
      );
      this.pendingFrontImage = null;
    };
    reader.readAsDataURL(file);
    input.value = "";
  }

  private createMiniWithBothImages(
    frontData: string,
    backData: string,
    name: string,
  ): void {
    // Create mini with front, then add back
    this.miniService.createMini(name, frontData).subscribe({
      next: (mini) => {
        this.miniService.setBackImageFromBase64(mini.id, backData).subscribe({
          next: () => {
            this.snackBar.open(
              `Created "${name}" with front and back`,
              "Dismiss",
              { duration: 2000 },
            );
            this.loadMinis();
          },
          error: () => {
            this.snackBar.open(
              `Created "${name}", but failed to add back image`,
              "Dismiss",
              { duration: 3000 },
            );
            this.loadMinis();
          },
        });
      },
      error: () => {
        this.snackBar.open("Failed to create mini", "Dismiss", {
          duration: 3000,
        });
      },
    });
  }
}
