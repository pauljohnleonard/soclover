import { Component, OnInit } from '@angular/core';

import { ConnectionService, User } from '@soclover/lib-frontend';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  standalone: true,
  selector: 'soclover-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [MatFormFieldModule, ReactiveFormsModule, MatInputModule],
})
export class HomeComponent implements OnInit {
  TITLE = '';

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(9),
  ]);

  constructor(public connection: ConnectionService, public router: Router) {
    const userStr = sessionStorage.getItem('user');

    try {
      if (userStr) {
        const user: User = JSON.parse(userStr);
        this.name.setValue(user.name);
      }
    } catch (err) {
      null;
    }
  }

  ngOnInit(): void {
    console.log(' init HOME');
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
    const user = this.connection.logon(this.name.value);
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
      this.router.navigateByUrl('/leaf');
    }
  }
}