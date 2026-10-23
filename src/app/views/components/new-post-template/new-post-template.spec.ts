import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { PostsService } from '../../../shared/services/posts-service';

import { NewPostTemplate } from './new-post-template';

describe('NewPostTemplate', () => {
  let component: NewPostTemplate;
  let fixture: ComponentFixture<NewPostTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewPostTemplate],
      imports: [FormsModule],
      providers: [{ provide: PostsService, useValue: { createPost: () => of({ post: {} }) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPostTemplate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds text and code blocks between existing blocks', () => {
    component.addCodeBlock(0);
    component.addTextBlock(1);

    expect(component.contentBlocks.map((block) => block.type)).toEqual(['text', 'code', 'text']);
    expect(component.hasContent).toBe(false);
  });
});
