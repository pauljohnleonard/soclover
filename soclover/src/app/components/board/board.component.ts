import { Component } from '@angular/core';
import { UiService } from '../../ui.service';
import { LayoutService } from '../../layout.service';
import { ModelService } from '../../model.service';

@Component({
  selector: 'soclover-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent {
  constructor(
    public uiService: UiService,
    public layoutService: LayoutService,
    public modelService: ModelService
  ) {}
}
