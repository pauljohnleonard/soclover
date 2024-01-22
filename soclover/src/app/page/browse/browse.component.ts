import { Component, OnInit, ViewChild } from '@angular/core';
import { RequestService } from '../../request.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

import { Leaf } from '@soclover/lib-soclover';
import { MatTableDataSource } from '@angular/material/table';
import { UiService } from '../../ui.service';

@Component({
  selector: 'soclover-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss'],
})
export class BrowseComponent implements OnInit {
  @ViewChild('paginator', { static: true }) paginator!: MatPaginator;
  displayedColumns = ['date', 'name', 'download'];

  leaves?: Leaf[];
  length = 50;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25];

  hidePageSize = false;
  showPageSizeOptions = true;
  showFirstLastButtons = true;
  disabled = false;

  pageEvent?: PageEvent;

  dataSource = new MatTableDataSource<Leaf>([]);

  constructor(public api: RequestService, public ui: UiService) {}

  async ngOnInit() {
    this.leaves = await this.api.get('/fetch-leaves');
    this.dataSource = new MatTableDataSource<Leaf>(this.leaves);
    this.dataSource.paginator = this.paginator;
  }

  fetchLeaf(id: string) {
    this.api.get(`/fetch-leaf/${id}`).then((leaf) => {
      console.log(leaf);
      this.ui.setSolveLeaf(leaf);
    });
  }

  formatDate(d: string): string {
    const date = new Date(d);
    return date.toLocaleDateString();
  }
}
