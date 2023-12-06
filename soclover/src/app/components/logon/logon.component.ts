import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';

import { ModelService } from '../../model/model.service';
import { ConnectionService } from '../../connection.service';
import { environment } from 'environments/environment';

@Component({
  selector: 'soclover-logon',
  templateUrl: './logon.component.html',
  styleUrls: ['./logon.component.scss'],
})
export class LogonComponent implements OnInit {
  @ViewChild('hiddenInput') hiddenInput!: ElementRef;

  TITLE = '';

  environment = environment;

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(9),
  ]);
  text: string | undefined;

  constructor(
    public connection: ConnectionService,
    public router: Router,
    public modelService: ModelService
  ) {
    const userStr = sessionStorage.getItem('userName');

    try {
      if (userStr) {
        this.name.setValue(userStr);
      }
    } catch (err) {
      null;
    }
  }

  ngOnInit(): void {
    // console.log(' init HOME');
    // this.splash();

    this.name.valueChanges.subscribe((val) => {
      if (!val) return;

      let str = '';
      if (val.length > 0) {
        str = val[0].toUpperCase();
      }
      if (val.length > 1) {
        str += val.substr(1).toLowerCase();
      }
      this.name.setValue(str, { emitEvent: false });
    });
  }

  // async splash() {
  //   for (const c of ['B', 'r', 'i', 'd', 'g', 'e']) {
  //     await of(c).pipe(delay(500)).toPromise();

  //     this.TITLE += c;
  //   }
  // }

  async logon() {
    if (!this.name.value) {
      return;
    }
    this.connection.logon(this.name.value);

    await this.connection.waitTillReady();

    this.text = JSON.stringify(this.connection.ws);
  }

  showKeyboard() {
    console.log('showKeyboard');
    // this.hiddenInput.nativeElement.focus();
    this.hiddenInput.nativeElement.click();
  }
}
