import { Component, model, ModelSignal } from '@angular/core';
import { User } from '../../../shared/types/User';

@Component({
  selector: 'app-new-post-button',
  standalone: false,
  templateUrl: './new-post-button.html',
  styleUrl: './new-post-button.css',
})
export class NewPostButton {
  creating: ModelSignal<boolean> = model<boolean>(false);
  user: User = JSON.parse(localStorage.getItem('user') || '{}');

  toggleCreating() {
    this.creating.update((creating) => !creating);
  }
}
