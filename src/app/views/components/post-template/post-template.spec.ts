import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../shared/services/auth-service';
import { PostsService } from '../../../shared/services/posts-service';
import { Post } from '../../../shared/types/Post';

import { PostTemplate } from './post-template';

describe('PostTemplate', () => {
  let component: PostTemplate;
  let fixture: ComponentFixture<PostTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PostTemplate],
      imports: [RouterModule.forRoot([])],
      providers: [
        {
          provide: PostsService,
          useValue: {
            registerPostView: () => of({ views: 1 }),
            toggleAcceptedAnswer: () => of({ acceptedAnswerIds: ['answer-id'] }),
          },
        },
        { provide: AuthService, useValue: { user: () => ({ userId: 3, username: 'author' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostTemplate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows whether a post date is today', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    expect(component.isToday(today)).toBe(true);
    expect(component.isToday(yesterday)).toBe(false);
    expect(component.isToday(undefined)).toBe(false);
  });

  it('updates the displayed view count when a post is viewed', () => {
    const post: Post = {
      _id: 'post-id',
      username: 'author',
      content: '',
      reposts: 0,
      views: 0,
      tags: [],
      createdAt: new Date(),
      likes: 0,
      comments: [],
    };
    component.post.set(post);

    component.registerView();

    expect(component.post()?.views).toBe(1);
  });

  it('only allows the question author to manage helpful answers', () => {
    component.post.set({
      _id: 'post-id',
      username: 'author',
      authorId: 3,
      type: 'question',
      content: '',
      reposts: 0,
      views: 0,
      tags: [],
      createdAt: new Date(),
      likes: 0,
      comments: [],
    });

    expect(component.canManageAnswers()).toBe(true);

    component.post.update((post) => {
      if (!post) return post;
      return { ...post, authorId: 4 };
    });
    expect(component.canManageAnswers()).toBe(false);
  });

  it('updates helpful answers after marking one', () => {
    component.post.set({
      _id: 'post-id',
      username: 'author',
      authorId: 3,
      type: 'question',
      content: '',
      reposts: 0,
      views: 0,
      tags: [],
      createdAt: new Date(),
      likes: 0,
      comments: [{ answerId: 'answer-id', username: 'helper', content: 'Answer' }],
    });

    component.toggleAcceptedAnswer('answer-id');

    expect(component.isAcceptedAnswer('answer-id')).toBe(true);
  });
});
