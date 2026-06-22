import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCommentTemplate } from './new-comment-template';

describe('NewCommentTemplate', () => {
  let component: NewCommentTemplate;
  let fixture: ComponentFixture<NewCommentTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewCommentTemplate],
    }).compileComponents();

    fixture = TestBed.createComponent(NewCommentTemplate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
