import { Component } from '@angular/core';
import { LayoutService } from './layout.service';

@Component({
  selector: 'soclover-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'soclover';

  constructor(public layoutService: LayoutService) {}
}
