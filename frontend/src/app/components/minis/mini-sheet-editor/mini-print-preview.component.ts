import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MiniService } from "../../../services/mini.service";
import { MiniPlacement, SheetSettings } from "../../../models/mini.model";

export interface PrintPreviewData {
  placements: MiniPlacement[];
  settings: SheetSettings;
  miniService: MiniService;
  sheetCode?: string;
}

interface SelectablePlacement {
  placement: MiniPlacement;
  selected: boolean;
  displayLabel: string;
}

@Component({
  selector: "app-mini-print-preview",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  templateUrl: "./mini-print-preview.component.html",
  styleUrl: "./mini-print-preview.component.scss",
})
export class MiniPrintPreviewComponent implements OnInit, OnDestroy {
  pdfUrl: SafeResourceUrl | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  tempCode: string = "";
  selectablePlacements: SelectablePlacement[] = [];
  lastClickedIndex: number | null = null;
  showSelectionPanel = false;

  private currentBlobUrl: string | null = null;
  private pdfBlob: Blob | null = null;
  private originalPlacements: MiniPlacement[] = [];

  constructor(
    public dialogRef: MatDialogRef<MiniPrintPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrintPreviewData,
    private sanitizer: DomSanitizer,
  ) {
    this.tempCode = data.sheetCode || "";
    this.originalPlacements = data.placements;
    this.initSelectablePlacements();
  }

  ngOnInit(): void {
    this.loadPdf();
  }

  ngOnDestroy(): void {
    this.cleanupBlobUrl();
  }

  private initSelectablePlacements(): void {
    // Sort by label for display
    const sorted = [...this.originalPlacements].sort((a, b) => {
      const labelA = a.text || "ZZZ999";
      const labelB = b.text || "ZZZ999";
      const matchA = labelA.match(/([A-Z]+)(\d+)/);
      const matchB = labelB.match(/([A-Z]+)(\d+)/);
      if (matchA && matchB) {
        if (matchA[1] !== matchB[1]) return matchA[1].localeCompare(matchB[1]);
        return parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
      }
      return labelA.localeCompare(labelB);
    });

    this.selectablePlacements = sorted.map((p) => ({
      placement: p,
      selected: true,
      displayLabel: this.getDisplayLabel(p.text),
    }));
  }

  private getDisplayLabel(text: string | undefined): string {
    if (!text) return "";
    if (this.tempCode) {
      return text.replace(/\*\*\*/, this.tempCode);
    }
    return text.replace(/\*\*\* /, "");
  }

  private updateDisplayLabels(): void {
    this.selectablePlacements.forEach((sp) => {
      sp.displayLabel = this.getDisplayLabel(sp.placement.text);
    });
  }

  getImageUrl(miniId: string): string {
    return this.data.miniService.getFrontImageUrl(miniId);
  }

  toggleSelection(index: number, event: MouseEvent): void {
    if (event.shiftKey && this.lastClickedIndex !== null) {
      // Range selection
      const start = Math.min(this.lastClickedIndex, index);
      const end = Math.max(this.lastClickedIndex, index);
      const newState = !this.selectablePlacements[index].selected;
      for (let i = start; i <= end; i++) {
        this.selectablePlacements[i].selected = newState;
      }
    } else {
      this.selectablePlacements[index].selected =
        !this.selectablePlacements[index].selected;
    }
    this.lastClickedIndex = index;
    this.loadPdf();
  }

  selectAll(): void {
    this.selectablePlacements.forEach((sp) => (sp.selected = true));
    this.loadPdf();
  }

  selectNone(): void {
    this.selectablePlacements.forEach((sp) => (sp.selected = false));
    this.loadPdf();
  }

  get selectedCount(): number {
    return this.selectablePlacements.filter((sp) => sp.selected).length;
  }

  get totalCount(): number {
    return this.selectablePlacements.length;
  }

  toggleSelectionPanel(): void {
    this.showSelectionPanel = !this.showSelectionPanel;
  }

  loadPdf(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Apply temporary code override to placements if code changed
    const placementsToUse = this.getPlacementsWithCode();

    this.data.miniService
      .generatePreviewPdf(placementsToUse, this.data.settings)
      .subscribe({
        next: (blob) => {
          this.cleanupBlobUrl();
          this.pdfBlob = blob;
          this.currentBlobUrl = URL.createObjectURL(blob);
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            this.currentBlobUrl,
          );
          this.isLoading = false;
        },
        error: (err) => {
          console.error("Error generating PDF:", err);
          this.errorMessage = "Failed to generate PDF. Please try again.";
          this.isLoading = false;
        },
      });
  }

  private getPlacementsWithCode(): MiniPlacement[] {
    const code = this.tempCode;

    // Get only selected placements
    const selectedIds = new Set(
      this.selectablePlacements
        .filter((sp) => sp.selected)
        .map((sp) => sp.placement.id),
    );

    // Replace *** placeholder with actual code in all labels
    return this.originalPlacements
      .filter((p) => selectedIds.has(p.id))
      .map((p) => {
        if (!p.text) return p;

        let newText = p.text;
        if (code) {
          newText = p.text.replace(/\*\*\*/, code);
        } else {
          // Remove "*** " prefix if no code
          newText = p.text.replace(/\*\*\* /, "");
        }

        return { ...p, text: newText };
      });
  }

  onCodeChange(): void {
    this.updateDisplayLabels();
    this.loadPdf();
  }

  downloadPdf(): void {
    if (!this.pdfBlob) return;

    const url = URL.createObjectURL(this.pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mini-sheet.pdf";
    link.click();
    URL.revokeObjectURL(url);
  }

  printPdf(): void {
    if (!this.currentBlobUrl) return;

    // Open PDF in new window for printing
    const printWindow = window.open(this.currentBlobUrl, "_blank");
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    }
  }

  private cleanupBlobUrl(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }
}
