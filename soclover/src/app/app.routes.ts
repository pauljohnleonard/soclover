import { Route } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { inject } from '@angular/core';
import { ConnectionService } from './connection.service';
import { BoardComponent } from './components/board/board.component';

export const appRoutes: Route[] = [
  {
    canActivate: [() => inject(ConnectionService).canActivate()],
    path: 'board',
    component: BoardComponent,
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
