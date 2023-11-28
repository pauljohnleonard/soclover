import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  isTouchDevice: boolean;

  constructor() {
    this.isTouchDevice = this.detectTouchDevice();
  }

  private detectTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msaxTouchPoints > 0
    );
  }

  // Add your service methods here
}
