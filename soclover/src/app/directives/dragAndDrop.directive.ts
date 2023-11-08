import { Directive, HostListener, Renderer2, ElementRef } from '@angular/core';

@Directive({
  selector: '[appDragAndDrop]',
})
export class DragAndDropDirective {
  private isDragging = false;
  private initialX = 0;
  private initialY = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    console.log('grab', event);
    this.isDragging = true;
    this.initialX =
      event.clientX - this.el.nativeElement.getBoundingClientRect().left;
    this.initialY =
      event.clientY - this.el.nativeElement.getBoundingClientRect().top;
    // Prevent the default behavior of the click event (text selection).
    event.preventDefault();

    // Stop event propagation to prevent it from reaching parent elements.
    event.stopPropagation();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    console.log('move1');
    if (this.isDragging) {
      const newX = event.clientX - this.initialX;
      const newY = event.clientY - this.initialY;
      console.log('move2', newX, newY);
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    const newX = event.clientX - this.initialX;
    const newY = event.clientY - this.initialY;
    console.log('drop', newX, newY);
    this.isDragging = false;
  }
}
