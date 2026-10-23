import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PostContentBlock } from '../types/Post';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private nodeURL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  createPost(
    content: string,
    tags: string[],
    contentBlocks?: PostContentBlock[],
  ): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      content,
      tags,
      contentBlocks,
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

  getAllInfoFromUser(username?: string): Observable<any> {
    if (username) {
      const token = localStorage.getItem('token');
      const options = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      return this.http.get(
        `${this.nodeURL}/getAllInfoFromUser/${encodeURIComponent(username)}`,
        options,
      );
    }

    const token = localStorage.getItem('token');

    return this.http.get(this.nodeURL + '/getAllInfoFromUser', {
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

  updateReposts(id: string): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      postId: id,
    };

    return this.http.post(this.nodeURL + '/updateReposts', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
