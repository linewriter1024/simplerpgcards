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
import {
  ConglomerateDialogComponent,
  ConglomerateDialogResult,
} from "./conglomerate-dialog.component";

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

  // Multi-page support
  get printableHeight(): number {
    return (
      this.settings.pageHeight -
      this.settings.marginTop -
      this.settings.marginBottom
    );
  }

  get pageCount(): number {
    if (this.placements.length === 0) return 1;
    const labelMargin = 0.2;
    let maxPage = 0;
    for (const p of this.placements) {
      const bottomY = p.y - this.settings.marginTop + p.height + labelMargin;
      const page = Math.floor(bottomY / this.printableHeight);
      maxPage = Math.max(maxPage, page);
    }
    return maxPage + 1;
  }

  get totalCanvasHeight(): number {
    // Total height for all pages with gaps between them
    const pageGap = 20 / this.displayScale; // 20px gap between pages
    return (
      this.pageCount * this.settings.pageHeight + (this.pageCount - 1) * pageGap
    );
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.pageCount }, (_, i) => i);
  }

  getPageTopOffset(pageIndex: number): number {
    const pageGap = 20; // pixels
    return pageIndex * (this.settings.pageHeight * this.displayScale + pageGap);
  }

  /**
   * Get the page number a placement is on based on its Y position
   */
  getPlacementPage(placement: MiniPlacement): number {
    const labelMargin = 0.2;
    const bottomY =
      placement.y - this.settings.marginTop + placement.height + labelMargin;
    return Math.max(0, Math.floor(bottomY / this.printableHeight));
  }

  /**
   * Convert a placement's Y position (in inches) to a canvas Y position (in pixels)
   * This accounts for page gaps in the multi-page display
   */
  getPlacementCanvasY(placement: MiniPlacement): number {
    const page = this.getPlacementPage(placement);
    const pageGap = 20; // pixels
    // Y within the page
    const yOnPage = placement.y - page * this.printableHeight;
    // Add page offset
    return (
      yOnPage * this.displayScale +
      page * (this.settings.pageHeight * this.displayScale + pageGap)
    );
  }

  /**
   * Convert canvas Y (in pixels) to placement Y (in inches)
   */
  canvasYToPlacementY(canvasY: number, placementHeight: number): number {
    const pageGap = 20; // pixels
    const pageHeightPx = this.settings.pageHeight * this.displayScale + pageGap;
    const page = Math.floor(canvasY / pageHeightPx);
    const yOnPagePx = canvasY - page * pageHeightPx;
    const yOnPage = yOnPagePx / this.displayScale;
    return yOnPage + page * this.printableHeight;
  }

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

  openConglomerateDialog(): void {
    if (this.sheets.length === 0) {
      this.snackBar.open("No sheets available to combine", "Dismiss", {
        duration: 3000,
      });
      return;
    }

    const dialogRef = this.dialog.open(ConglomerateDialogComponent, {
      data: { sheets: this.sheets },
      width: "500px",
    });

    dialogRef.afterClosed().subscribe((result: ConglomerateDialogResult) => {
      if (result) {
        this.createConglomerateSheet(result);
      }
    });
  }

  private createConglomerateSheet(result: ConglomerateDialogResult): void {
    this.miniService
      .createSheet({ name: result.name, settings: DEFAULT_SHEET_SETTINGS })
      .subscribe({
        next: (sheet) => {
          this.sheets.unshift(sheet);
          this.selectSheet(sheet);
          // Add the combined placements
          this.placements = result.placements;
          // Auto-arrange them
          this.autoArrange();
          this.snackBar.open(
            `Created conglomerate sheet with ${result.placements.length} minis`,
            "Dismiss",
            { duration: 3000 },
          );
        },
        error: () => {
          this.snackBar.open("Failed to create conglomerate sheet", "Dismiss", {
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

    // Find which page was dropped on
    const target = event.target as HTMLElement;
    const pageElement = target.closest(".sheet-page");
    if (!pageElement) return;

    const pageNum = parseInt(pageElement.getAttribute("data-page") || "0", 10);

    const rect = pageElement.getBoundingClientRect();
    const xOnPage = (event.clientX - rect.left) / this.displayScale;
    const yOnPage = (event.clientY - rect.top) / this.displayScale;

    // Convert to absolute Y position (accounting for page)
    const y = yOnPage + pageNum * this.printableHeight;

    this.addPlacement(this.draggedMini.id, xOnPage, y, pageNum);
    this.draggedMini = null;
  }

  addPlacement(
    miniId: string,
    x: number,
    y: number,
    pageNum: number = 0,
  ): void {
    // Snap to grid if enabled
    if (this.settings.gridSnap > 0) {
      x = Math.round(x / this.settings.gridSnap) * this.settings.gridSnap;
      y = Math.round(y / this.settings.gridSnap) * this.settings.gridSnap;
    }

    // Clamp within printable area for the specific page
    const width = this.currentMiniSize;
    const height = this.currentMiniSize;
    const labelMargin = 0.2;
    const maxX = this.settings.pageWidth - this.settings.marginRight - width;
    const minX = this.settings.marginLeft;

    // Y bounds are relative to the page
    const pageTopY = this.settings.marginTop + pageNum * this.printableHeight;
    const pageBottomY = pageTopY + this.printableHeight - height - labelMargin;

    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(pageTopY, Math.min(pageBottomY, y));

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
  private dragStartPage = 0;

  onPlacementMouseDown(event: MouseEvent, placement: MiniPlacement): void {
    event.preventDefault();
    event.stopPropagation();

    this.selectedPlacementId = placement.id;
    this.isDraggingPlacement = true;

    // Find which page element this placement is on
    const target = event.target as HTMLElement;
    const pageElement = target.closest(".sheet-page");
    this.dragStartPage = pageElement
      ? parseInt(pageElement.getAttribute("data-page") || "0", 10)
      : this.getPlacementPage(placement);

    const rect = pageElement
      ? pageElement.getBoundingClientRect()
      : this.sheetCanvas.nativeElement.getBoundingClientRect();

    // Calculate offset within the page
    const yOnPage = placement.y - this.dragStartPage * this.printableHeight;
    const currentX = placement.x * this.displayScale;
    const currentY = yOnPage * this.displayScale;

    this.dragOffset = {
      x: event.clientX - rect.left - currentX,
      y: event.clientY - rect.top - currentY,
    };
  }

  @HostListener("document:mousemove", ["$event"])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDraggingPlacement || !this.selectedPlacementId) return;

    // Find the page element under the cursor
    const elementsUnder = document.elementsFromPoint(
      event.clientX,
      event.clientY,
    );
    const pageElement = elementsUnder.find((el) =>
      el.classList.contains("sheet-page"),
    );

    if (!pageElement) return;

    const pageNum = parseInt(pageElement.getAttribute("data-page") || "0", 10);
    const rect = pageElement.getBoundingClientRect();

    let x = (event.clientX - rect.left - this.dragOffset.x) / this.displayScale;
    let yOnPage =
      (event.clientY - rect.top - this.dragOffset.y) / this.displayScale;

    // Snap to grid
    if (this.settings.gridSnap > 0) {
      x = Math.round(x / this.settings.gridSnap) * this.settings.gridSnap;
      yOnPage =
        Math.round(yOnPage / this.settings.gridSnap) * this.settings.gridSnap;
    }

    const placement = this.placements.find(
      (p) => p.id === this.selectedPlacementId,
    );
    if (placement) {
      const labelMargin = 0.2;

      // Clamp X within printable area
      const minX = this.settings.marginLeft;
      const maxX =
        this.settings.pageWidth - this.settings.marginRight - placement.width;

      // Clamp Y within the page's printable area
      const minYOnPage = this.settings.marginTop;
      const maxYOnPage =
        this.settings.pageHeight -
        this.settings.marginBottom -
        placement.height -
        labelMargin;

      placement.x = Math.max(minX, Math.min(maxX, x));

      // Convert page-relative Y to absolute Y
      const clampedYOnPage = Math.max(
        minYOnPage,
        Math.min(maxYOnPage, yOnPage),
      );
      placement.y = clampedYOnPage + pageNum * this.printableHeight;

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
    this.scheduleAutoSave();
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

  // Auto-arrange all placements using row-based packing with equal-height rows
  autoArrange(): void {
    if (this.placements.length === 0) return;

    const printableWidth =
      this.settings.pageWidth -
      this.settings.marginLeft -
      this.settings.marginRight;
    const printableHeight =
      this.settings.pageHeight -
      this.settings.marginTop -
      this.settings.marginBottom;

    const labelMargin = 0.2; // Extra space below each mini for labels (in inches)

    // Sort placements by height (descending), then by label
    const sorted = [...this.placements].sort((a, b) => {
      // Primary sort: by height (tallest first), with tolerance for grouping similar heights
      const heightA = Math.round(a.height * 10) / 10; // Round to 0.1 inch
      const heightB = Math.round(b.height * 10) / 10;
      if (heightA !== heightB) return heightB - heightA;

      // Secondary sort: by full label (prefix + letter + number)
      // Labels are like "*** A1" or "TF A1" - sort by prefix first, then letter, then number
      const labelA = a.text || "ZZZ999";
      const labelB = b.text || "ZZZ999";

      // Match pattern: optional prefix, then letter(s), then number
      const matchA = labelA.match(/^(.*?)([A-Z]+)(\d+)$/);
      const matchB = labelB.match(/^(.*?)([A-Z]+)(\d+)$/);

      if (matchA && matchB) {
        // Compare prefix first (e.g., "*** " or "TF ")
        const prefixCmp = matchA[1].localeCompare(matchB[1]);
        if (prefixCmp !== 0) return prefixCmp;

        // Then compare letter part (A, B, C, etc.)
        const letterCmp = matchA[2].localeCompare(matchB[2]);
        if (letterCmp !== 0) return letterCmp;

        // Then compare number part numerically
        return parseInt(matchA[3], 10) - parseInt(matchB[3], 10);
      }

      return labelA.localeCompare(labelB);
    });

    // Row-based placement across multiple pages
    let currentPage = 0;
    let currentX = 0;
    let currentY = 0;
    let rowHeight = 0; // Height of current row (tallest item + label margin)

    for (const placement of sorted) {
      const itemWidth = placement.width;
      const itemHeight = placement.height + labelMargin;

      // Check if item fits in current row
      if (currentX + itemWidth > printableWidth) {
        // Start new row
        currentX = 0;
        currentY += rowHeight;
        rowHeight = 0;
      }

      // Check if row fits on current page
      if (currentY + itemHeight > printableHeight) {
        // Start new page
        currentPage++;
        currentX = 0;
        currentY = 0;
        rowHeight = 0;
      }

      // Place the item
      placement.x = this.settings.marginLeft + currentX;
      placement.y =
        this.settings.marginTop + currentY + currentPage * printableHeight;

      // Update row tracking
      currentX += itemWidth;
      rowHeight = Math.max(rowHeight, itemHeight);
    }

    this.scheduleAutoSave();
  }

  private updateSkyline(
    skyline: { x: number; y: number; width: number }[],
    newX: number,
    newY: number,
    newWidth: number,
    maxWidth: number,
  ): void {
    const newRight = newX + newWidth;

    // Find segments that overlap with the new rectangle
    const newSegments: { x: number; y: number; width: number }[] = [];

    for (const seg of skyline) {
      const segRight = seg.x + seg.width;

      if (segRight <= newX || seg.x >= newRight) {
        // No overlap, keep segment as is
        newSegments.push(seg);
      } else if (seg.x < newX && segRight > newRight) {
        // Segment spans entire new rectangle - split into 3
        newSegments.push({ x: seg.x, y: seg.y, width: newX - seg.x });
        newSegments.push({ x: newX, y: newY, width: newWidth });
        newSegments.push({ x: newRight, y: seg.y, width: segRight - newRight });
      } else if (seg.x < newX) {
        // Overlaps on the left
        newSegments.push({ x: seg.x, y: seg.y, width: newX - seg.x });
        newSegments.push({
          x: newX,
          y: newY,
          width: Math.min(segRight, newRight) - newX,
        });
      } else if (segRight > newRight) {
        // Overlaps on the right
        newSegments.push({ x: seg.x, y: newY, width: newRight - seg.x });
        newSegments.push({ x: newRight, y: seg.y, width: segRight - newRight });
      } else {
        // Segment is fully covered
        newSegments.push({ x: seg.x, y: newY, width: seg.width });
      }
    }

    // Merge adjacent segments with same height
    skyline.length = 0;
    for (const seg of newSegments) {
      if (skyline.length > 0) {
        const last = skyline[skyline.length - 1];
        if (
          Math.abs(last.y - seg.y) < 0.001 &&
          Math.abs(last.x + last.width - seg.x) < 0.001
        ) {
          last.width += seg.width;
          continue;
        }
      }
      skyline.push(seg);
    }
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
