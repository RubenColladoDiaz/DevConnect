import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Post } from '../../../shared/types/Post';
import { User } from '../../../shared/types/User';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  user: User = JSON.parse(localStorage.getItem('user') || '{}');
  posts: Post[] = [];
  message: string = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getAllPosts();
  }

  getAllPosts() {
    const token = localStorage.getItem('token');

    this.http
      .get('http://localhost:3000/getAllPosts', {
        // We send to backend the token with a header element called Authorization
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
        },
      })
      .subscribe({
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
