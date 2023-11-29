import { Component } from '@angular/core';

import { UiService } from '../../ui.service';

@Component({
  selector: 'soclover-buttons',
  templateUrl: './buttons.component.html',
  styleUrls: ['./buttons.component.scss'],
})
export class ButtonsComponent {
  buttonFontSize = '10px';

  constructor(public uiService: UiService) {}
}
