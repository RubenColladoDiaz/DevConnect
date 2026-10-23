import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCommentTemplate } from './new-comment-template';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PostsService } from '../../../shared/services/posts-service';
import { CodeEditor } from '../code-editor/code-editor';

describe('NewCommentTemplate', () => {
  let component: NewCommentTemplate;
  let fixture: ComponentFixture<NewCommentTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewCommentTemplate, CodeEditor],
      imports: [FormsModule, RouterModule.forRoot([])],
      providers: [
        { provide: PostsService, useValue: { createComment: () => ({ subscribe: () => {} }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewCommentTemplate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds and removes code blocks in comments', () => {
    component.addCodeBlock(0);

    expect(component.contentBlocks.map((block) => block.type)).toEqual(['text', 'code']);
    expect(component.hasContent).toBe(false);

    const codeBlock = component.contentBlocks[1];
    if (codeBlock.type === 'code') {
      codeBlock.content = 'console.log("hello")';
    }
    expect(component.hasContent).toBe(true);

    component.removeBlock(1);
    expect(component.contentBlocks).toEqual([{ type: 'text', content: '' }]);
  });
});
