import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSliderModule } from "@angular/material/slider";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatMenuModule } from "@angular/material/menu";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { MiniService } from "../../../services/mini.service";
import {
  Mini,
  MiniSheet,
  MiniPlacement,
  SheetSettings,
  DEFAULT_SHEET_SETTINGS,
  DEFAULT_MINI_WIDTH,
  DEFAULT_MINI_HEIGHT,
  MINI_SIZES,
  PAPER_SIZE,
} from "../../../models/mini.model";
import { MiniPrintPreviewComponent } from "./mini-print-preview.component";

@Component({
  selector: "app-mini-sheet-editor",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: "./mini-sheet-editor.component.html",
  styleUrl: "./mini-sheet-editor.component.scss",
})
export class MiniSheetEditorComponent implements OnInit, OnDestroy {
  @ViewChild("sheetCanvas") sheetCanvas!: ElementRef<HTMLDivElement>;
  @ViewChild("frontImageInput") frontImageInput!: ElementRef<HTMLInputElement>;
  @ViewChild("backImageInput") backImageInput!: ElementRef<HTMLInputElement>;

  sheets: MiniSheet[] = [];
  currentSheet: MiniSheet | null = null;
  minis: Mini[] = [];
  filteredMinis: Mini[] = [];

  settings: SheetSettings = { ...DEFAULT_SHEET_SETTINGS };
  placements: MiniPlacement[] = [];

  // Editor state
  selectedPlacementId: string | null = null;
  draggedMini: Mini | null = null;
  isDraggingPlacement = false;
  isDraggingToLibrary = false;
  dragOffset = { x: 0, y: 0 };

  // Search
  miniSearch = "";

  // Collapsible sections
  collapsedSections = {
    addMini: true, // Start collapsed
    library: false,
    properties: false,
    settings: true, // Start collapsed
  };

  // Constants
  miniSizes = MINI_SIZES;
  paperSize = PAPER_SIZE;

  // Scale for display (pixels per inch)
  displayScale = 96; // Standard screen DPI

  // Current placement size when adding new minis (in inches)
  currentMiniSize = DEFAULT_MINI_WIDTH;

  // Text editing
  editingTextId: string | null = null;

  // Auto-save
  hasUnsavedChanges = false;
  private autoSaveSubject = new Subject<void>();

  // For front+back upload flow
  private pendingFrontImage: string | null = null;

  // Cache for original image dimensions (in pixels)
  private imageSizeCache = new Map<string, { width: number; height: number }>();

  constructor(
    private miniService: MiniService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadMinis();
    this.loadSheets();

    // Set up auto-save with debounce
    this.autoSaveSubject
      .pipe(
        debounceTime(1500), // Wait 1.5 seconds after last change
      )
      .subscribe(() => {
        this.performAutoSave();
      });
  }

  ngOnDestroy(): void {
    this.autoSaveSubject.complete();
  }

  scheduleAutoSave(): void {
    this.hasUnsavedChanges = true;
    this.autoSaveSubject.next();
  }

  private performAutoSave(): void {
    if (!this.currentSheet?.id || !this.hasUnsavedChanges) return;

    this.miniService
      .updateSheet(this.currentSheet.id, {
        name: this.currentSheet.name,
        code: this.currentSheet.code,
        placements: this.placements,
        settings: this.settings,
      })
      .subscribe({
        next: (sheet) => {
          this.currentSheet = sheet;
          const index = this.sheets.findIndex((s) => s.id === sheet.id);
          if (index >= 0) {
            this.sheets[index] = sheet;
          }
          this.hasUnsavedChanges = false;
        },
        error: () => {
          this.snackBar.open("Auto-save failed", "Dismiss", { duration: 3000 });
        },
      });
  }

  loadMinis(): void {
    this.miniService.getMinis().subscribe({
      next: (minis) => {
        this.minis = minis;
        this.filterMinis();
      },
      error: (err) => {
        console.error("Failed to load minis:", err);
      },
    });
  }

  filterMinis(): void {
    if (!this.miniSearch.trim()) {
      this.filteredMinis = this.minis;
      return;
    }

    const search = this.miniSearch.toLowerCase();
    this.filteredMinis = this.minis.filter((mini) => {
      const nameMatch = mini.name.toLowerCase().includes(search);
      const tagMatch = mini.tags?.some((tag) =>
        tag.toLowerCase().includes(search),
      );
      return nameMatch || tagMatch;
    });
  }

