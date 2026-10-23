import { Component, model, ModelSignal, OnInit, signal, WritableSignal } from '@angular/core';
import { Post } from '../../../shared/types/Post';
import { PostsService } from '../../../shared/services/posts-service';
import { Router } from '@angular/router';
import { Comment } from '../../../shared/types/Comment';
import { AuthService } from '../../../shared/services/auth-service';

@Component({
  selector: 'app-post-template',
  standalone: false,
  templateUrl: './post-template.html',
  styleUrl: './post-template.css',
})
export class PostTemplate implements OnInit {
  constructor(
    private postsService: PostsService,
    private router: Router,
    private authService: AuthService,
  ) {}

  post: ModelSignal<Post | undefined> = model<Post>();

  creatingComment: WritableSignal<boolean> = signal<boolean>(false);

  linkCopied: WritableSignal<boolean> = signal<boolean>(false);

  ngOnInit(): void {
    this.registerView();
  }

  isToday(date: Date | undefined): boolean {
    if (!date) return false;

    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  updateLikes(): void {
    if (!this.checkLogin()) return;

    const id = this.post()?._id;
    if (!id) return;

    this.postsService.updateLikes(id).subscribe({
      next: (res) => {
        this.post.update((current) => {
          if (!current) return current;
          return { ...current, likes: res.likes, liked: res.liked };
        });
      },
      error: (err) => console.error('Error:', err),
    });
  }

  toggleCreating(): void {
    this.creatingComment.update((creating) => !creating);
  }

  updateReposts(): void {
    const id = this.post()?._id;
    if (!id) return;

    this.postsService.updateReposts(id).subscribe({
      next: (res) => {
        this.post.update((current) => {
          if (!current) return current;

          return {
            ...current,
            reposts: res.post.reposts,
            repostedByUserIds: res.post.repostedByUserIds,
            reposted: res.reposted,
          };
        });
      },
    });
  }

  updateSaved(): void {
    if (!this.checkLogin()) return;

    const id = this.post()?._id;
    if (!id) return;

    this.postsService.updateSaved(id).subscribe({
      next: (res) => {
        this.post.update((current) => {
          if (!current) return current;
          return { ...current, saved: res.saved };
        });
      },
      error: (err) => console.error('Error:', err),
    });
  }

  sharePost(): void {
    const currentPost = this.post();
    if (!currentPost) return;

    const url = window.location.origin + '/account/' + currentPost.username;

    if (navigator.share) {
      navigator
        .share({ title: 'DevConnect', text: currentPost.content, url: url })
        .catch((err) => console.error('Error sharing post:', err));
      return;
    }

    navigator.clipboard.writeText(url).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    });
  }

  updateComments(comments: Comment[]) {
    this.post.update((current) => {
      if (!current) return current;

      return {
        ...current,
        comments: comments,
      };
    });
    this.toggleCreating();
  }

  canManageAnswers(): boolean {
    const currentUser = this.authService.user();
    const currentPost = this.post();
    if (!currentUser?.userId || !currentPost) return false;
    if (currentPost.authorId !== undefined) {
      return String(currentPost.authorId) === String(currentUser.userId);
    }
    return currentPost.username === currentUser.username;
  }

  isAcceptedAnswer(answerId?: string): boolean {
    if (!answerId) return false;
    return (this.post()?.acceptedAnswerIds || []).includes(answerId);
  }

  toggleAcceptedAnswer(answerId: string): void {
    if (!this.canManageAnswers()) return;
    const currentPost = this.post();
    if (!currentPost?._id) return;

    this.postsService
      .toggleAcceptedAnswer(currentPost._id, answerId, !this.isAcceptedAnswer(answerId))
      .subscribe({
        next: (res) => {
          this.post.update((post) => {
            if (!post) return post;
            return { ...post, acceptedAnswerIds: res.acceptedAnswerIds };
          });
        },
        error: (err) => console.error('Error marking helpful answer:', err),
      });
  }

  registerView(): void {
    const currentPost = this.post();
    if (!currentPost?._id) return;

    this.postsService.registerPostView(currentPost._id).subscribe({
      next: (res) => {
        this.post.update((post) =>
          post ? { ...post, views: Math.max(post.views || 0, res.views) } : post,
        );
      },
      error: (err) => console.error('Error registering post view:', err),
    });
  }

  checkLogin(): boolean {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
