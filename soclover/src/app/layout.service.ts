import { HostListener, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  isTouchDevice?: boolean;
  subject$ = new BehaviorSubject<any>(null);
  isFullScreen = false;
  constructor() {
    this.detectTouchDevice();
    // this.openFullscreen();
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

  openFullscreen() {
    const dd = document as any;
    const elem = document.getElementById('world') as any;

    if (!this.isFullScreen) {
      console.log(' FULL SCREEN ');
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        /* IE/Edge */
        elem.msRequestFullscreen();
      }

      // added thos because it was not updating the layout.
      // setTimeout(() => {
      //   this.video.resize(this.vidWidth, window.innerHeight);
      //   this.appDiv.nativeElement.style.width =
      //     window.innerWidth -
      //     this.vidWidth -
      //     this.dividerDiv.nativeElement.style.width +
      //     'px';
      // }, 1000);
      this.isFullScreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (dd.mozCancelFullScreen) {
        /* Firefox */
        dd.mozCancelFullScreen();
      } else if (dd.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        dd.webkitExitFullscreen();
      } else if (dd.msExitFullscreen) {
        /* IE/Edge */
        dd.msExitFullscreen();
      }
      this.isFullScreen = false;
    }
  }
  // Add your service methods here
}
