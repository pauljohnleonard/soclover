import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HelpPage, helpForUrl } from '../../helpContent';

@Component({
  selector: 'soclover-help-overlay',
  templateUrl: './help-overlay.component.html',
  styleUrls: ['./help-overlay.component.scss'],
})
export class HelpOverlayComponent implements OnInit {
  open = false;
  page: HelpPage = helpForUrl('/logon');

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.refresh(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.refresh(e.urlAfterRedirects || e.url));
  }

  private refresh(url: string) {
    this.page = helpForUrl(url);
    this.open = false;
  }

  show() {
    this.page = helpForUrl(this.router.url);
    this.open = true;
  }

  dismiss() {
    this.open = false;
  }
}
