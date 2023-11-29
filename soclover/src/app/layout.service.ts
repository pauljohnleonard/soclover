import { HostListener, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  isTouchDevice?: boolean;
  subject$ = new BehaviorSubject<any>(null);

  constructor() {
    this.detectTouchDevice();
  }

  private detectTouchDevice() {
    this.isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msaxTouchPoints > 0;
  }

  @HostListener('window:resize', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onResize(event: Event) {
    this.detectTouchDevice();
    this.subject$.next(this);
  }

  // Add your service methods here
}
