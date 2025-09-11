import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Convert dice notation in text into clickable spans/links that can be handled by a directive
// Examples: 1d4+2, 2d6 - 1, 6D12
@Pipe({
  name: 'diceLinkify',
  standalone: true
})
export class DiceLinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '' as any;
    // Regex to match a dice expression possibly with modifiers, but we'll make minimal linking:
    // Link contiguous dice terms possibly with +/- modifiers around them, keeping punctuation.
    // We'll capture patterns like: 1d4, 1d4+2, 2d6 - 1, 3d8+4-2
    const diceExpr = /\b\d+\s*[dD]\s*\d+(?:\s*[+\-]\s*\d+)*\b/g;
    const html = value.replace(diceExpr, (match) => {
      const expr = match.replace(/\s+/g, ' ');
      const escaped = this.escapeHtml(expr);
      return `<a href="#" class="dice-link" data-dice="${escaped}" title="Roll ${escaped}" role="button" aria-label="Roll ${escaped}" onclick="return false;">${escaped}</a>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
