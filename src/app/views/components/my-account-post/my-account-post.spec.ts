import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyAccountPost } from './my-account-post';

describe('MyAccountPost', () => {
  let component: MyAccountPost;
  let fixture: ComponentFixture<MyAccountPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyAccountPost],
    }).compileComponents();

    fixture = TestBed.createComponent(MyAccountPost);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
