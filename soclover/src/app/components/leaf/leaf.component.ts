import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'soclover-leaf',
  templateUrl: './leaf.component.html',
  styleUrls: ['./leaf.component.scss'],
})
export class LeafComponent implements OnInit {
  cx = 70;
  rad = 35;
  tweakY = 20;
  rHub = 70;
  transform!: string;
  cardWidth = 70;
  cardPad = 2;
  cardRad = 6;
  ngOnInit() {
    this.setViewportDimensions();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.setViewportDimensions();
  }

  private setViewportDimensions() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scaleFactor = Math.min(viewportHeight, viewportWidth) / 300;
    this.transform = `scale(${scaleFactor})`;
  }
}
