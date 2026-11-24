import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';

import { ModelService } from '../../model.service';
import { ConnectionService } from '../../connection.service';

import { UiService } from '../../ui.service';
import { Button } from '../../leafData';
import { RequestService } from '../../request.service';
import { Leaf } from '@soclover/lib-soclover';

export type LeafSummary = Pick<
  Leaf,
  '_id' | 'playerName' | 'solvers' | 'createdAt'
>;

@Component({
  selector: 'soclover-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  createButtons!: Button[];
  browseButton!: Button;
  recentLeaves: LeafSummary[] = [];
  recentLimit = 12;
  generating = false;
  generateError = '';
  generateLeafEnabled = false;

  constructor(
    public connection: ConnectionService,
    public router: Router,
    public modelService: ModelService,
    public uiService: UiService,
    private api: RequestService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.modelService.rebuildButtons$.subscribe(() => {
      this.makeCreateButtons();
      this.refreshRecentSolvedFlags();
      this.cdr.detectChanges();
    });
    this.makeCreateButtons();
    this.loadFeatures();
    this.loadRecentLeaves();

    this.browseButton = {
      text: '',
      id: 'library',
      click: async () => {
        this.router.navigateByUrl('/browse');
      },
    };
  }

  async loadFeatures() {
    try {
      const features = (await this.api.get('/features')) as {
        generateLeaf?: boolean;
      };
      this.generateLeafEnabled = !!features?.generateLeaf;
    } catch (err) {
      console.error(err);
      this.generateLeafEnabled = false;
    }
    this.makeCreateButtons();
    this.cdr.detectChanges();
  }

  async loadRecentLeaves() {
    try {
      const leaves = (await this.api.get('/fetch-leaves')) as LeafSummary[];
      this.recentLeaves = (leaves || []).map((l) => ({
        ...l,
        _id: l._id ? String(l._id) : l._id,
        solvers: l.solvers || [],
      }));
      this.cdr.detectChanges();
    } catch (err) {
      console.error(err);
    }
  }

  /** After STATE/REPORT_SOLVED, merge solvers from live game into the list */
  refreshRecentSolvedFlags() {
    for (const summary of this.recentLeaves) {
      const live =
        (summary._id &&
          this.modelService.game?.leaves.find(
            (l) => l._id && String(l._id) === String(summary._id)
          )) ||
        this.modelService.leafByAuthor(summary.playerName || '');
      if (live?.solvers) {
        summary.solvers = [...live.solvers];
      }
    }
  }

  makeCreateButtons() {
    const buttons: Button[] = [
      {
        text: '',
        id: 'plant',
        click: async () => {
          await this.uiService.makeNewLeaf();
        },
      },
    ];
    if (this.generateLeafEnabled) {
      buttons.push({
        text: '',
        id: 'cognition',
        disabled: this.generating,
        click: async () => {
          await this.generatePuzzle();
        },
      });
    }
    this.createButtons = buttons;
  }

  async generatePuzzle() {
    if (this.generating) {
      return;
    }
    this.generating = true;
    this.generateError = '';
    this.makeCreateButtons();
    this.cdr.detectChanges();

    try {
      const leaf = (await this.api.post('/generate-leaf')) as Leaf;
      if (!leaf?.cards?.length || !leaf?.clues?.length) {
        throw new Error('Invalid generated leaf');
      }
      this.uiService.openGeneratedLeaf(leaf);
    } catch (err: any) {
      console.error(err);
      const status = err?.status;
      // Key missing/rejected — hide the AI button rather than leaving a dead control
      if (status === 401 || status === 403 || status === 503) {
        this.generateLeafEnabled = false;
      }
      this.generateError =
        err?.error?.error ||
        err?.message ||
        'Could not generate a puzzle. Check OPENAI_API_KEY on the server.';
    } finally {
      this.generating = false;
      this.makeCreateButtons();
      this.cdr.detectChanges();
    }
  }

  get onlinePlayers(): string[] {
    return this.modelService.activePlayers || [];
  }

  get visibleRecent(): LeafSummary[] {
    return this.recentLeaves.slice(0, this.recentLimit);
  }

  solvingLabel(player: string): string {
    const author = this.modelService.solvingLeafAuthor(player);
    if (!author) {
      return 'idle';
    }
    const leaf = this.modelService.leafByAuthor(author);
    const n = leaf?.guesses?.[player] || 0;
    if (n > 0) {
      return `solving ${author}'s leaf · ${n} guess${n === 1 ? '' : 'es'}`;
    }
    return `solving ${author}'s leaf`;
  }

  canJoin(player: string): boolean {
    const author = this.modelService.solvingLeafAuthor(player);
    if (!author) {
      return false;
    }
    const mine = this.modelService.solvingLeafAuthor(this.modelService.name);
    if (mine === author) {
      return false;
    }
    return !!this.modelService.leafByAuthor(author);
  }

  joinPlayer(player: string) {
    const author = this.modelService.solvingLeafAuthor(player);
    if (!author) {
      return;
    }
    const leaf = this.modelService.leafByAuthor(author);
    if (!leaf) {
      return;
    }
    // Case 3: join that player's shared board
    this.uiService.setSolveLeaf(leaf, { joinHost: player });
    this.modelService.selectSolveLeafBroadcast(leaf);
  }

  iSolved(leaf: LeafSummary): boolean {
    const name = this.modelService.name;
    return !!name && !!leaf.solvers?.includes(name);
  }

  formatDate(d?: string): string {
    if (!d) {
      return '';
    }
    return new Date(d).toLocaleDateString();
  }

  async openRecent(summary: LeafSummary) {
    if (!summary._id) {
      return;
    }
    try {
      const leaf = (await this.api.get(`/fetch-leaf/${summary._id}`)) as Leaf;
      if (leaf?._id) {
        leaf._id = String(leaf._id);
      }
      const live = this.modelService.openLeafForSolve(leaf);
      this.uiService.setSolveLeaf(live);
    } catch (err) {
      console.error(err);
    }
  }
}
