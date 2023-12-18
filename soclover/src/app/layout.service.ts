import { HostListener, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { leafData } from './leafData';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  // [x: string]: number;
  isTouchDevice?: boolean;
  subject$ = new BehaviorSubject<any>(null);
  isFullScreen = false;
  viewportHeight = 0;
  viewportWidth = 0;
  scaleFactor = 1;
  leafScreenWidth = 0;
  leafScreenHeight = 0;
  devicePixelRatio: number;
  constructor() {
    this.devicePixelRatio = window.devicePixelRatio || 1;
    leafData.boardWidth = leafData._boardWidth * devicePixelRatio;
    leafData.boardHeight = leafData._boardHeight * devicePixelRatio;
    console.log('devicePixelRatio', devicePixelRatio);
    this.onResize();
    window.addEventListener('resize', () => {
      this.onResize();
    });
  }

  private detectTouchDevice() {
    this.isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msaxTouchPoints > 0;
  }

  onResize() {
    this.detectTouchDevice();
    this.viewportHeight = window.innerHeight * this.devicePixelRatio;
    this.viewportWidth = window.innerWidth * this.devicePixelRatio;
    this.scaleFactor = Math.min(
      this.viewportWidth / leafData.boardWidth,
      this.viewportHeight / leafData.boardHeight
    );

    // console.log('scaleFactor', this.scaleFactor);
    this.leafScreenWidth = leafData.boardWidth * this.scaleFactor;
    this.leafScreenHeight = leafData.boardHeight * this.scaleFactor;

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
