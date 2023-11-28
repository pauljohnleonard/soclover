// custom-keyboard.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'soclover-custom-keyboard',
  templateUrl: './custom-keyboard.component.html',
  styleUrls: ['./custom-keyboard.component.scss'],
})
export class CustomKeyboardComponent implements OnInit {
  inputValue = '';
  rows: string[][] = [];
  ngOnInit() {
    const keyboardLayout = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    for (const item of keyboardLayout) {
      this.rows.push(item.split(''));
    }

    this.rows[0].push('-');
    this.rows[1].push('DEL');
    this.rows[2].push('&nbsp;&nbsp;&nbsp;&#10004;&nbsp;&nbsp;&nbsp;');

    // Define the layout of the keyboard
  }

  keyClicked(key: string) {
    console.log(key);
    // Handle special keys or perform additional actions if needed
    if (key === 'Space') {
      this.inputValue += ' ';
    } else if (key === 'Backspace') {
      this.inputValue = this.inputValue.slice(0, -1);
    } else {
      this.inputValue += key;
    }
  }
}
