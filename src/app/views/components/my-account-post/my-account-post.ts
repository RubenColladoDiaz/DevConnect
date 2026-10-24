import {
  Component,
  HostListener,
  model,
  ModelSignal,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { Post } from '../../../shared/types/Post';
import { User } from '../../../shared/types/User';
import { PostsService } from '../../../shared/services/posts-service';

@Component({
  selector: 'app-my-account-post',
  standalone: false,
  templateUrl: './my-account-post.html',
  styleUrl: './my-account-post.css',
})
export class MyAccountPost implements OnInit {
  post: ModelSignal<Post | undefined> = model<Post>();
  user: ModelSignal<User | undefined> = model<User>();

  opened: WritableSignal<boolean> = signal<boolean>(false);

  constructor(private postsService: PostsService) {}

  ngOnInit(): void {
    const postId = this.post()?._id;
    if (!postId) return;

    this.postsService.registerPostView(postId).subscribe({
      next: (res) => {
        this.post.update((post) => (post ? { ...post, views: res.views } : post));
      },
      error: (err) => console.error('Error registering post view:', err),
    });
  }

  openPost(event: Event): void {
    // Code blocks keep working as before instead of opening the popup
    const target = event.target as HTMLElement;
    if (target.closest('app-code-editor')) return;

    this.opened.set(true);
  }

  @HostListener('document:keydown.escape')
  closePost(): void {
    this.opened.set(false);
  }
}
