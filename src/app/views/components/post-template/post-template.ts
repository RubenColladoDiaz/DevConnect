import { Component, model, ModelSignal, signal, WritableSignal } from '@angular/core';
import { Post } from '../../../shared/types/Post';
import { PostsService } from '../../../shared/services/posts-service';
import { Router } from '@angular/router';
import { Comment } from '../../../shared/types/Comment';

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

  creatingComment: WritableSignal<boolean> = signal<boolean>(false);

  updateLikes(): void {
    if (!this.checkLogin()) return;

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

  toggleCreating(): void {
    this.creatingComment.update((creating) => !creating);
  }

  updateComments(comments: Comment[]) {
    this.post.update((current) => {
      if (!current) return current;

      return {
        ...current,
        comments: comments,
      };
    });
    this.toggleCreating();
  }

  checkLogin(): boolean {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
