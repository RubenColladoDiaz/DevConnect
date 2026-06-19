import { Component, model, ModelSignal, output } from '@angular/core';
import { User } from '../../../shared/types/User';
import { PostsService } from '../../../shared/services/posts-service';

@Component({
  selector: 'app-new-post-template',
  standalone: false,
  templateUrl: './new-post-template.html',
  styleUrl: './new-post-template.css',
})
export class NewPostTemplate {
  user: User = JSON.parse(localStorage.getItem('user') || '{}');

  creating: ModelSignal<boolean> = model<boolean>(false);
  postCreated = output<void>();

  content: string = '';

  constructor(private postsService: PostsService) {}

  toggleCreating(): void {
    this.creating.update((creating) => !creating);
  }

  createPost(): void {
    this.postsService.createPost(this.content, []).subscribe({
      next: (res) => {
        this.postCreated.emit();
        this.toggleCreating();
      },
      error: (err) => console.error('Error:', err),
    });
  }
}
