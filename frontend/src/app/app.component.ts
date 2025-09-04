import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule],
    template: `
    <div class="app-container">
      <mat-toolbar color="primary" class="main-toolbar">
        <h1>RPG Manager</h1>
        <span class="spacer"></span>
        
        <button mat-raised-button 
                [color]="isCardsActive() ? 'accent' : 'primary'"
                (click)="navigateToCards()"
                class="nav-button">
          <mat-icon>style</mat-icon>
          Printable Cards
        </button>
        
        <button mat-raised-button 
                [color]="isStatblocksActive() ? 'accent' : 'primary'"
                (click)="navigateToStatblocks()"
                class="nav-button">
          <mat-icon>table_chart</mat-icon>
          Statblocks
        </button>
        
        <a mat-icon-button href="https://github.com/linewriter1024/simplerpgcards" target="_blank"
          matTooltip="View on GitHub" aria-label="GitHub repository">
          <mat-icon>code</mat-icon>
        </a>
      </mat-toolbar>
      
      <router-outlet></router-outlet>
    </div>
  `,
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'RPG Manager';
  
  constructor(private router: Router) {}

  isCardsActive(): boolean {
    return this.router.url.includes('/cards');
  }

  isStatblocksActive(): boolean {
    return this.router.url.includes('/statblocks');
  }

  navigateToCards(): void {
    this.router.navigate(['/cards']);
  }

  navigateToStatblocks(): void {
    this.router.navigate(['/statblocks']);
  }
}
