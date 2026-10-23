import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Header } from '../../../views/components/header/header';
import { NewPostButton } from '../../../views/components/new-post-button/new-post-button';
import { OfflinePost } from '../../../views/components/offline-post/offline-post';
import { PostTemplate } from '../../../views/components/post-template/post-template';
import { NewPostTemplate } from '../../../views/components/new-post-template/new-post-template';
import { FormsModule } from '@angular/forms';
import { CommentTemplate } from '../../../views/components/comment-template/comment-template';
import { NewCommentTemplate } from '../../../views/components/new-comment-template/new-comment-template';
import { MyAccountPost } from '../../../views/components/my-account-post/my-account-post';
import { Footer } from '../../../views/components/footer/footer';
import { CodeEditor } from '../../../views/components/code-editor/code-editor';

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
    Footer,
    CodeEditor,
  ],
  imports: [CommonModule, FormsModule, RouterModule],
  exports: [
    Header,
    NewPostButton,
    OfflinePost,
    PostTemplate,
    NewPostTemplate,
    CommentTemplate,
    NewCommentTemplate,
    MyAccountPost,
    Footer,
    CodeEditor,
  ],
  providers: [DatePipe],
})
export class ComponentsModule {}
