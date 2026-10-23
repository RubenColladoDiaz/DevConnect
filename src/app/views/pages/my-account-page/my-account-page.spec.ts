import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, ParamMap, RouterModule } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';
import { AuthService } from '../../../shared/services/auth-service';
import { PostsService } from '../../../shared/services/posts-service';
import { UsersService } from '../../../shared/services/users-service';
import { ComponentsModule } from '../../../shared/modules/components/components-module';
import { User } from '../../../shared/types/User';

import { MyAccountPage } from './my-account-page';

describe('MyAccountPage', () => {
  let component: MyAccountPage;
  let fixture: ComponentFixture<MyAccountPage>;
  let routeParams: BehaviorSubject<ParamMap>;
  let ownUser: WritableSignal<User>;

  beforeEach(async () => {
    routeParams = new BehaviorSubject(convertToParamMap({}));
    ownUser = signal({
      userId: 1,
      username: 'me',
      display_name: 'My account',
      bio: '',
      stack: [],
      followers: [],
      email: '',
      password: '',
      locatinon: '',
      status: '',
      avatar_url: '',
      created_at: '',
    });

    await TestBed.configureTestingModule({
      declarations: [MyAccountPage],
      imports: [CommonModule, ComponentsModule, FormsModule, RouterModule.forRoot([])],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: routeParams.asObservable() },
        },
        {
          provide: AuthService,
          useValue: {
            user: ownUser,
          },
        },
        {
          provide: PostsService,
          useValue: {
            getAllInfoFromUser: (username: string) =>
              of({
                user: { ...ownUser(), username, userId: 2, display_name: 'Other account' },
                posts: [],
                likes: 0,
                comments: 0,
                followers: 0,
                reposts: [],
              }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            GetUserConnections: () => of({ followers: [], following: [] }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyAccountPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the current account after navigating from another profile', () => {
    routeParams.next(convertToParamMap({ username: 'another-user' }));
    expect(component.user().username).toBe('another-user');

    routeParams.next(convertToParamMap({ username: 'me' }));
    expect(component.user()).toBe(ownUser());
  });
});
