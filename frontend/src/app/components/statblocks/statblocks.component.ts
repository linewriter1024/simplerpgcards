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
  templateUrl: './statblocks.component.html',
  styleUrl: './statblocks.component.scss'
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
