import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
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
  templateUrl: './statblocks.component.html',
  styleUrl: './statblocks.component.scss'
})
export class StatblocksComponent implements OnInit {
  currentMode: 'edit' | 'view' = 'view';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    // Determine mode from route
    const url = this.router.url;
    if (url.includes('/edit')) {
      this.currentMode = 'edit';
    } else {
      this.currentMode = 'view';
    }
    this.updatePageTitle();
  }

  switchMode(mode: 'edit' | 'view'): void {
    this.currentMode = mode;
    const baseUrl = '/statblocks';
    const targetUrl = mode === 'view' ? baseUrl : `${baseUrl}/${mode}`;
    this.router.navigate([targetUrl]);
    this.updatePageTitle();
  }

  private updatePageTitle(): void {
    let title = 'Statblocks';
    if (this.currentMode === 'edit') {
      title = 'Edit Statblocks';
    } else {
      title = 'View Statblocks';
    }
    this.titleService.setTitle(title);
  }
}
