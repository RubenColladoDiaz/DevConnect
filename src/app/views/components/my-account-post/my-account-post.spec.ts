import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PostsService } from '../../../shared/services/posts-service';

import { MyAccountPost } from './my-account-post';

describe('MyAccountPost', () => {
  let component: MyAccountPost;
  let fixture: ComponentFixture<MyAccountPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyAccountPost],
      providers: [
        { provide: PostsService, useValue: { registerPostView: () => of({ views: 1 }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyAccountPost);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
