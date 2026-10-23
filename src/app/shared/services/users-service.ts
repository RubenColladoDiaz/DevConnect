import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private nodeURL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  Login(username: string, password: string) {
    const body = {
      username,
      password,
    };
    return this.http.post(this.nodeURL + '/login', body);
  }

  Register(
    username: string,
    email: string,
    password: string,
    display_name: string,
    stack: string[],
  ) {
    const body = {
      username,
      email,
      password,
      display_name,
      stack,
    };
    return this.http.post(this.nodeURL + '/register', body);
  }

  UpdateBio(bio: string | undefined) {
    const token = localStorage.getItem('token');

    return this.http.post(
      this.nodeURL + '/updateBio',
      { bio },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  UpdateAvatar(avatar_url: string) {
    const token = localStorage.getItem('token');

    return this.http.post(
      this.nodeURL + '/updateAvatar',
      { avatar_url },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  ToggleFollow(userId: number) {
    const token = localStorage.getItem('token');

    return this.http.post(
      `${this.nodeURL}/follow/${userId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  GetUserConnections(userId: number) {
    return this.http.get(`${this.nodeURL}/getUserConnections/${userId}`);
  }

  Logout() {
    const token = localStorage.getItem('token');

    return this.http.post(
      this.nodeURL + '/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }
}
