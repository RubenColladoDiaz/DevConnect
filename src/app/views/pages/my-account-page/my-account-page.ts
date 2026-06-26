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

  constructor(
    private postsService: PostsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getAllPostsFromUser();
    this.cdr.detectChanges();
  }

  getAllPostsFromUser(): void {
    this.postsService.getAllPostsFromUser().subscribe({
      next: (res: any) => {
        this.postsFromUser = res.posts;
      },
      error: (res: any) => {
        console.log(res);
      },
    });
  }
}
