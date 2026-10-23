import { ChangeDetectorRef, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { User } from '../../../shared/types/User';
import { PostsService } from '../../../shared/services/posts-service';
import { Post } from '../../../shared/types/Post';
import { UsersService } from '../../../shared/services/users-service';
import { AuthService } from '../../../shared/services/auth-service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

type UserListItem = Pick<User, 'userId' | 'username' | 'display_name' | 'avatar_url'>;

@Component({
  selector: 'app-my-account-page',
  standalone: false,
  templateUrl: './my-account-page.html',
  styleUrl: './my-account-page.css',
})
export class MyAccountPage implements OnInit {
  user: WritableSignal<User>;

  postsFromUser: Post[] = [];
  reposts: WritableSignal<Post>[] = [];
  likes: number = 0;
  comments: number = 0;
  followers: number = 0;
  followersList: UserListItem[] = [];
  followingList: UserListItem[] = [];
  activeUserList: 'followers' | 'following' | null = null;
  connectionsError: string = '';
  views: number = 0;
  isOwnProfile: boolean = true;
  isFollowing: boolean = false;
  isUpdatingFollow: boolean = false;
  followError: string = '';

  get isLoggedIn(): boolean {
    return !!this.authService.user().username;
  }

  editingBio: boolean = false;
  editedBio: string = '';
  editingAvatar: boolean = false;
  editedAvatar: string = '';
  avatarError: string = '';
  editingProfile = false;
  editedDisplayName = '';
  editedUsername = '';
  editedLocation = '';
  profileError = '';
  editingStack = false;
  editedStack: string[] = [];
  technologyInput = '';
  stackError = '';
  editingCover = false;
  editedCover = '';
  coverError = '';

  constructor(
    private postsService: PostsService,
    private usersService: UsersService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.user = this.authService.user;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const username = params.get('username');
      this.isOwnProfile = !username || username === this.authService.user().username;
      this.editingBio = false;
      this.editingAvatar = false;
      this.editingProfile = false;
      this.editingStack = false;
      this.editingCover = false;
      this.isFollowing = false;
      this.followError = '';
      this.activeUserList = null;
      this.connectionsError = '';
      this.followersList = [];
      this.followingList = [];

      if (username) {
        if (this.isOwnProfile) {
          this.user = this.authService.user;
        }
        this.getAllInfoFromUser(username);
      } else {
        this.user = this.authService.user;
        this.getAllInfoFromUser();
      }
    });
  }

  editProfile(): void {
    this.editedDisplayName = this.user().display_name || '';
    this.editedUsername = this.user().username || '';
    this.editedLocation = this.user().location || 'Unknown';
    this.profileError = '';
    this.editingProfile = true;
  }

  saveProfile(): void {
    this.profileError = '';
    this.usersService
      .UpdateProfile(this.editedDisplayName, this.editedUsername, this.editedLocation)
      .subscribe({
        next: (res: any) => {
          localStorage.setItem('token', res.token);
          const updatedUser = { ...this.user(), ...res.user };
          this.authService.setUser(updatedUser);
          this.user = this.authService.user;
          this.editingProfile = false;
          this.cdr.detectChanges();
          this.router.navigate(['/account', updatedUser.username]);
        },
        error: (err) => {
          this.profileError = err.error?.message || 'Failed to update profile';
        },
      });
  }

  cancelProfile(): void {
    this.editingProfile = false;
    this.profileError = '';
  }

  editStack(): void {
    this.editedStack = [...(this.user().stack || [])];
    this.technologyInput = '';
    this.stackError = '';
    this.editingStack = true;
  }

  addTechnology(): void {
    const technology = this.technologyInput.trim();
    if (!technology) return;
    if (this.editedStack.some((item) => item.toLowerCase() === technology.toLowerCase())) {
      this.technologyInput = '';
      return;
    }
    this.editedStack.push(technology);
    this.technologyInput = '';
  }

  removeTechnology(technology: string): void {
    this.editedStack = this.editedStack.filter((item) => item !== technology);
  }

  saveStack(): void {
    this.stackError = '';
    this.usersService.UpdateStack(this.editedStack).subscribe({
      next: (res: any) => {
        const updatedUser = { ...this.user(), stack: res.stack };
        this.authService.setUser(updatedUser);
        this.user = this.authService.user;
        this.editingStack = false;
      },
      error: (err) => {
        this.stackError = err.error?.message || 'Failed to update technologies';
      },
    });
  }

  cancelStack(): void {
    this.editingStack = false;
    this.stackError = '';
  }

  editCover(): void {
    this.editedCover = this.user().cover_url || '';
    this.coverError = '';
    this.editingCover = true;
  }

  saveCover(): void {
    const cover = this.editedCover.trim();
    if (cover && !/^https?:\/\/.+/i.test(cover)) {
      this.coverError = 'Please enter a valid image URL starting with http:// or https://';
      return;
    }

    this.usersService.UpdateCover(cover).subscribe({
      next: (res: any) => {
        const updatedUser = { ...this.user(), cover_url: res.cover_url };
        this.authService.setUser(updatedUser);
        this.user = this.authService.user;
        this.editingCover = false;
      },
      error: (err) => {
        this.coverError = err.error?.message || 'Failed to update cover image';
      },
    });
  }

  cancelCover(): void {
    this.editingCover = false;
    this.coverError = '';
  }

  editBio(): void {
    this.editedBio = this.user().bio;
    this.editingBio = true;
  }

  editAvatar(): void {
    this.editedAvatar = this.user().avatar_url || '';
    this.editingAvatar = true;
  }

  saveAvatar(): void {
    const urlPattern = /^(https?:\/\/).+/i;
    if (!this.editedAvatar || !urlPattern.test(this.editedAvatar)) {
      this.avatarError = 'Please enter a valid image URL starting with http:// or https://';
      return;
    }

    this.avatarError = '';
    this.usersService.UpdateAvatar(this.editedAvatar).subscribe({
      next: (res: any) => {
        const updatedUser = { ...this.user(), avatar_url: res.avatar_url };
        this.authService.setUser(updatedUser);
        this.cdr.detectChanges();
        this.editingAvatar = false;
      },
      error: (res: any) => {
        console.log(res);
        this.avatarError = 'Failed to update avatar';
      },
    });
  }

  cancelAvatar(): void {
    this.editedAvatar = '';
    this.editingAvatar = false;
  }

  saveBio(): void {
    this.usersService.UpdateBio(this.editedBio).subscribe({
      next: (res: any) => {
        const updatedUser = { ...this.user(), bio: res.bio };
        this.authService.setUser(updatedUser);
        this.cdr.detectChanges();
      },
      error: (res: any) => {
        console.log(res);
      },
    });
    this.editingBio = false;
  }

  cancelBio(): void {
    this.editedBio = '';
    this.editingBio = false;
  }

  toggleFollow(): void {
    if (this.isOwnProfile || this.isUpdatingFollow || !this.user().userId) return;

    this.isUpdatingFollow = true;
    this.followError = '';
    this.usersService.ToggleFollow(this.user().userId).subscribe({
      next: (res: any) => {
        this.isFollowing = res.isFollowing;
        this.followers = res.followersCount;
        this.user.update((user) => ({ ...user, followers: res.followers }));
        this.getUserConnections(this.user().userId);
        this.isUpdatingFollow = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating follow:', err);
        this.followError = 'Failed to update follow';
        this.isUpdatingFollow = false;
      },
    });
  }

  toggleUserList(list: 'followers' | 'following'): void {
    if (this.activeUserList === list) {
      this.activeUserList = null;
      return;
    }

    this.activeUserList = list;
  }

  private getUserConnections(userId: number): void {
    if (!userId) return;

    this.usersService.GetUserConnections(userId).subscribe({
      next: (res: any) => {
        this.followersList = res.followers;
        this.followingList = res.following;
        this.connectionsError = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading followers and following:', err);
        this.connectionsError = 'Failed to load followers and following';
      },
    });
  }

  private parseCreatedAt(value: any): Date | any {
    if (!value) return value;
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    if (value.$date) return new Date(value.$date);
    return new Date(value);
  }

  getAllInfoFromUser(username?: string): void {
    this.postsService.getAllInfoFromUser(username).subscribe({
      next: (res: any) => {
        if (username && !this.isOwnProfile) {
          this.user = signal<User>({
            ...res.user,
            email: '',
            password: '',
          });
          this.isFollowing = res.isFollowing;
        }
        this.views = res.user?.profile_views ?? res.views ?? 0;
        this.getUserConnections(this.user().userId);
        this.postsFromUser = res.posts.map((post: any) => ({
          ...post,
          createdAt: this.parseCreatedAt(post.createdAt),
        }));
        this.likes = res.likes;
        this.comments = res.comments;
        this.followers = res.followersCount ?? res.followers;
        this.reposts = res.reposts.map((post: any) =>
          signal({
            ...post,
            createdAt: this.parseCreatedAt(post.createdAt),
          }),
        );
        this.cdr.detectChanges();
      },
      error: (res: any) => {
        console.log(res);
      },
    });
  }
}
