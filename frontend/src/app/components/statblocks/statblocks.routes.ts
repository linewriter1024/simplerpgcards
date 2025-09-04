import { Routes } from '@angular/router';
import { StatblocksComponent } from './statblocks.component';

export const statblockRoutes: Routes = [
  { path: '', component: StatblocksComponent },
  { path: 'edit', component: StatblocksComponent },
  { path: 'view', component: StatblocksComponent }
];
