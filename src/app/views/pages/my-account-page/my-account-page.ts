import { ChangeDetectorRef, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { User } from '../../../shared/types/User';
import { PostsService } from '../../../shared/services/posts-service';
import { Post } from '../../../shared/types/Post';
import { UsersService } from '../../../shared/services/users-service';
import { AuthService } from '../../../shared/services/auth-service';

@Component({
  selector: 'app-my-account-page',
  standalone: false,
  templateUrl: './my-account-page.html',
  styleUrl: './my-account-page.css',
})
export class MyAccountPage implements OnInit {
  user: WritableSignal<User>;

  postsFromUser: Post[] = [];
  likes: number = 0;
  comments: number = 0;

  editingBio: boolean = false;
  editedBio: string = '';
  editingAvatar: boolean = false;
  editedAvatar: string = '';
  avatarError: string = '';

  constructor(
    private postsService: PostsService,
    private usersService: UsersService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.user = this.authService.user;
  }

  ngOnInit(): void {
    this.getAllPostsFromUser();
    this.getAllInfoFromUser();
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
    // basic URL validation
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

  getAllPostsFromUser(): void {
    this.postsService.getAllPostsFromUser().subscribe({
      next: (res: any) => {
        this.postsFromUser = res.posts;
        this.cdr.detectChanges();
      },
      error: (res: any) => {
        console.log(res);
      },
    });
  }

  getAllInfoFromUser(): void {
    this.postsService.getAllInfoFromUser().subscribe({
      next: (res: any) => {
        this.likes = res.likes;
        this.comments = res.comments;
        this.cdr.detectChanges();
      },
      error: (res: any) => {
        console.log(res);
      },
    });
  }
}
