import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { Post } from '../../../shared/types/Post';
import { User } from '../../../shared/types/User';

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
   * We call the logged user object saved in localStorage and we save it in JSON data. In case the user is not logged, we save an empty JSON.
   * @type {User}
   * @default {}
   */
  user: WritableSignal<User> = signal<User>(JSON.parse(localStorage.getItem('user') || '{}'));
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
   * @param {HttpClient} http Property that is used to make API calls.
   * @param {ChangeDetectorRef} cdr Property that is used to detect changes in the view. We use it to detect when the posts are loaded.
   */
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

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
  getAllPosts(): void {
    this.http.get('http://localhost:3000/getAllPosts').subscribe({
      next: (res: any) => {
        this.posts = res.posts;
        this.cdr.detectChanges();
      },
      error: (res: any) => {
        console.error('getAllPosts ERROR:', res);
        this.message = res.error?.message;
      },
    });
  }
}
