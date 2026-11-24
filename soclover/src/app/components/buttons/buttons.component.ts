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

  buttonWidth(button: Button): number {
    return button.label ? 52 : 30;
  }

  buttonTransform(button: Button, i: number): string {
    if (button.right) {
      return `translate(${leafData.boardWidth - this.buttonWidth(button)},0)`;
    }

    let x = 8;
    for (let j = 0; j < i; j++) {
      x += this.buttonWidth(this.buttons[j]) + 10;
    }
    return 'translate(' + x + ',0)';
  }
}
