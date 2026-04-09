import { Component, model, ModelSignal } from '@angular/core';
import { User } from '../../../shared/types/User';

@Component({
  selector: 'app-new-post-component',
  standalone: false,
  templateUrl: './new-post-component.html',
  styleUrl: './new-post-component.css',
})
export class NewPostComponent {
  creating: ModelSignal<boolean> = model<boolean>(false);
  user: User = JSON.parse(localStorage.getItem('user') || '{}');

  toggleCreating() {
    this.creating.update((creating) => !creating);
  }
}
