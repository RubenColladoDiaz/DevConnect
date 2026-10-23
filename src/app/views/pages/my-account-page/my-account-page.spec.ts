import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { AuthService } from '../../../shared/services/auth-service';
import { PostsService } from '../../../shared/services/posts-service';
import { ComponentsModule } from '../../../shared/modules/components/components-module';

import { MyAccountPage } from './my-account-page';

describe('MyAccountPage', () => {
  let component: MyAccountPage;
  let fixture: ComponentFixture<MyAccountPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyAccountPage],
      imports: [CommonModule, ComponentsModule, FormsModule, RouterModule.forRoot([])],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({})) },
        },
        {
          provide: AuthService,
          useValue: {
            user: signal({
              userId: 0,
              username: '',
              display_name: '',
              bio: '',
              stack: [],
              followers: [],
              email: '',
              password: '',
              locatinon: '',
              status: '',
              avatar_url: '',
              created_at: '',
            }),
          },
        },
        {
          provide: PostsService,
          useValue: {
            getAllInfoFromUser: () =>
              of({ posts: [], likes: 0, comments: 0, followers: 0, reposts: [] }),
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
});
