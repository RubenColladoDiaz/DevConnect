import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { Post, PostCodeLanguage } from '../../../shared/types/Post';
import {
  FollowingPresence,
  TopFollowerUser,
  TopQuestionSolver,
  TopViewedUser,
  User,
} from '../../../shared/types/User';
import { PostsService } from '../../../shared/services/posts-service';
import { AuthService } from '../../../shared/services/auth-service';
import { UsersService } from '../../../shared/services/users-service';

/**
 * Home component where the user will be able to see all posts and user configuration.
 */
@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  @ViewChild('feedTop') feedTop?: ElementRef<HTMLElement>;

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
  trendingLanguages: { language: Exclude<PostCodeLanguage, 'Text'>; count: number }[] = [];
  topFollowers: TopFollowerUser[] = [];
  topProfileViews: TopViewedUser[] = [];
  topQuestionSolvers: TopQuestionSolver[] = [];
  followingPresence: FollowingPresence[] = [];
  /**
   * Text message where we show possible errors.
   * @type {string}
   * @default {''}
   */
  message: string = '';

  creating: WritableSignal<boolean> = signal(false);
  private rankingsRefreshInterval: ReturnType<typeof setInterval> | undefined;

  /**
   * Constructor where we create essencial params for different methods.
   * @param {ChangeDetectorRef} cdr Property that is used to detect changes in the view. We use it to detect when the posts are loaded.
   */
  constructor(
    private cdr: ChangeDetectorRef,
    private postsService: PostsService,
    private authService: AuthService,
    private usersService: UsersService,
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
    this.refreshRankings();
    this.rankingsRefreshInterval = setInterval(() => this.refreshRankings(), 5000);
  }

  ngOnDestroy(): void {
    if (this.rankingsRefreshInterval) {
      clearInterval(this.rankingsRefreshInterval);
    }
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

  getTopFollowers(): void {
    this.usersService.GetTopFollowers().subscribe({
      next: (users) => {
        this.topFollowers = users;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading top followers:', err),
    });
  }

  getTopProfileViews(): void {
    this.usersService.GetTopProfileViews().subscribe({
      next: (users) => {
        this.topProfileViews = users;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading top profile views:', err),
    });
  }

  getTrendingLanguages(): void {
    this.postsService.getTrendingLanguages().subscribe({
      next: (languages) => {
        this.trendingLanguages = languages;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading trending languages:', err),
    });
  }

  getTopQuestionSolvers(): void {
    this.usersService.GetTopQuestionSolvers().subscribe({
      next: (users) => {
        this.topQuestionSolvers = users;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading top question solvers:', err),
    });
  }

  getFollowingPresence(): void {
    if (!this.user()?.userId) {
      this.followingPresence = [];
      return;
    }

    this.usersService.GetFollowingPresence().subscribe({
      next: (users) => {
        this.followingPresence = users;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading following presence:', err),
    });
  }

  private refreshRankings(): void {
    this.getTrendingLanguages();
    this.getTopFollowers();
    this.getTopProfileViews();
    this.getTopQuestionSolvers();
    this.getFollowingPresence();
  }

  scrollToFeedTop(): void {
    requestAnimationFrame(() => {
      this.feedTop?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  addNewPost(post: Post): void {
    const newPost = {
      ...post,
      avatar_url: this.user().avatar_url,
      job_title: this.user().job_title,
      createdAt: this.parseCreatedAt(post.createdAt),
    };
    this.posts = [
      signal(newPost),
      ...this.posts.filter((existingPost) => existingPost()._id !== post._id).slice(0, 19),
    ];
    this.getTrendingLanguages();
    this.cdr.detectChanges();
  }
}
