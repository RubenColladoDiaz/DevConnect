import { Component, model, ModelSignal } from '@angular/core';
import { Comment } from '../../../shared/types/Comment';

@Component({
  selector: 'app-comment-template',
  standalone: false,
  templateUrl: './comment-template.html',
  styleUrl: './comment-template.css',
})
export class CommentTemplate {
  comment:ModelSignal<Comment | undefined> = model<Comment>();
}
