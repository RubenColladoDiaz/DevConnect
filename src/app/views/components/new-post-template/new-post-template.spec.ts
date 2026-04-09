import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPostTemplate } from './new-post-template';

describe('NewPostTemplate', () => {
  let component: NewPostTemplate;
  let fixture: ComponentFixture<NewPostTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewPostTemplate],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPostTemplate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
