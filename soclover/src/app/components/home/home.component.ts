import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AuthService, User } from '@soclover/lib-frontend';
import { Router } from '@angular/router';

@Component({
  selector: 'socolver-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  TITLE = '';

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(9),
  ]);

  constructor(public auth: AuthService, public router: Router) {
    const userStr = sessionStorage.getItem('user');

    try {
      if (userStr) {
        const user: User = JSON.parse(userStr);
        this.name.setValue(user.name);
      }
    } catch (err) {}
  }

  ngOnDestroy(): void {}

  ngOnInit(): void {
    console.log(' init HOME');
    this.splash();

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

  async splash() {
    for (const c of ['B', 'r', 'i', 'd', 'g', 'e']) {
      await of(c).pipe(delay(500)).toPromise();

      this.TITLE += c;
    }
  }

  logon() {
    if (!this.name.value) {
      return;
    }
    this.auth.logon(this.name.value).subscribe((user) => {
      if (user) {
        sessionStorage.setItem('user', JSON.stringify(user));
        this.router.navigateByUrl('/room');
      }
    });
  }
}
