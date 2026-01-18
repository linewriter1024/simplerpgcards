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
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MiniSheet, MiniPlacement } from "../../../models/mini.model";

export interface ConglomerateDialogData {
  sheets: MiniSheet[];
}

export interface ConglomerateDialogResult {
  name: string;
  placements: MiniPlacement[];
}

interface SelectableSheet {
  sheet: MiniSheet;
  selected: boolean;
}

@Component({
  selector: "app-conglomerate-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>Create Conglomerate Sheet</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>New Sheet Name</mat-label>
        <input
          matInput
          [(ngModel)]="newSheetName"
          placeholder="Combined Sheet"
        />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Filter sheets</mat-label>
        <input matInput [(ngModel)]="filterText" placeholder="Search..." />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <div class="selection-actions">
        <button mat-button (click)="selectAll()">Select All</button>
        <button mat-button (click)="selectNone()">Select None</button>
        <span class="selection-count"
          >{{ selectedCount }} selected ({{ totalMiniCount }} minis)</span
        >
      </div>

      <div class="sheet-list">
        @for (item of filteredSheets; track item.sheet.id) {
          <div
            class="sheet-item"
            [class.selected]="item.selected"
            (click)="item.selected = !item.selected"
          >
            <mat-checkbox
              [checked]="item.selected"
              (click)="$event.stopPropagation()"
              (change)="item.selected = $event.checked"
            ></mat-checkbox>
            <div class="sheet-info">
              <span class="sheet-name">{{ item.sheet.name }}</span>
              @if (item.sheet.code) {
                <span class="sheet-code">[{{ item.sheet.code }}]</span>
              }
              <span class="mini-count"
                >{{ item.sheet.placements.length }} minis</span
              >
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
        [disabled]="selectedCount === 0 || !newSheetName.trim()"
        (click)="create()"
      >
        Create
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 400px;
        max-height: 60vh;
      }

      .full-width {
        width: 100%;
      }

      .selection-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .selection-count {
          margin-left: auto;
          color: #888;
          font-size: 12px;
        }
      }

      .sheet-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #404040;
        border-radius: 4px;
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
    `,
  ],
})
export class ConglomerateDialogComponent {
  newSheetName = "Combined Sheet";
  filterText = "";
  selectableSheets: SelectableSheet[] = [];

  constructor(
    public dialogRef: MatDialogRef<ConglomerateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConglomerateDialogData,
  ) {
    this.selectableSheets = data.sheets.map((sheet) => ({
      sheet,
      selected: false,
    }));
  }

  get filteredSheets(): SelectableSheet[] {
    if (!this.filterText.trim()) {
      return this.selectableSheets;
    }
    const term = this.filterText.toLowerCase();
    return this.selectableSheets.filter(
      (item) =>
        item.sheet.name.toLowerCase().includes(term) ||
        item.sheet.code?.toLowerCase().includes(term),
    );
  }

  get selectedCount(): number {
    return this.selectableSheets.filter((s) => s.selected).length;
  }

  get totalMiniCount(): number {
    return this.selectableSheets
      .filter((s) => s.selected)
      .reduce((sum, s) => sum + s.sheet.placements.length, 0);
  }

  selectAll(): void {
    this.filteredSheets.forEach((s) => (s.selected = true));
  }

  selectNone(): void {
    this.filteredSheets.forEach((s) => (s.selected = false));
  }

  create(): void {
    const selectedSheets = this.selectableSheets.filter((s) => s.selected);

    // Combine placements from all selected sheets, replacing *** with source sheet code
    const placements: MiniPlacement[] = [];

    for (const item of selectedSheets) {
      const code = item.sheet.code || "";

      for (const p of item.sheet.placements) {
        // Clone placement with new ID and resolved label
        let newText = p.text || "";
        if (code) {
          newText = newText.replace(/\*\*\*/, code);
        } else {
          newText = newText.replace(/\*\*\* /, "");
        }

        placements.push({
          ...p,
          id: this.generateId(),
          text: newText,
        });
      }
    }

    this.dialogRef.close({
      name: this.newSheetName.trim(),
      placements,
    } as ConglomerateDialogResult);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}
