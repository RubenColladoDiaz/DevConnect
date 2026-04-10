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

  Register(username: string, email: string, password: string) {
    const body = {
      username,
      email,
      password,
    };
    return this.http.post(this.nodeURL + '/register', body);
  }
}
