import { Route } from '@angular/router';
import { LeafComponent } from './components/leaf/leaf.component';
import { HomeComponent } from './components/home/home.component';
import { inject } from '@angular/core';
import { ConnectionService } from './connection.service';

export const appRoutes: Route[] = [
  {
    canActivate: [() => inject(ConnectionService).canActivate()],
    path: 'leaf',
    component: LeafComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
