import { Component, Input } from '@angular/core';

import { UiService } from '../../ui.service';
import { Button, leafData } from '../../leafData';

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

  buttonTransform(button: Button, i: number): string {
    if (!button.right) {
      return 'translate(' + 40 * (i + 0.2) + ',0)';
    }

    return `translate(${leafData.boardWidth - 40},0)`;
  }
}
