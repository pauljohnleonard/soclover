import { Route } from '@angular/router';
import { LeafComponent } from './components/leaf/leaf.component';

export const appRoutes: Route[] = [
  {
    path: 'home',
    component: LeafComponent,
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
