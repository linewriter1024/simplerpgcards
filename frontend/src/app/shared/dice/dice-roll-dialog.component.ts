import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DiceRollResult } from './dice.service';

interface DialogData {
  context?: string;
  result: DiceRollResult;
}

@Component({
  selector: 'app-dice-roll-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './dice-roll-dialog.component.html',
  styleUrl: './dice-roll-dialog.component.scss'
})
export class DiceRollDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}
}
