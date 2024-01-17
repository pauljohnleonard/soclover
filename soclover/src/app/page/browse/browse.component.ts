import { Component, OnInit, ViewChild } from '@angular/core';
import { RequestService } from '../../request.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

import { Leaf } from '@soclover/lib-soclover';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'soclover-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss'],
})
export class BrowseComponent implements OnInit {
  @ViewChild('paginator', { static: true }) paginator!: MatPaginator;
  displayedColumns = ['date', 'name'];

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

  constructor(public api: RequestService) {}

  async ngOnInit() {
    this.leaves = await this.api.get('/fetch-leaves');
    this.dataSource = new MatTableDataSource<Leaf>(this.leaves);
    this.dataSource.paginator = this.paginator;
  }

  // handlePageEvent(e: PageEvent) {
  //   this.pageEvent = e;
  //   this.length = e.length;
  //   this.pageSize = e.pageSize;
  //   this.pageIndex = e.pageIndex;
  // }

  // setPageSizeOptions(setPageSizeOptionsInput: string) {
  //   if (setPageSizeOptionsInput) {
  //     this.pageSizeOptions = setPageSizeOptionsInput
  //       .split(',')
  //       .map((str) => +str);
  //   }
  // }

  formatDate(d: string): string {
    const date = new Date(d);
    return date.toLocaleDateString();
  }
}
