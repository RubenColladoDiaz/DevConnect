import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Header } from '../../../views/components/header/header';
import { NewPostButton } from '../../../views/components/new-post-button/new-post-button';
import { OfflinePost } from '../../../views/components/offline-post/offline-post';
import { PostTemplate } from '../../../views/components/post-template/post-template';
import { NewPostTemplate } from '../../../views/components/new-post-template/new-post-template';

@NgModule({
  declarations: [Header, NewPostButton, OfflinePost, PostTemplate, NewPostTemplate],
  imports: [CommonModule],
  exports: [Header, NewPostButton, OfflinePost, PostTemplate, NewPostTemplate],
  providers: [DatePipe],
})
export class ComponentsModule {}
