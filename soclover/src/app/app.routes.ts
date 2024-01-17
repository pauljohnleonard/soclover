import { Route } from '@angular/router';

import { HomeComponent } from './page/home/home.component';
import { inject } from '@angular/core';
import { ConnectionService } from './connection.service';
import { LogonComponent } from './components/logon/logon.component';
import { BoardComponent } from './page/board/board.component';
import { BrowseComponent } from './page/browse/browse.component';

export const appRoutes: Route[] = [
  {
    canActivate: [() => inject(ConnectionService).canActivate()],
    path: 'solve',
    component: BoardComponent,
  },

  {
    canActivate: [() => inject(ConnectionService).canActivate()],
    path: 'makeleaf',
    component: BoardComponent,
  },

  {
    canActivate: [() => inject(ConnectionService).canActivate()],
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'logon',
    component: LogonComponent,
  },
  {
    canActivate: [() => inject(ConnectionService).canActivate()],
    path: 'browse',
    component: BrowseComponent,
  },

  {
    path: '**',
    redirectTo: 'logon',
  },
];
