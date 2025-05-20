import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Round1Component } from './round-1.component';

describe('Round1Component', () => {
  let component: Round1Component;
  let fixture: ComponentFixture<Round1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Round1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Round1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
