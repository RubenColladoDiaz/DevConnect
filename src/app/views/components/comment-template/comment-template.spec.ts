import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { CommentTemplate } from './comment-template';

describe('CommentTemplate', () => {
  let component: CommentTemplate;
  let fixture: ComponentFixture<CommentTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommentTemplate],
      imports: [RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentTemplate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
