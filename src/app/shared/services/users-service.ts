import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FollowingPresence,
  TopFollowerUser,
  TopQuestionSolver,
  TopViewedUser,
  UserSearchResult,
} from '../types/User';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private nodeURL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  Login(username: string, password: string) {
    return this.http.post(this.nodeURL + '/login', { username, password });
  }

  Register(
    username: string,
    email: string,
    password: string,
    display_name: string,
    stack: string[],
    location: string,
  ) {
    return this.http.post(this.nodeURL + '/register', {
      username,
      email,
      password,
      display_name,
      stack,
      location,
    });
  }

  UpdateProfile(display_name: string, username: string, location: string) {
    return this.http.post(
      this.nodeURL + '/updateProfile',
      { display_name, username, location },
      { headers: this.getAuthHeaders() },
    );
  }

  UpdateStack(stack: string[]) {
    return this.http.post(
      this.nodeURL + '/updateStack',
      { stack },
      { headers: this.getAuthHeaders() },
    );
  }

  UpdateCover(cover_url: string) {
    return this.http.post(
      this.nodeURL + '/updateCover',
      { cover_url },
      { headers: this.getAuthHeaders() },
    );
  }

  UpdateBio(bio: string | undefined) {
    return this.http.post(this.nodeURL + '/updateBio', { bio }, { headers: this.getAuthHeaders() });
  }

  UpdateAvatar(avatar_url: string) {
    return this.http.post(
      this.nodeURL + '/updateAvatar',
      { avatar_url },
      { headers: this.getAuthHeaders() },
    );
  }

  ToggleFollow(userId: number) {
    return this.http.post(
      `${this.nodeURL}/follow/${userId}`,
      {},
      { headers: this.getAuthHeaders() },
    );
  }

  GetUserConnections(userId: number) {
    return this.http.get(`${this.nodeURL}/getUserConnections/${userId}`);
  }

  SearchUsers(query: string): Observable<UserSearchResult[]> {
    return this.http.get<UserSearchResult[]>(`${this.nodeURL}/searchUsers`, {
      params: { query },
    });
  }

  GetTopFollowers(): Observable<TopFollowerUser[]> {
    return this.http.get<TopFollowerUser[]>(`${this.nodeURL}/topFollowers`);
  }

  GetTopProfileViews(): Observable<TopViewedUser[]> {
    return this.http.get<TopViewedUser[]>(`${this.nodeURL}/topProfileViews`);
  }

  GetTopQuestionSolvers(): Observable<TopQuestionSolver[]> {
    return this.http.get<TopQuestionSolver[]>(`${this.nodeURL}/topQuestionSolvers`);
  }

  GetFollowingPresence(): Observable<FollowingPresence[]> {
    return this.http.get<FollowingPresence[]>(`${this.nodeURL}/followingPresence`, {
      headers: this.getAuthHeaders(),
    });
  }

  UpdatePresence() {
    return this.http.post(`${this.nodeURL}/heartbeat`, {}, { headers: this.getAuthHeaders() });
  }

  Logout() {
    return this.http.post(this.nodeURL + '/logout', {}, { headers: this.getAuthHeaders() });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: 'Bearer ' + token });
  }
}
