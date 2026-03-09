import { Component } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, NgForm, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-login-page',
  standalone: false,
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {

  loginForm:FormGroup;

  constructor(private fb:FormBuilder, private http:HttpClient) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    })
  }

  onLogin(){
    if(this.loginForm.invalid) return;

    this.http.post("http://localhost:3000/login", this.loginForm.value)
      .subscribe((res: any) => {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
      });
  }
}
