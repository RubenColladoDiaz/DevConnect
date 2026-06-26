import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Header } from '../../../views/components/header/header';
import { NewPostButton } from '../../../views/components/new-post-button/new-post-button';
import { OfflinePost } from '../../../views/components/offline-post/offline-post';
import { PostTemplate } from '../../../views/components/post-template/post-template';
import { NewPostTemplate } from '../../../views/components/new-post-template/new-post-template';
import { FormsModule } from '@angular/forms';
import { CommentTemplate } from '../../../views/components/comment-template/comment-template';
import { NewCommentTemplate } from '../../../views/components/new-comment-template/new-comment-template';
import { MyAccountPost } from '../../../views/components/my-account-post/my-account-post';

@NgModule({
  declarations: [
    Header,
    NewPostButton,
    OfflinePost,
    PostTemplate,
    NewPostTemplate,
    CommentTemplate,
    NewCommentTemplate,
    MyAccountPost,
  ],
  imports: [CommonModule, FormsModule],
  exports: [
    Header,
    NewPostButton,
    OfflinePost,
    PostTemplate,
    NewPostTemplate,
    CommentTemplate,
    NewCommentTemplate,
    MyAccountPost,
  ],
  providers: [DatePipe],
})
export class ComponentsModule {}
