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
  gameButtons!: Button[];
  browseButton!: Button;
  private _puzzleButtons?: Button[];

  constructor(
    public connection: ConnectionService,
    public router: Router,
    public modelService: ModelService,
    public uiService: UiService
  ) {}

  ngOnInit(): void {
    this.modelService.rebuildButtons$.subscribe(() => {
      this.makeGameButtons();
    });
    this.makeGameButtons();

    this.browseButton = {
      text: '',
      id: 'library',

      click: async () => {
        this.router.navigateByUrl('/browse');
      },
    };
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

  makeGameButtons() {
    this.gameButtons = [
      {
        text: 'new',
        id: 'refresh',

        click: async () => {
          if (confirm('Are you sure to start a new game ?')) {
            await this.modelService.newGame();
          }
        },
      },

      {
        text: this.modelService.soloMode ? 'solo' : 'team',
        id: this.modelService.soloMode ? 'person' : 'group',

        click: async () => {
          await this.modelService.toggleMode();
        },
      },
    ];
  }

  get puzzleButtons() {
    return this._puzzleButtons || this.buildPuzzleButtons();
  }

  buildPuzzleButtons() {
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
    this._puzzleButtons = buttons;
    return buttons;
  }
}
