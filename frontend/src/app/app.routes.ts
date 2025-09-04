import { Routes } from '@angular/router';
import { CardListComponent } from './components/card-list/card-list.component';
import { StatblocksComponent } from './components/statblocks/statblocks.component';

export const routes: Routes = [
  { path: '', redirectTo: '/cards', pathMatch: 'full' },
  { path: 'cards', component: CardListComponent },
  { path: 'statblocks', component: StatblocksComponent },
  { path: 'statblocks/edit', component: StatblocksComponent },
  { path: 'statblocks/view', component: StatblocksComponent },
  { path: '**', redirectTo: '/cards' }
];
