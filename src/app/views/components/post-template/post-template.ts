import { Component, model, ModelSignal } from '@angular/core';
import { Post } from '../../../shared/types/Post';
import { PostsService } from '../../../shared/services/posts-service';

@Component({
  selector: 'app-post-template',
  standalone: false,
  templateUrl: './post-template.html',
  styleUrl: './post-template.css',
})
export class PostTemplate {
  constructor(private postsService: PostsService) {}

  post: ModelSignal<Post | undefined> = model<Post>();

  liked: Boolean = false;

  updateLikes(): void {
    if (this.liked) return;

    const id = this.post()?._id;
    if (!id) return;

    this.postsService.updateLikes(id).subscribe({
      next: (res) => {
        this.post.update((current) => {
          if (!current) return current;
          return { ...current, likes: res.likes };
        });
        // No hace falta cdr.detectChanges() ya que signal renderiza por su cuenta
      },
      error: (err) => console.error('Error:', err),
    });
    this.liked = !this.liked;
  }
}
