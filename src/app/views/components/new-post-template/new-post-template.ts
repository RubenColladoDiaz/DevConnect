import { Component, model, ModelSignal } from '@angular/core';
import { User } from '../../../shared/types/User';

@Component({
  selector: 'app-new-post-template',
  standalone: false,
  templateUrl: './new-post-template.html',
  styleUrl: './new-post-template.css',
})
export class NewPostTemplate {
  user: ModelSignal<User | undefined> = model<User>();
}
