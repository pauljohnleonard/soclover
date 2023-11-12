import { Injectable } from '@angular/core';
import { BehaviorSubject, of, Observable } from 'rxjs';
import { User } from './users';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userSubject = new BehaviorSubject<User>(null);

  constructor() {}

  logon(name: string): Observable<User> {
    const user: User = { name };
    this.userSubject.next(user);
    return of(user);
  }

  logout() {
    this.userSubject.next(null);
  }
}
