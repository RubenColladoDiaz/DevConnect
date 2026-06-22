import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Home } from './views/pages/home/home';
import { LoginPage } from './views/pages/login-page/login-page';
import { RegisterPage } from './views/pages/register-page/register-page';
import { MyAccountPage } from './views/pages/my-account-page/my-account-page';

const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'my-account', component: MyAccountPage },
];

@NgModule({
  imports: [RouterModule.forRoot(routes), CommonModule],
  exports: [RouterModule],
})
export class AppRoutingModule {}
