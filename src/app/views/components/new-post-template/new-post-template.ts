import { Component, model, ModelSignal, output } from '@angular/core';
import {
  Post,
  PostCodeLanguage,
  PostCodeTheme,
  PostContentBlock,
} from '../../../shared/types/Post';
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
  postCreated = output<Post>();

  contentBlocks: PostContentBlock[] = [{ type: 'text', content: '' }];
  languages: PostCodeLanguage[] = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C#',
    'HTML',
    'CSS',
    'SQL',
    'Text',
  ];
  themes: PostCodeTheme[] = ['dark', 'light', 'monokai'];

  constructor(private postsService: PostsService) {}

  get hasContent(): boolean {
    return this.contentBlocks.some((block) => block.content.trim().length > 0);
  }

  addTextBlock(afterIndex: number): void {
    this.contentBlocks.splice(afterIndex + 1, 0, { type: 'text', content: '' });
  }

  addCodeBlock(afterIndex: number): void {
    this.contentBlocks.splice(afterIndex + 1, 0, {
      type: 'code',
      content: '',
      language: 'JavaScript',
      theme: 'dark',
    });
  }

  removeBlock(index: number): void {
    if (this.contentBlocks.length === 1) return;
    this.contentBlocks.splice(index, 1);
  }

  toggleCreating(): void {
    this.creating.update((creating) => !creating);
  }

  createPost(): void {
    if (!this.hasContent) return;

    const content = this.contentBlocks
      .filter((block) => block.type === 'text')
      .map((block) => block.content)
      .join('\n');

    this.postsService.createPost(content, [], this.contentBlocks).subscribe({
      next: (res) => {
        this.postCreated.emit(res.post);
        this.toggleCreating();
      },
      error: (err) => console.error('Error:', err),
    });
  }
}
