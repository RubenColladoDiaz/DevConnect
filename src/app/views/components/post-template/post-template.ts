import { ChangeDetectorRef, Component, model, ModelSignal, OnInit } from '@angular/core';
import { Post } from '../../../shared/types/Post';
import { PostsService } from '../../../shared/services/posts-service';

@Component({
  selector: 'app-post-template',
  standalone: false,
  templateUrl: './post-template.html',
  styleUrl: './post-template.css',
})
export class PostTemplate implements OnInit {
  constructor(
    private cdr: ChangeDetectorRef,
    private postsService: PostsService,
  ) {}

  post: ModelSignal<Post | undefined> = model<Post>();

  ngOnInit(): void {
    console.log(this.post()?.likes);
  }

  addLike() {}
}
