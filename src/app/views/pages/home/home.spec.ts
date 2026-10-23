import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '../../../shared/services/auth-service';
import { PostsService } from '../../../shared/services/posts-service';
import { UsersService } from '../../../shared/services/users-service';
import { TopFollowerUser } from '../../../shared/types/User';

import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Home],
      providers: [
        { provide: AuthService, useValue: { user: signal({ username: '' }) } },
        {
          provide: PostsService,
          useValue: {
            getAllPosts: () => of({ posts: [] }),
            getTrendingLanguages: () => of([]),
          },
        },
        {
          provide: UsersService,
          useValue: {
            GetTopFollowers: () => of([]),
            GetTopProfileViews: () => of([]),
            GetTopQuestionSolvers: () => of([]),
            GetFollowingPresence: () => of([]),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('refreshes trending languages from the latest server ranking', () => {
    const languages = [
      { language: 'TypeScript' as const, count: 5 },
      { language: 'Python' as const, count: 3 },
    ];
    const postsService = TestBed.inject(PostsService);
    postsService.getTrendingLanguages = () => of(languages);

    component.getTrendingLanguages();

    expect(component.trendingLanguages).toEqual(languages);
  });

  it('loads the top users by followers', () => {
    const users: TopFollowerUser[] = [
      {
        userId: 1,
        username: 'popular-dev',
        display_name: 'Popular Developer',
        avatar_url: '',
        followersCount: 12,
      },
    ];
    const usersService = TestBed.inject(UsersService);
    usersService.GetTopFollowers = () => of(users);

    component.getTopFollowers();

    expect(component.topFollowers).toEqual(users);
  });

  it('loads the top users by profile views', () => {
    const users = [
      {
        userId: 1,
        username: 'popular-dev',
        display_name: 'Popular Developer',
        avatar_url: '',
        profile_views: 23,
      },
    ];
    const usersService = TestBed.inject(UsersService);
    usersService.GetTopProfileViews = () => of(users);

    component.getTopProfileViews();

    expect(component.topProfileViews).toEqual(users);
  });

  it('loads users who have marked helpful answers', () => {
    const users = [
      {
        userId: 2,
        username: 'helpful-dev',
        display_name: 'Helpful Developer',
        avatar_url: '',
        solvedQuestionCount: 4,
      },
    ];
    const usersService = TestBed.inject(UsersService);
    usersService.GetTopQuestionSolvers = () => of(users);

    component.getTopQuestionSolvers();

    expect(component.topQuestionSolvers).toEqual(users);
  });

  it('loads online and offline status for followed users', () => {
    const users = [
      {
        userId: 2,
        username: 'online-dev',
        display_name: 'Online Developer',
        avatar_url: '',
        online: true,
      },
      {
        userId: 3,
        username: 'offline-dev',
        display_name: 'Offline Developer',
        avatar_url: '',
        online: false,
      },
    ];
    const usersService = TestBed.inject(UsersService);
    usersService.GetFollowingPresence = () => of(users);
    component.user.set({
      userId: 1,
      username: 'me',
      display_name: 'Me',
      bio: '',
      stack: [],
      followers: [],
      email: '',
      password: '',
      location: '',
      status: 'active',
      avatar_url: '',
      created_at: '',
    });

    component.getFollowingPresence();

    expect(component.followingPresence).toEqual(users);
  });
});
