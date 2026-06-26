import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private nodeURL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  createPost(content: string, tags: string[]): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      content,
      tags,
    };
    return this.http.post(this.nodeURL + '/createPost', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  createComment(postId: string, content: string): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      postId: postId,
      content: content,
    };
    return this.http.post(this.nodeURL + '/createComment', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getAllPosts(): Observable<any> {
    const token = localStorage.getItem('token');

    if (!token) {
      return this.http.get(this.nodeURL + '/getAllPosts');
    }

    return this.http.get(this.nodeURL + '/getAllPosts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getAllPostsFromUser(): Observable<any> {
    const token = localStorage.getItem('token');

    return this.http.get(this.nodeURL + '/getAllPostsFromUser', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  updateLikes(id: string): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      postId: id,
    };

    return this.http.post(this.nodeURL + '/updateLikes', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
