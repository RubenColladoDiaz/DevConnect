import { ChangeDetectorRef, Component, DestroyRef, signal } from '@angular/core';
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
  private openSearchResultOnEnter = false;
  private searchTerms = new Subject<string>();

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    destroyRef: DestroyRef,
  ) {
    this.user = this.authService.user;

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
