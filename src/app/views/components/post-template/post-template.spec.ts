import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { PostsService } from '../../../shared/services/posts-service';

import { PostTemplate } from './post-template';

describe('PostTemplate', () => {
  let component: PostTemplate;
  let fixture: ComponentFixture<PostTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PostTemplate],
      imports: [RouterModule.forRoot([])],
      providers: [{ provide: PostsService, useValue: {} }],
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
});
