import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Round2Component } from './round-2.component';

describe('Round2Component', () => {
  let component: Round2Component;
  let fixture: ComponentFixture<Round2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Round2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Round2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
