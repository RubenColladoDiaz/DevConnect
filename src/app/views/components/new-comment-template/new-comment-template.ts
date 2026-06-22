import { Component, model, ModelSignal, output } from '@angular/core';
import { PostsService } from '../../../shared/services/posts-service';
import { Router } from '@angular/router';
import { Comment } from '../../../shared/types/Comment';

@Component({
  selector: 'app-new-comment-template',
  standalone: false,
  templateUrl: './new-comment-template.html',
  styleUrl: './new-comment-template.css',
})
export class NewCommentTemplate {
  creatingComment: ModelSignal<boolean> = model<boolean>(false);
  postId: ModelSignal<string | undefined> = model<string | undefined>('');

  content: string = '';

  updatedComments = output<Comment[]>();

  constructor(
    private postsService: PostsService,
    private router: Router,
  ) {}

  toggleCreating(): void {
    this.creatingComment.update((creatingComment) => !creatingComment);
  }

  createComment(): void {
    if (!this.checkLogin()) return;
    if (!this.postId()) return;

    this.postsService.createComment(this.postId()!, this.content).subscribe({
      next: (res) => {
        this.updatedComments.emit(res);
      },
      error: (err) => console.error('Error:', err),
    });
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
