import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostTemplate } from './post-template';

describe('PostTemplate', () => {
  let component: PostTemplate;
  let fixture: ComponentFixture<PostTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PostTemplate],
    }).compileComponents();

    fixture = TestBed.createComponent(PostTemplate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
