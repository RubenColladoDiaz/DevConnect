import { Component, model, ModelSignal } from '@angular/core';
import { Post } from '../../../shared/types/Post';
import { PostsService } from '../../../shared/services/posts-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-post-template',
  standalone: false,
  templateUrl: './post-template.html',
  styleUrl: './post-template.css',
})
export class PostTemplate {
  constructor(
    private postsService: PostsService,
    private router: Router,
  ) {}

  post: ModelSignal<Post | undefined> = model<Post>();

  updateLikes(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const id = this.post()?._id;
    if (!id) return;

    this.postsService.updateLikes(id).subscribe({
      next: (res) => {
        this.post.update((current) => {
          if (!current) return current;
          return { ...current, likes: res.likes, liked: res.liked };
        });
      },
      error: (err) => console.error('Error:', err),
    });
  }
}
