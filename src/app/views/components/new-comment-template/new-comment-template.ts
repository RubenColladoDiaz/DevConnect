import { Component, Input, model, ModelSignal, output } from '@angular/core';
import { PostsService } from '../../../shared/services/posts-service';
import { Router } from '@angular/router';
import { Comment } from '../../../shared/types/Comment';
import { PostCodeLanguage, PostCodeTheme, PostContentBlock } from '../../../shared/types/Post';

@Component({
  selector: 'app-new-comment-template',
  standalone: false,
  templateUrl: './new-comment-template.html',
  styleUrl: './new-comment-template.css',
})
export class NewCommentTemplate {
  @Input() isQuestion = false;

  creatingComment: ModelSignal<boolean> = model<boolean>(false);
  postId: ModelSignal<string | undefined> = model<string | undefined>('');

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

  updatedComments = output<Comment[]>();

  constructor(
    private postsService: PostsService,
    private router: Router,
  ) {}

  toggleCreating(): void {
    this.creatingComment.update((creatingComment) => !creatingComment);
  }

  get hasContent(): boolean {
    return this.contentBlocks.some((block) => block.content.trim().length > 0);
  }

  get contentPlaceholder(): string {
    if (this.isQuestion) return 'Write a helpful answer...';
    return 'Write a thoughtful comment...';
  }

  get contentAriaLabel(): string {
    if (this.isQuestion) return 'Answer content';
    return 'Comment content';
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

  createComment(): void {
    if (!this.checkLogin()) return;
    if (!this.postId()) return;
    if (!this.hasContent) return;

    const content = this.contentBlocks
      .filter((block) => block.type === 'text')
      .map((block) => block.content)
      .join('\n');

    this.postsService.createComment(this.postId()!, content, this.contentBlocks).subscribe({
      next: (res) => {
        this.updatedComments.emit(res);
        this.contentBlocks = [{ type: 'text', content: '' }];
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
