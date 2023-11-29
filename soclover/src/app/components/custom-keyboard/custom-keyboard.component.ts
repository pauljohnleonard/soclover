// custom-keyboard.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { UiService } from '../../ui.service';

@Component({
  selector: 'soclover-custom-keyboard',
  templateUrl: './custom-keyboard.component.html',
  styleUrls: ['./custom-keyboard.component.scss'],
})
export class CustomKeyboardComponent implements OnInit {
  inputValue = '';
  rows: { disp: string; code: string }[][] = [];
  scale = 'scale(1)';

  constructor(public uiService: UiService) {}
  ngOnInit() {
    const keyboardLayout = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    for (const item of keyboardLayout) {
      const row = [];
      for (const tok of item.split('')) {
        row.push({ disp: tok, code: tok });
      }
      this.rows.push(row);
    }

    this.rows[1].push({ disp: '-', code: '-' });
    this.rows[2] = [{ disp: 'DEL', code: 'Delete' }].concat(this.rows[2]);
    this.rows[2].push({
      disp: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#10004;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
      code: 'Enter',
    });

    // Define the layout of the keyboard
  }

  keyClicked(key: string, event: any) {
    console.log(key);
    this.uiService.handleKeyboardEvent(key);
    event.preventDefault();
    event.stopPropagation();
    // Handle special keys or perform additional actions if needed
    if (key === 'Space') {
      this.inputValue += ' ';
    } else if (key === 'Backspace') {
      this.inputValue = this.inputValue.slice(0, -1);
    } else {
      this.inputValue += key;
    }
  }

  @HostListener('window:resize', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onResize(event: Event) {
    const viewportWidth = window.innerWidth;
    const scaleFactor = viewportWidth / 1280;
    this.scale = `scale(${scaleFactor})`;
  }
}
