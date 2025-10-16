import {
  Directive,
  ElementRef,
  Renderer2,
  Input,
  OnDestroy,
  AfterViewInit
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DiceService } from './dice.service';

@Directive({
  selector: '[appDiceClick]',
  standalone: true
})
export class DiceClickDirective implements AfterViewInit, OnDestroy {
  @Input('appDiceClick') context?: string;

  private observer?: MutationObserver;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private dialog: MatDialog,
    private dice: DiceService
  ) {}

  ngAfterViewInit() {
    // Attach to any dice links that already exist
    this.attachToLinks();

    // Observe for dynamically added content (e.g. when [innerHTML] updates)
    this.observer = new MutationObserver(() => this.attachToLinks());
    this.observer.observe(this.el.nativeElement, {
      childList: true,
      subtree: true
    });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  private attachToLinks() {
    const links = this.el.nativeElement.querySelectorAll<HTMLAnchorElement>('.dice-link');

    links.forEach(link => {
      if ((link as any)._diceListenerAttached) return;
      (link as any)._diceListenerAttached = true;

      this.renderer.listen(link, 'click', (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();

        (async () => {
          const expr = link.getAttribute('data-dice');
          if (!expr) return;

          const result = this.dice.roll(expr);
          const { DiceRollDialogComponent } = await import('./dice-roll-dialog.component');
          this.dialog.open(DiceRollDialogComponent, {
            width: '380px',
            data: {
              context: this.context,
              result
            }
          });
        })();
      });
    });
  }
}
