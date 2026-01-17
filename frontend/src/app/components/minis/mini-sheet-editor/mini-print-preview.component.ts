import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MiniService } from "../../../services/mini.service";
import { MiniPlacement, SheetSettings } from "../../../models/mini.model";

export interface PrintPreviewData {
  placements: MiniPlacement[];
  settings: SheetSettings;
  miniService: MiniService;
}

@Component({
  selector: "app-mini-print-preview",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: "./mini-print-preview.component.html",
  styleUrl: "./mini-print-preview.component.scss",
})
export class MiniPrintPreviewComponent implements OnInit, OnDestroy {
  pdfUrl: SafeResourceUrl | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  private currentBlobUrl: string | null = null;
  private pdfBlob: Blob | null = null;

  constructor(
    public dialogRef: MatDialogRef<MiniPrintPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrintPreviewData,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadPdf();
  }

  ngOnDestroy(): void {
    this.cleanupBlobUrl();
  }

  loadPdf(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.data.miniService
      .generatePreviewPdf(this.data.placements, this.data.settings)
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
