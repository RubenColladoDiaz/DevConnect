import { ChangeDetectorRef, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { Post } from '../../../shared/types/Post';
import { User } from '../../../shared/types/User';
import { PostsService } from '../../../shared/services/posts-service';
import { AuthService } from '../../../shared/services/auth-service';

/**
 * Home component where the user will be able to see all posts and user configuration.
 */
@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  /**
   * Shared reactive logged user signal from AuthService.
   */
  user: WritableSignal<User>;
  /**
   * List variable where we save all gotten post from getAllPosts.
   * @type {Post}
   * @default {[]}
   */
  posts: WritableSignal<Post>[] = [];
  /**
   * Text message where we show possible errors.
   * @type {string}
   * @default {''}
   */
  message: string = '';

  creating: WritableSignal<boolean> = signal(false);

  /**
   * Constructor where we create essencial params for different methods.
   * @param {ChangeDetectorRef} cdr Property that is used to detect changes in the view. We use it to detect when the posts are loaded.
   */
  constructor(
    private cdr: ChangeDetectorRef,
    private postsService: PostsService,
    private authService: AuthService,
  ) {
    this.user = this.authService.user;
  }

  /**
   * This method is called in the first load of the view.
   * @type {void}
   * @returns This method does not return any data.
   */
  ngOnInit(): void {
    this.getAllPosts();
  }

  /**
   * This GET method calls all posts from the mongo server and save them in posts variable.
   * @type {void}
   * @returns This method does not return any data.
   */
  private parseCreatedAt(value: any): Date | any {
    if (!value) return value;
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    if (value.$date) return new Date(value.$date);
    return new Date(value);
  }

  getAllPosts(): void {
    this.postsService.getAllPosts().subscribe({
      next: (res: any) => {
        this.posts = res.posts.map((post: any) =>
          signal({
            ...post,
            createdAt: this.parseCreatedAt(post.createdAt),
          }),
        );
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error:', err),
    });
  }

  addNewPost(post: Post): void {
    const newPost = {
      ...post,
      createdAt: this.parseCreatedAt(post.createdAt),
    };
    this.posts = [
      signal(newPost),
      ...this.posts.filter((existingPost) => existingPost()._id !== post._id).slice(0, 19),
    ];
    this.cdr.detectChanges();
  }
}
