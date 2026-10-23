import { ChangeDetectorRef, Component, DestroyRef, HostListener, signal } from '@angular/core';
import { WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService } from './shared/services/users-service';
import { AuthService } from './shared/services/auth-service';
import { UserSearchResult } from './shared/types/User';
import { EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('DevConnect');

  user!: WritableSignal<any>;
  searchQuery = '';
  searchResults: UserSearchResult[] = [];
  searchError = '';
  searchLoading = false;
  darkMode = localStorage.getItem('devconnect-theme') === 'dark';
  headerHidden = false;
  private lastScrollY = 0;
  private lastTouchY = 0;
  private openSearchResultOnEnter = false;
  private searchTerms = new Subject<string>();
  private presenceInterval: ReturnType<typeof setInterval>;

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    destroyRef: DestroyRef,
  ) {
    this.user = this.authService.user;
    this.applyTheme();
    this.updatePresence();
    this.presenceInterval = setInterval(() => this.updatePresence(), 25000);
    destroyRef.onDestroy(() => clearInterval(this.presenceInterval));

    this.searchTerms
      .pipe(
        debounceTime(250),
        switchMap((query) => {
          if (query.length < 2) {
            this.searchResults = [];
            this.searchError = '';
            this.searchLoading = false;
            this.openSearchResultOnEnter = false;
            return EMPTY;
          }

          this.searchLoading = true;
          return this.usersService.SearchUsers(query).pipe(
            catchError((error) => {
              console.error('Error searching users:', error);
              this.searchResults = [];
              this.searchError = 'Failed to search users';
              this.searchLoading = false;
              this.openSearchResultOnEnter = false;
              this.cdr.detectChanges();
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((results) => {
        this.searchResults = results;
        this.searchError = '';
        this.searchLoading = false;

        if (this.openSearchResultOnEnter) {
          this.openSearchResultOnEnter = false;
          const exactMatch = results.find(
            (result) => result.username.toLowerCase() === this.searchQuery.trim().toLowerCase(),
          );
          if (exactMatch) {
            this.openUserProfile(exactMatch.username);
          } else if (results.length === 1) {
            this.openUserProfile(results[0].username);
          }
        }
        this.cdr.detectChanges();
      });
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('devconnect-theme', this.darkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.body.classList.toggle('dark-theme', this.darkMode);
  }

  @HostListener('window:focus')
  updatePresence(): void {
    if (!this.user()?.userId || !localStorage.getItem('token')) return;

    this.usersService.UpdatePresence().subscribe({
      error: (error) => console.error('Error updating online status:', error),
    });
  }

  @HostListener('window:scroll')
  @HostListener('body:scroll')
  onWindowScroll(): void {
    const currentScrollY = this.getScrollPosition();
    const scrollDifference = currentScrollY - this.lastScrollY;

    if (currentScrollY < 80) {
      this.headerHidden = false;
    } else if (scrollDifference !== 0) {
      this.headerHidden = scrollDifference > 0;
    }

    this.lastScrollY = currentScrollY;
  }

  @HostListener('window:wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    this.updateHeaderFromScrollDirection(event.deltaY);
  }

  @HostListener('window:touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.lastTouchY = event.touches[0]?.clientY || 0;
  }

  @HostListener('window:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    const touchY = event.touches[0]?.clientY;
    if (touchY === undefined || this.lastTouchY === 0) return;

    this.updateHeaderFromScrollDirection(this.lastTouchY - touchY);
    this.lastTouchY = touchY;
  }

  private updateHeaderFromScrollDirection(deltaY: number): void {
    if (deltaY === 0) return;

    if (this.getScrollPosition() < 80) {
      this.headerHidden = false;
      return;
    }

    this.headerHidden = deltaY > 0;
    this.lastScrollY = this.getScrollPosition();
  }

  private getScrollPosition(): number {
    return Math.max(document.body.scrollTop, document.documentElement.scrollTop, window.scrollY, 0);
  }

  get username(): string {
    return this.user().username || '';
  }

  searchUsers(query: string): void {
    this.searchQuery = query;
    this.openSearchResultOnEnter = false;
    const searchTerm = query.trim();
    this.searchResults = [];
    this.searchError = '';
    this.searchLoading = searchTerm.length >= 2;
    this.searchTerms.next(searchTerm);
  }

  searchOnEnter(): void {
    const query = this.searchQuery.trim();
    if (query.length < 2) return;

    const exactMatch = this.searchResults.find(
      (result) => result.username.toLowerCase() === query.toLowerCase(),
    );
    if (exactMatch) {
      this.openUserProfile(exactMatch.username);
      return;
    }

    this.openSearchResultOnEnter = true;
    this.searchLoading = true;
    this.searchError = '';
    this.searchTerms.next(query);
  }

  openUserProfile(username: string): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.searchError = '';
    this.searchLoading = false;
    this.openSearchResultOnEnter = false;
    this.router.navigate(['/account', username]);
  }

  logout(): void {
    this.usersService.Logout().subscribe({
      next: () => {
        this.authService.clearUser();
        this.router.navigate(['/']);
      },
      error: () => {
        this.authService.clearUser();
        this.router.navigate(['/']);
      },
    });
  }

  clearSession(): void {
    this.authService.clearUser();
    this.router.navigate(['/']);
  }
}