  toggleSection(
    section: "addMini" | "library" | "properties" | "settings",
  ): void {
    this.collapsedSections[section] = !this.collapsedSections[section];
  }

  loadSheets(): void {
    this.miniService.getSheets().subscribe({
      next: (sheets) => {
        this.sheets = sheets;
      },
      error: (err) => {
        console.error("Failed to load sheets:", err);
      },
    });
  }

  createNewSheet(): void {
    const name = `Sheet ${this.sheets.length + 1}`;
    this.miniService
      .createSheet({ name, settings: DEFAULT_SHEET_SETTINGS })
      .subscribe({
        next: (sheet) => {
          this.sheets.unshift(sheet);
          this.selectSheet(sheet);
          this.snackBar.open("Created new sheet", "Dismiss", {
            duration: 2000,
          });
        },
        error: () => {
          this.snackBar.open("Failed to create sheet", "Dismiss", {
            duration: 3000,
          });
        },
      });
  }

  selectSheet(sheet: MiniSheet): void {
    // Ensure code is initialized
    if (sheet.code === undefined) {
      sheet.code = "";
    }
    this.currentSheet = sheet;
    this.settings = { ...sheet.settings };
    this.placements = [...sheet.placements];
    this.selectedPlacementId = null;
  }

  deleteSheet(sheet: MiniSheet, event: Event): void {
    event.stopPropagation();

    if (!confirm(`Delete sheet "${sheet.name}"? This cannot be undone.`)) {
      return;
    }

    this.miniService.deleteSheet(sheet.id!).subscribe({
      next: () => {
        this.sheets = this.sheets.filter((s) => s.id !== sheet.id);
        if (this.currentSheet?.id === sheet.id) {
          this.currentSheet = null;
          this.placements = [];
        }
        this.snackBar.open("Deleted sheet", "Dismiss", { duration: 2000 });
      },
      error: () => {
        this.snackBar.open("Failed to delete sheet", "Dismiss", {
          duration: 3000,
        });
      },
    });
  }

  saveCurrentSheet(): void {
    if (!this.currentSheet?.id) return;

    this.miniService
      .updateSheet(this.currentSheet.id, {
        name: this.currentSheet.name,
        placements: this.placements,
        settings: this.settings,
      })
      .subscribe({
        next: (sheet) => {
          this.currentSheet = sheet;
          const index = this.sheets.findIndex((s) => s.id === sheet.id);
          if (index >= 0) {
            this.sheets[index] = sheet;
          }
          this.snackBar.open("Sheet saved", "Dismiss", { duration: 2000 });
        },
        error: () => {
          this.snackBar.open("Failed to save sheet", "Dismiss", {
            duration: 3000,
          });
        },
      });
  }

  // Mini library drag start
  onMiniDragStart(event: DragEvent, mini: Mini): void {
    this.draggedMini = mini;
    event.dataTransfer!.effectAllowed = "copy";
    event.dataTransfer!.setData("text/plain", mini.id);
  }

  onMiniDragEnd(): void {
    this.draggedMini = null;
  }

