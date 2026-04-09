import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPostButton } from './new-post-button';

describe('NewPostButton', () => {
  let component: NewPostButton;
  let fixture: ComponentFixture<NewPostButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewPostButton],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPostButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
