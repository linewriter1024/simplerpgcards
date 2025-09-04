import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StatblockEditComponent } from './statblock-edit/statblock-edit.component';
import { StatblockViewComponent } from './statblock-view/statblock-view.component';

@Component({
  selector: 'app-statblocks',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatToolbarModule,
    StatblockEditComponent,
    StatblockViewComponent
  ],
  template: `
    <div class="statblocks-container">
      <mat-toolbar class="mode-toolbar">
        <span>Statblocks</span>
        <span class="spacer"></span>
        
        <button mat-raised-button 
                [color]="currentMode === 'edit' ? 'accent' : 'primary'"
                (click)="switchMode('edit')"
                class="mode-button">
          <mat-icon>edit</mat-icon>
          Edit Mode
        </button>
        
        <button mat-raised-button 
                [color]="currentMode === 'view' ? 'accent' : 'primary'"
                (click)="switchMode('view')"
                class="mode-button">
          <mat-icon>view_list</mat-icon>
          View Mode
        </button>
      </mat-toolbar>

      <div class="content">
        @if (currentMode === 'edit') {
          <app-statblock-edit></app-statblock-edit>
        } @else {
          <app-statblock-view></app-statblock-view>
        }
      </div>
    </div>
  `,
  styles: [`
    .statblocks-container {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .mode-toolbar {
      background-color: #424242;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .mode-button {
      margin-left: 16px;
      
      mat-icon {
        margin-right: 8px;
      }
    }

    .content {
      flex: 1;
      padding: 16px;
    }
  `]
})
export class StatblocksComponent implements OnInit {
  currentMode: 'edit' | 'view' = 'edit';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Determine mode from route
    const url = this.router.url;
    if (url.includes('/view')) {
      this.currentMode = 'view';
    } else {
      this.currentMode = 'edit';
    }
  }

  switchMode(mode: 'edit' | 'view'): void {
    this.currentMode = mode;
    const baseUrl = '/statblocks';
    const targetUrl = mode === 'edit' ? baseUrl : `${baseUrl}/${mode}`;
    this.router.navigate([targetUrl]);
  }
}