  // Sheet canvas drop
  onSheetDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = "copy";
  }

  onSheetDrop(event: DragEvent): void {
    event.preventDefault();
    if (!this.draggedMini || !this.currentSheet) return;

    const rect = this.sheetCanvas.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) / this.displayScale;
    const y = (event.clientY - rect.top) / this.displayScale;

    this.addPlacement(this.draggedMini.id, x, y);
    this.draggedMini = null;
  }

  addPlacement(miniId: string, x: number, y: number): void {
    // Snap to grid if enabled
    if (this.settings.gridSnap > 0) {
      x = Math.round(x / this.settings.gridSnap) * this.settings.gridSnap;
      y = Math.round(y / this.settings.gridSnap) * this.settings.gridSnap;
    }

    // Clamp within printable area
    const width = this.currentMiniSize;
    const height = this.currentMiniSize;
    const maxX = this.settings.pageWidth - this.settings.marginRight - width;
    const maxY = this.settings.pageHeight - this.settings.marginBottom - height;
    const minX = this.settings.marginLeft;
    const minY = this.settings.marginTop;

    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));

    // Generate default label - letter based on mini type, number increments
    const defaultLabel = this.getNextLabel(miniId);

    const placement: MiniPlacement = {
      id: this.generateId(),
      miniId,
      x,
      y,
      width,
      height,
      text: defaultLabel,
      textPosition: "bottom",
      backMode: "none",
    };

    this.placements.push(placement);
    this.selectedPlacementId = placement.id;
    this.scheduleAutoSave();
  }

  private getNextLabel(miniId: string): string {
    // Use *** as placeholder for sheet code - replaced dynamically at display/print time
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Build a map of miniId -> letter assignment
    const miniIdToLetter = new Map<string, string>();
    let nextLetterIdx = 0;

    // Collect used labels per mini type
    const usedNumbersByMini = new Map<string, Set<number>>();

    for (const p of this.placements) {
      if (!miniIdToLetter.has(p.miniId) && nextLetterIdx < letters.length) {
        miniIdToLetter.set(p.miniId, letters[nextLetterIdx++]);
      }

      // Track which numbers are used for this mini's letter
      if (p.text) {
        const match = p.text.match(/\*\*\* ([A-Z]+)(\d+)/);
        if (match) {
          const letter = match[1];
          const num = parseInt(match[2], 10);
          if (!usedNumbersByMini.has(letter)) {
            usedNumbersByMini.set(letter, new Set());
          }
          usedNumbersByMini.get(letter)!.add(num);
        }
      }
    }

    // Get or assign letter for this mini type
    let letter = miniIdToLetter.get(miniId);
    if (!letter) {
      letter = nextLetterIdx < letters.length ? letters[nextLetterIdx] : "Z";
    }

    // Find next available number for this letter
    const usedNumbers = usedNumbersByMini.get(letter) || new Set();
    let num = 1;
    while (usedNumbers.has(num) && num <= 99) {
      num++;
    }

    return `*** ${letter}${num}`;
  }

  private countLabels(label: string): number {
    return this.placements.filter((p) => p.text === label).length;
  }

  // Replace *** placeholder with actual sheet code for display
  getDisplayLabel(text: string | undefined): string {
    if (!text) return "";
    const code = this.currentSheet?.code || "";
    if (code) {
      return text.replace(/\*\*\*/, code);
    } else {
      // Remove "*** " prefix if no code
      return text.replace(/\*\*\* /, "");
    }
  }

  // Placement interaction
  onPlacementMouseDown(event: MouseEvent, placement: MiniPlacement): void {
    event.preventDefault();
    event.stopPropagation();

    this.selectedPlacementId = placement.id;
    this.isDraggingPlacement = true;

    const rect = this.sheetCanvas.nativeElement.getBoundingClientRect();
    const currentX = placement.x * this.displayScale;
    const currentY = placement.y * this.displayScale;

    this.dragOffset = {
      x: event.clientX - rect.left - currentX,
      y: event.clientY - rect.top - currentY,
    };
  }

  @HostListener("document:mousemove", ["$event"])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDraggingPlacement || !this.selectedPlacementId) return;

    const rect = this.sheetCanvas.nativeElement.getBoundingClientRect();
    let x = (event.clientX - rect.left - this.dragOffset.x) / this.displayScale;
    let y = (event.clientY - rect.top - this.dragOffset.y) / this.displayScale;

    // Snap to grid
    if (this.settings.gridSnap > 0) {
      x = Math.round(x / this.settings.gridSnap) * this.settings.gridSnap;
      y = Math.round(y / this.settings.gridSnap) * this.settings.gridSnap;
    }

    const placement = this.placements.find(
      (p) => p.id === this.selectedPlacementId,
    );
    if (placement) {
      // Clamp within printable area
      const minX = this.settings.marginLeft;
      const maxX =
        this.settings.pageWidth - this.settings.marginRight - placement.width;
      const minY = this.settings.marginTop;
      const maxY =
        this.settings.pageHeight -
        this.settings.marginBottom -
        placement.height;

      placement.x = Math.max(minX, Math.min(maxX, x));
      placement.y = Math.max(minY, Math.min(maxY, y));
      this.scheduleAutoSave();
    }
  }

  @HostListener("document:mouseup")
  onMouseUp(): void {
    this.isDraggingPlacement = false;
  }

  selectPlacement(placement: MiniPlacement, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedPlacementId = placement.id;
    this.editingTextId = null;
  }

  deselectPlacement(): void {
    this.selectedPlacementId = null;
    this.editingTextId = null;
  }

  deletePlacement(placementId: string): void {
    this.placements = this.placements.filter((p) => p.id !== placementId);
    if (this.selectedPlacementId === placementId) {
      this.selectedPlacementId = null;
    }
  }

  deleteSelectedPlacement(): void {
    if (this.selectedPlacementId) {
      this.deletePlacement(this.selectedPlacementId);
    }
  }

  duplicatePlacement(placement: MiniPlacement): void {
    const minX = this.settings.marginLeft;

    // Try to place to the left of the original
    let newX = placement.x - placement.width;

    // If it would go off the page or into the margin, place to the right instead
    if (newX < minX) {
      newX = placement.x + placement.width;
    }

    const newPlacement: MiniPlacement = {
      ...placement,
      id: this.generateId(),
      x: newX,
      y: placement.y,
      text: this.getNextLabel(placement.miniId),
    };
    this.placements.push(newPlacement);
    this.selectedPlacementId = newPlacement.id;
    this.scheduleAutoSave();
  }

  resetPlacementSize(placement: MiniPlacement): void {
    placement.width = DEFAULT_MINI_WIDTH;
    placement.height = DEFAULT_MINI_HEIGHT;
    this.scheduleAutoSave();
  }

  getSelectedPlacement(): MiniPlacement | undefined {
    return this.placements.find((p) => p.id === this.selectedPlacementId);
  }

  getMini(miniId: string): Mini | undefined {
    return this.minis.find((m) => m.id === miniId);
  }

  getImageUrl(miniId: string): string {
    return this.miniService.getFrontImageUrl(miniId);
  }

  // Get original image size in inches (assumes 96 DPI for screen images)
  getOriginalSize(miniId: string): { width: string; height: string } | null {
    const cached = this.imageSizeCache.get(miniId);
    if (cached) {
      // Convert pixels to inches at assumed 96 DPI, format to 2 decimal places
      const widthInches = (cached.width / 96).toFixed(2);
      const heightInches = (cached.height / 96).toFixed(2);
      return { width: widthInches, height: heightInches };
    }

    // Load image to get dimensions (async, will update on next change detection)
    const img = new Image();
    img.onload = () => {
      this.imageSizeCache.set(miniId, {
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = this.getImageUrl(miniId);

    return null; // Will show after image loads
  }

  getBackSideImageUrl(placement: MiniPlacement): string {
    if (placement.backMode === "back-image") {
      return this.miniService.getBackImageUrl(placement.miniId);
    }
    return "";
  }

  hasBackSide(placement: MiniPlacement): boolean {
    return placement.backMode !== "none";
  }

  // Auto-arrange all placements in a grid, sorted by label
  autoArrange(): void {
    if (this.placements.length === 0) return;

    const printableWidth =
      this.settings.pageWidth -
      this.settings.marginLeft -
      this.settings.marginRight;

    // Use max width/height for layout, add margin for labels below
    const maxWidth = Math.max(...this.placements.map((p) => p.width));
    const maxHeight = Math.max(...this.placements.map((p) => p.height));
    const labelMargin = 0.2; // Extra space below each mini for labels (in inches)
    const rowHeight = maxHeight + labelMargin;

    const cols = Math.floor(printableWidth / maxWidth);

    // Sort placements by label (A1, A2, B1, B2, etc.)
    const sorted = [...this.placements].sort((a, b) => {
      const labelA = a.text || "ZZZ999";
      const labelB = b.text || "ZZZ999";

      // Extract letter and number parts
      const matchA = labelA.match(/([A-Z]+)(\d+)/);
      const matchB = labelB.match(/([A-Z]+)(\d+)/);

      if (matchA && matchB) {
        // Compare letters first
        if (matchA[1] !== matchB[1]) {
          return matchA[1].localeCompare(matchB[1]);
        }
        // Then compare numbers
        return parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
      }

      return labelA.localeCompare(labelB);
    });

    // Apply positions based on sorted order
    sorted.forEach((placement, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      placement.x = this.settings.marginLeft + col * maxWidth;
      placement.y = this.settings.marginTop + row * rowHeight;
    });

    this.scheduleAutoSave();
  }

  // Clear all placements
  clearPlacements(): void {
    this.placements = [];
    this.selectedPlacementId = null;
    this.scheduleAutoSave();
  }

  // Start text editing
  startTextEdit(placement: MiniPlacement, event: MouseEvent): void {
    event.stopPropagation();
    this.editingTextId = placement.id;
  }

  stopTextEdit(): void {
    this.editingTextId = null;
  }

  // === Image Upload Methods ===

  // Track if we're doing a front+back upload
  private isFrontBackMode = false;

  onFrontImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    if (this.isFrontBackMode) {
      // Save front image and prompt for back
      const reader = new FileReader();
      reader.onload = () => {
        this.pendingFrontImage = reader.result as string;
        // Prompt for back image
        setTimeout(() => this.backImageInput.nativeElement.click(), 100);
      };
      reader.readAsDataURL(file);
    } else {
      // Regular upload - front only
      this.uploadImageAsMini(file);
    }
    input.value = ""; // Reset for next selection
  }

  addNewMini(): void {
    this.isFrontBackMode = false;
    this.frontImageInput.nativeElement.click();
  }

  addNewMiniWithBack(): void {
    this.isFrontBackMode = true;
    this.pendingFrontImage = null;
    this.frontImageInput.nativeElement.click();
  }

  onBackImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.pendingFrontImage) {
      // Cancelled back selection - just create with front only
      if (this.pendingFrontImage) {
        this.createMiniFromBase64(this.pendingFrontImage, "New Mini");
        this.pendingFrontImage = null;
      }
      this.isFrontBackMode = false;
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const backData = reader.result as string;
      this.createMiniWithBothImages(this.pendingFrontImage!, backData);
      this.pendingFrontImage = null;
      this.isFrontBackMode = false;
    };
    reader.readAsDataURL(file);
    input.value = "";
  }

  private createMiniFromBase64(imageData: string, name: string): void {
    this.miniService.createMini(name, imageData).subscribe({
      next: (mini) => {
        this.minis.unshift(mini);
        this.filterMinis();
        this.snackBar.open(`Added "${mini.name}"`, "Dismiss", {
          duration: 2000,
        });
      },
      error: () => {
        this.snackBar.open("Failed to create mini", "Dismiss", {
          duration: 3000,
        });
      },
    });
  }

  private uploadImageAsMini(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      const name = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

      this.miniService.createMini(name, imageData).subscribe({
        next: (mini) => {
          this.minis.unshift(mini);
          this.filterMinis();
          this.snackBar.open(`Added "${mini.name}"`, "Dismiss", {
            duration: 2000,
          });
        },
        error: () => {
          this.snackBar.open("Failed to upload image", "Dismiss", {
            duration: 3000,
          });
        },
      });
    };
    reader.readAsDataURL(file);
  }

  private createMiniWithBothImages(frontData: string, backData: string): void {
    // First create the mini with front image
    this.miniService.createMini("New Mini", frontData).subscribe({
      next: (mini) => {
        // Then set the back image
        this.miniService.setBackImageFromBase64(mini.id, backData).subscribe({
          next: () => {
            mini.hasBackImage = true;
            this.minis.unshift(mini);
            this.filterMinis();
            this.snackBar.open(`Added mini with front and back`, "Dismiss", {
              duration: 2000,
            });
          },
          error: () => {
            // Front was added but back failed
            this.minis.unshift(mini);
            this.filterMinis();
            this.snackBar.open(
              "Added front, but back image failed",
              "Dismiss",
              { duration: 3000 },
            );
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

  // Library drag/drop for adding images
  onLibraryDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingToLibrary = true;
  }

  onLibraryDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingToLibrary = false;
  }

  onLibraryDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingToLibrary = false;

    const files = event.dataTransfer?.files;
    if (files?.length) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith("image/")) {
          this.uploadImageAsMini(files[i]);
        }
      }
    }
  }

  onLibraryPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          this.uploadImageAsMini(file);
        }
      }
    }
  }

  // Print preview
  openPrintPreview(): void {
    this.dialog.open(MiniPrintPreviewComponent, {
      width: "95vw",
      maxWidth: "1200px",
      height: "95vh",
      data: {
        placements: this.placements,
        settings: this.settings,
        miniService: this.miniService,
        sheetCode: this.currentSheet?.code || "",
      },
    });
  }

  // Keyboard shortcuts
  @HostListener("document:keydown", ["$event"])
  onKeyDown(event: KeyboardEvent): void {
    if (this.editingTextId) return; // Don't handle shortcuts when editing text

    // Don't handle shortcuts when user is typing in an input field
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      if (this.selectedPlacementId) {
        event.preventDefault();
        this.deleteSelectedPlacement();
      }
    }

    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
      this.saveCurrentSheet();
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}
