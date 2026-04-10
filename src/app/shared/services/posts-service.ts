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
}
