import { Component, Input } from '@angular/core';

import { UiService } from '../../ui.service';
import { Button } from '../leaf/leafData';

@Component({
  selector: 'soclover-buttons',
  templateUrl: './buttons.component.html',
  styleUrls: ['./buttons.component.scss'],
})
export class ButtonsComponent {
  buttonFontSize = '10px';

  @Input() buttons: Button[] = [];
  @Input() showCloser = false;
  constructor(public uiService: UiService) {}
}
