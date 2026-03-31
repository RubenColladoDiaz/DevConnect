import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Post } from '../../../shared/types/Post';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  user = JSON.parse(localStorage.getItem('user') || '{}');
  username = this.user.username;
  posts: Post[] = [];
  message: string = '';

  constructor(private http: HttpClient) {
    this.getAllPosts();
  }

  getAllPosts() {
    this.http.get('http://localhost:3000/getAllPosts').subscribe({
      next: (res: any) => {
        this.posts = res.posts;
      },
      error: (res: any) => {
        this.message = res.error.message;
      },
    });
  }
}
