import { ChangeDetectorRef, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { User } from '../../../shared/types/User';
import { PostsService } from '../../../shared/services/posts-service';
import { Post } from '../../../shared/types/Post';
import { UsersService } from '../../../shared/services/users-service';
import { AuthService } from '../../../shared/services/auth-service';
import { ActivatedRoute } from '@angular/router';

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
  views: number = 0;
  isOwnProfile: boolean = true;

  editingBio: boolean = false;
  editedBio: string = '';
  editingAvatar: boolean = false;
  editedAvatar: string = '';
  avatarError: string = '';

  constructor(
    private postsService: PostsService,
    private usersService: UsersService,
    private authService: AuthService,
    private route: ActivatedRoute,
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

      if (username) {
        this.getAllInfoFromUser(username);
      } else {
        this.user = this.authService.user;
        this.getAllInfoFromUser();
      }
    });
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
        }
        this.postsFromUser = res.posts.map((post: any) => ({
          ...post,
          createdAt: this.parseCreatedAt(post.createdAt),
        }));
        this.likes = res.likes;
        this.comments = res.comments;
        this.followers = res.followers;
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
