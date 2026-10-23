import { Component, model, ModelSignal, OnInit } from '@angular/core';
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
}
