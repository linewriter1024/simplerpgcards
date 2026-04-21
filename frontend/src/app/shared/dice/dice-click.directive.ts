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
  private pendingAttach?: ReturnType<typeof setTimeout>;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private dialog: MatDialog,
    private dice: DiceService
  ) {}

  ngAfterViewInit() {
    // Attach to any dice links that already exist
    this.attachToLinks();

    // Debounce the observer so rapid DOM changes (e.g. during scroll/CD) don't
    // cause repeated querySelectorAll across the whole subtree
    this.observer = new MutationObserver((mutations) => {
      // Only care about mutations that added nodes containing dice links
      const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
      if (!hasNewNodes) return;
      if (this.pendingAttach) return;
      this.pendingAttach = setTimeout(() => {
        this.pendingAttach = undefined;
        this.attachToLinks();
      }, 50);
    });
    this.observer.observe(this.el.nativeElement, {
      childList: true,
      subtree: true
    });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    if (this.pendingAttach) clearTimeout(this.pendingAttach);
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
