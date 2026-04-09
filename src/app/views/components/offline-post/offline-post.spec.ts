import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfflinePost } from './offline-post';

describe('OfflinePost', () => {
  let component: OfflinePost;
  let fixture: ComponentFixture<OfflinePost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OfflinePost],
    }).compileComponents();

    fixture = TestBed.createComponent(OfflinePost);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
