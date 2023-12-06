import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';

import { ModelService } from '../../model/model.service';
import { ConnectionService } from '../../connection.service';

import { UiService } from '../../ui.service';

@Component({
  selector: 'soclover-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(
    public connection: ConnectionService,
    public router: Router,
    public modelService: ModelService,
    public uiService: UiService
  ) {}

  ngOnInit(): void {
    null;
  }
}
