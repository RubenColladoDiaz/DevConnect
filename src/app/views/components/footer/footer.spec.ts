import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../../../shared/services/auth-service';
import { Footer } from './footer';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  const user = signal({ username: '' });

  beforeEach(async () => {
    user.set({ username: '' });
    await TestBed.configureTestingModule({
      declarations: [Footer],
      imports: [RouterModule.forRoot([])],
      providers: [{ provide: AuthService, useValue: { user } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
  });

  it('shows Login and Register links for guests', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(element.querySelectorAll('a')).map(
      (link) => link.textContent?.trim() || '',
    );
    expect(links).toContain('Login');
    expect(links).toContain('Register');
  });

  it('hides Login and Register links for signed-in users', () => {
    user.set({ username: 'developer' });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(element.querySelectorAll('a')).map(
      (link) => link.textContent?.trim() || '',
    );
    expect(links).not.toContain('Login');
    expect(links).not.toContain('Register');
  });
});
