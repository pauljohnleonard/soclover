import { async, TestBed } from '@angular/core/testing';
import { LibFrontendModule } from './lib-frontend.module';

describe('LibFrontendModule', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [LibFrontendModule]
    }).compileComponents();
  }));

  it('should create', () => {
    expect(LibFrontendModule).toBeDefined();
  });
});
