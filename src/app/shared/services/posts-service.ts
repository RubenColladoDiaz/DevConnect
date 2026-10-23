import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PostCodeLanguage, PostContentBlock, PostType } from '../types/Post';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private nodeURL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getTrendingLanguages(): Observable<
    { language: Exclude<PostCodeLanguage, 'Text'>; count: number }[]
  > {
    return this.http.get<{ language: Exclude<PostCodeLanguage, 'Text'>; count: number }[]>(
      this.nodeURL + '/trendingLanguages',
    );
  }

  createPost(
    content: string,
    tags: string[],
    contentBlocks?: PostContentBlock[],
    type: PostType = 'post',
  ): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      content,
      tags,
      contentBlocks,
      type,
    };
    return this.http.post(this.nodeURL + '/createPost', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  createComment(
    postId: string,
    content: string,
    contentBlocks?: PostContentBlock[],
  ): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      postId: postId,
      content: content,
      contentBlocks,
    };
    return this.http.post(this.nodeURL + '/createComment', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  toggleAcceptedAnswer(
    postId: string,
    answerId: string,
    accepted: boolean,
  ): Observable<{ acceptedAnswerIds: string[] }> {
    const token = localStorage.getItem('token');

    return this.http.post<{ acceptedAnswerIds: string[] }>(
      this.nodeURL + '/toggleAcceptedAnswer',
      { postId, answerId, accepted },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
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

  updateSaved(id: string): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      postId: id,
    };

    return this.http.post(this.nodeURL + '/updateSaved', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getSavedPosts(): Observable<any> {
    const token = localStorage.getItem('token');

    return this.http.get(this.nodeURL + '/getSavedPosts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  registerPostView(id: string): Observable<{ views: number }> {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    return this.http.post<{ views: number }>(
      this.nodeURL + '/registerPostView',
      { postId: id },
      headers ? { headers } : {},
    );
  }
}
