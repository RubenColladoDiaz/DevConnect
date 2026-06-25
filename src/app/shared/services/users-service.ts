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

  Register(username: string, email: string, password: string, display_name: string) {
    const body = {
      username,
      email,
      password,
      display_name,
    };
    return this.http.post(this.nodeURL + '/register', body);
  }
}
