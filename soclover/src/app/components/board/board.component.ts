import { AfterViewInit, Component } from '@angular/core';
import { UiService } from '../../ui.service';
import { LayoutService } from '../../layout.service';
import { ModelService } from '../../model.service';
import { Fireworks } from 'fireworks-js';
import { StatusEnum } from '../../leafData';
import { options } from './fireOptions';
@Component({
  selector: 'soclover-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent {
  topPos = 0;
  leftPos = 0;
  fireworks?: Fireworks;
  container: any;

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

    uiService.status$.subscribe((action) => {
      console.log('action', action);
      if (action === StatusEnum.SOLVED) {
        this.fireworksLaunch();
      }
    });
  }

  stopFireworks() {
    this.fireworks?.stop(true);
    this.container.style.pointerEvents = 'none';
    this.container.removeEventListener('mousedown', this.handleMouse);
    this.fireworks = undefined;
  }

  ngOnDestory() {
    this.stopFireworks();
  }

  handleMouse(e: MouseEvent) {
    this.stopFireworks();
  }

  fireworksLaunch() {
    console.log('fireworks');
    this.container = document.getElementById('fireworks') as HTMLElement;
    this.fireworks = new Fireworks(this.container, options);
    this.fireworks.start();

    // Set pointer-events back to the default (auto)
    this.container.style.pointerEvents = 'auto';

    // Add event listeners for mouse events
    this.container.addEventListener('mousedown', this.handleMouse.bind(this));
  }
}
