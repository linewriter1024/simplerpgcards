import { Directive, HostListener, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DiceService } from './dice.service';

@Directive({
  selector: '[appDiceClick]',
  standalone: true
})
export class DiceClickDirective {
  // Optional context text for dialog title
  @Input('appDiceClick') context?: string;

  constructor(private dialog: MatDialog, private dice: DiceService) {}

  @HostListener('click', ['$event'])
  async onClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    // If clicking a linkified dice element or inside it
    const linkEl = target.closest('.dice-link') as HTMLElement | null;
    if (!linkEl) return;
    ev.preventDefault();
    ev.stopPropagation();

    const expr = linkEl.getAttribute('data-dice');
    if (!expr) return;

  const result = this.dice.roll(expr);
  // @ts-ignore - dynamic import path resolved at build time by Angular
  const { DiceRollDialogComponent } = await import('./dice-roll-dialog.component');
  this.dialog.open(DiceRollDialogComponent, {
      width: '380px',
      data: {
        context: this.context,
        result
      }
    });
  }
}
