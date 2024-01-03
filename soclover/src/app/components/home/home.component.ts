import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';

import { ModelService } from '../../model.service';
import { ConnectionService } from '../../connection.service';

import { UiService } from '../../ui.service';
import { Button } from '../../leafData';

@Component({
  selector: 'soclover-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  topButtons!: Button[];

  constructor(
    public connection: ConnectionService,
    public router: Router,
    public modelService: ModelService,
    public uiService: UiService
  ) {}

  ngOnInit(): void {
    this.topButtons = [
      {
        text: '',
        id: 'refresh',

        click: async () => {
          if (confirm('Are you sure to start a new game ?')) {
            await this.modelService.newGame();
          }
        },
      },
    ];
  }

  get newleafButtons() {
    const buttons: Button[] = [];
    if (!this.modelService.mySettingLeaf?.clues) {
      buttons.push({
        text: '',
        id: 'plant',
        click: async () => {
          await this.uiService.makeNewLeaf();
        },
      });
    }
    return buttons;
  }

  get puzzleButtons() {
    const buttons: Button[] = [];
    for (const leaf of this.modelService.game?.leaves || []) {
      const click = () => {
        this.uiService.setSolveLeaf(leaf);
        this.modelService.selectSolveLeafBroadcast(leaf);
      };
      const button: Button = {
        text: leaf.playerName as string,
        id: 'download',
        leaf: leaf,
        click,
      };

      buttons.push(button);
    }
    return buttons;
  }
}
