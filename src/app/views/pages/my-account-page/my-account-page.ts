import { ChangeDetectorRef, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { User } from '../../../shared/types/User';
import { PostsService } from '../../../shared/services/posts-service';
import { Post } from '../../../shared/types/Post';

@Component({
  selector: 'app-my-account-page',
  standalone: false,
  templateUrl: './my-account-page.html',
  styleUrl: './my-account-page.css',
})
export class MyAccountPage implements OnInit {
  user: WritableSignal<User> = signal<User>(JSON.parse(localStorage.getItem('user') || '{}'));

  postsFromUser: Post[] = [];
  likes: number = 0;
  comments: number = 0;

  constructor(
    private postsService: PostsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getAllPostsFromUser();
    this.getAllInfoFromUser();
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
