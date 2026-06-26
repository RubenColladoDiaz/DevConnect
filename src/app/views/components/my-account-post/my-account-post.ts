import { Component, model, ModelSignal } from '@angular/core';
import { Post } from '../../../shared/types/Post';
import { User } from '../../../shared/types/User';

@Component({
  selector: 'app-my-account-post',
  standalone: false,
  templateUrl: './my-account-post.html',
  styleUrl: './my-account-post.css',
})
export class MyAccountPost {
  post: ModelSignal<Post | undefined> = model<Post>();
  user: ModelSignal<User | undefined> = model<User>();
}
