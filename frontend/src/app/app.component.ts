import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CardListComponent } from './components/card-list/card-list.component';
import { CardFormComponent } from './components/card-form/card-form.component';

@Component({
    selector: 'app-root',
    imports: [CommonModule, CardListComponent],
    template: `
    <div class="app-container">
      <app-card-list></app-card-list>
    </div>
  `,
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'RPG Card Manager';
  
  constructor(private dialog: MatDialog) {}
}
