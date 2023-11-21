import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'soclover-mydialog',
  templateUrl: './mydialog.component.html',
  styleUrls: ['./mydialog.component.scss'],
})
export class MydialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<MydialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.data = data;
  }

  ngOnInit(): void {
    null;
  }
}
