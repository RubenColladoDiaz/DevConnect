import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Post } from '../../../shared/types/Post';
import { User } from '../../../shared/types/User';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  user: User = JSON.parse(localStorage.getItem('user') || '{}');
  posts: Post[] = [];
  message: string = '';

  constructor(private http: HttpClient) {
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
        },
        error: (res: any) => {
          this.message = res.error.message;
        },
      });
  }
}
