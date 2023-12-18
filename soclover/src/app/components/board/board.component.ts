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
  topPos = 0;
  leftPos = 0;
  constructor(
    public uiService: UiService,
    public layoutService: LayoutService,
    public modelService: ModelService
  ) {
    layoutService.subject$.subscribe((layout) => {
      console.log('layout', layout);
      this.topPos =
        (layout.viewportHeight - layout.leafScreenHeight) /
        2 /
        layoutService.devicePixelRatio;
      this.leftPos =
        (layout.viewportWidth - layout.leafScreenWidth) /
        2 /
        layoutService.devicePixelRatio;
    });
  }
}
