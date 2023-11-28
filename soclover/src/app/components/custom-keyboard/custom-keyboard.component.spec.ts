import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomKeyboardComponent } from './custom-keyboard.component';

describe('CustomKeyboardComponent', () => {
  let component: CustomKeyboardComponent;
  let fixture: ComponentFixture<CustomKeyboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomKeyboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomKeyboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
