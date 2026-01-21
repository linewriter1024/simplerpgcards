import { Component, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MiniSheet, MiniPlacement, Mini } from "../../../models/mini.model";
import { MiniService } from "../../../services/mini.service";

export interface ImportFromSheetDialogData {
  sheets: MiniSheet[];
  currentSheetId?: string;
  minis: Mini[];
}

export interface ImportFromSheetDialogResult {
  placements: MiniPlacement[];
}

interface SelectablePlacement {
  placement: MiniPlacement;
  mini: Mini | undefined;
  selected: boolean;
  sourceSheet: MiniSheet;
}

interface SelectableSheet {
  sheet: MiniSheet;
  selected: boolean;
}

@Component({
  selector: "app-import-from-sheet-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>Import from Sheet</h2>
    <mat-dialog-content>
      <div class="sheet-selection">
        <div class="section-label">Source Sheets</div>
        <div class="sheet-list">
          @for (item of selectableSheets; track item.sheet.id) {
            <div
              class="sheet-item"
              [class.selected]="item.selected"
              (click)="toggleSheetSelection(item)"
            >
              <mat-checkbox
                [checked]="item.selected"
                (click)="$event.stopPropagation()"
                (change)="
                  item.selected = $event.checked; onSheetSelectionChange()
                "
              ></mat-checkbox>
              <div class="sheet-info">
                <span class="sheet-name">{{ item.sheet.name }}</span>
                @if (item.sheet.code) {
                  <span class="sheet-code">[{{ item.sheet.code }}]</span>
                }
                <span class="mini-count"
                  >({{ item.sheet.placements.length }} minis)</span
                >
              </div>
            </div>
          }
        </div>
      </div>

      @if (selectablePlacements.length > 0) {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Filter minis</mat-label>
          <input
            matInput
            [(ngModel)]="filterText"
            placeholder="Search by name or label..."
          />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <div class="selection-actions">
          <button mat-button (click)="selectAllMinis()">Select All</button>
          <button mat-button (click)="selectNoMinis()">Select None</button>
          <span class="selection-count">{{ selectedMiniCount }} selected</span>
        </div>

        <div class="hint-text">
          <mat-icon>info</mat-icon>
          Click to select. Hold Shift and click to select a range.
        </div>

        <div class="placement-list">
          @for (
            item of filteredPlacements;
            track item.placement.id;
            let i = $index
          ) {
            <div
              class="placement-item"
              [class.selected]="item.selected"
              (click)="onItemClick(item, i, $event)"
            >
              <mat-checkbox
                [checked]="item.selected"
                (click)="$event.stopPropagation()"
                (change)="item.selected = $event.checked; lastClickedIndex = -1"
              ></mat-checkbox>
              <div class="placement-preview">
                @if (item.mini) {
                  <img
                    [src]="getMiniImageUrl(item.mini.id)"
                    [alt]="item.mini.name"
                  />
                }
              </div>
              <div class="placement-info">
                <span class="mini-name">{{
                  item.mini?.name || "Unknown"
                }}</span>
                @if (item.placement.text) {
                  <span class="placement-label">{{
                    getDisplayLabel(item.placement.text, item.sourceSheet)
                  }}</span>
                }
                <span class="placement-size">
                  {{ item.placement.width }}" × {{ item.placement.height }}"
                  <span class="source-sheet"
                    >from {{ item.sourceSheet.name }}</span
                  >
                </span>
              </div>
            </div>
          }
          @if (filteredPlacements.length === 0) {
            <div class="empty-state">
              <p>No minis match your filter.</p>
            </div>
          }
        </div>
      } @else if (selectedSheetCount > 0) {
        <div class="empty-state">
          <p>Selected sheets have no minis.</p>
        </div>
      } @else {
        <div class="empty-state">
          <p>Select one or more sheets to view their minis.</p>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="selectedMiniCount === 0"
        (click)="import()"
      >
        Import {{ selectedMiniCount }} Mini{{
          selectedMiniCount !== 1 ? "s" : ""
        }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 500px;
        max-height: 70vh;
      }

      .full-width {
        width: 100%;
      }

      .section-label {
        font-size: 12px;
        color: #888;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .sheet-selection {
        margin-bottom: 16px;
      }

      .sheet-list {
        max-height: 150px;
        overflow-y: auto;
        border: 1px solid #404040;
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .sheet-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #333;
        transition: background-color 0.15s;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background-color: #333;
        }

        &.selected {
          background-color: rgba(187, 134, 252, 0.15);
        }

        .sheet-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .sheet-name {
          font-size: 14px;
        }

        .sheet-code {
          color: #888;
          font-size: 12px;
        }

        .mini-count {
          margin-left: auto;
          color: #666;
          font-size: 12px;
        }
      }

      .selection-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .selection-count {
          margin-left: auto;
          color: #888;
          font-size: 12px;
        }
      }

      .hint-text {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: #888;
        font-size: 12px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .placement-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #404040;
        border-radius: 4px;
      }

      .placement-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #333;
        transition: background-color 0.15s;
        user-select: none;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background-color: #333;
        }

        &.selected {
          background-color: rgba(187, 134, 252, 0.15);
        }

        .placement-preview {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          overflow: hidden;
          background: #222;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .placement-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .mini-name {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .placement-label {
          color: #bb86fc;
          font-size: 12px;
          font-weight: 500;
        }

        .placement-size {
          color: #666;
          font-size: 11px;
        }

        .source-sheet {
          color: #555;
          font-style: italic;
          margin-left: 8px;
        }
      }

      .empty-state {
        padding: 24px;
        text-align: center;
        color: #888;
      }
    `,
  ],
})
export class ImportFromSheetDialogComponent {
  filterText = "";
  selectableSheets: SelectableSheet[] = [];
  selectablePlacements: SelectablePlacement[] = [];
  lastClickedIndex = -1;

  constructor(
    public dialogRef: MatDialogRef<ImportFromSheetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportFromSheetDialogData,
    private miniService: MiniService,
  ) {
    // Initialize selectable sheets (excluding current sheet)
    this.selectableSheets = data.sheets
      .filter((s) => s.id !== data.currentSheetId)
      .map((sheet) => ({ sheet, selected: false }));
  }

  get selectedSheetCount(): number {
    return this.selectableSheets.filter((s) => s.selected).length;
  }

  get filteredPlacements(): SelectablePlacement[] {
    if (!this.filterText.trim()) {
      return this.selectablePlacements;
    }
    const term = this.filterText.toLowerCase();
    return this.selectablePlacements.filter((item) => {
      const nameMatch = item.mini?.name.toLowerCase().includes(term);
      const labelMatch = item.placement.text?.toLowerCase().includes(term);
      const sheetMatch = item.sourceSheet.name.toLowerCase().includes(term);
      return nameMatch || labelMatch || sheetMatch;
    });
  }

  get selectedMiniCount(): number {
    return this.selectablePlacements.filter((s) => s.selected).length;
  }

  toggleSheetSelection(item: SelectableSheet): void {
    item.selected = !item.selected;
    this.onSheetSelectionChange();
  }

  onSheetSelectionChange(): void {
    // Rebuild placements list from all selected sheets
    this.selectablePlacements = [];

    for (const sheetItem of this.selectableSheets) {
      if (sheetItem.selected) {
        for (const placement of sheetItem.sheet.placements) {
          this.selectablePlacements.push({
            placement,
            mini: this.data.minis.find((m) => m.id === placement.miniId),
            selected: false,
            sourceSheet: sheetItem.sheet,
          });
        }
      }
    }

    this.lastClickedIndex = -1;
  }

  onItemClick(
    item: SelectablePlacement,
    index: number,
    event: MouseEvent,
  ): void {
    const filteredList = this.filteredPlacements;

    if (event.shiftKey && this.lastClickedIndex >= 0) {
      // Shift-click: select range
      const start = Math.min(this.lastClickedIndex, index);
      const end = Math.max(this.lastClickedIndex, index);

      // Get the selection state of the anchor item
      const anchorItem = filteredList[this.lastClickedIndex];
      const newState = anchorItem?.selected ?? true;

      for (let i = start; i <= end; i++) {
        if (filteredList[i]) {
          filteredList[i].selected = newState;
        }
      }
    } else {
      // Normal click: toggle single item
      item.selected = !item.selected;
      this.lastClickedIndex = index;
    }
  }

  selectAllMinis(): void {
    this.filteredPlacements.forEach((s) => (s.selected = true));
    this.lastClickedIndex = -1;
  }

  selectNoMinis(): void {
    this.filteredPlacements.forEach((s) => (s.selected = false));
    this.lastClickedIndex = -1;
  }

  getMiniImageUrl(miniId: string): string {
    return this.miniService.getFrontImageUrl(miniId);
  }

  getDisplayLabel(text: string, sourceSheet: MiniSheet): string {
    const code = sourceSheet.code || "";
    if (code) {
      return text.replace(/\*\*\*/, code);
    }
    return text.replace(/\*\*\* /, "");
  }

  import(): void {
    const selectedItems = this.selectablePlacements.filter((s) => s.selected);

    const placements: MiniPlacement[] = selectedItems.map((item) => {
      // Clone placement with new ID and resolved label
      const code = item.sourceSheet.code || "";
      let newText = item.placement.text || "";
      if (code) {
        newText = newText.replace(/\*\*\*/, code);
      } else {
        newText = newText.replace(/\*\*\* /, "");
      }

      return {
        ...item.placement,
        id: this.generateId(),
        text: newText,
      };
    });

    this.dialogRef.close({ placements } as ImportFromSheetDialogResult);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}
