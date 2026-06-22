import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyAccountPage } from './my-account-page';

describe('MyAccountPage', () => {
  let component: MyAccountPage;
  let fixture: ComponentFixture<MyAccountPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyAccountPage],
    }).compileComponents();

    fixture = TestBed.createComponent(MyAccountPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
