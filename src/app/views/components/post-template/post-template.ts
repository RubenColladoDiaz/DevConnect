import { Component, model, ModelSignal } from '@angular/core';
import { Post } from '../../../shared/types/Post';

@Component({
  selector: 'app-post-template',
  standalone: false,
  templateUrl: './post-template.html',
  styleUrl: './post-template.css',
})
export class PostTemplate {
  post: ModelSignal<Post | undefined> = model<Post>();
}
