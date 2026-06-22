import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Home } from '../../../views/pages/home/home';
import { ComponentsModule } from '../components/components-module';
import { LoginPage } from '../../../views/pages/login-page/login-page';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegisterPage } from '../../../views/pages/register-page/register-page';
import { MyAccountPage } from '../../../views/pages/my-account-page/my-account-page';

@NgModule({
  declarations: [Home, LoginPage, RegisterPage, MyAccountPage],
  imports: [
    CommonModule,
    ComponentsModule,
    FormsModule,
    NgOptimizedImage,
    ReactiveFormsModule,
    RouterModule,
  ],
  exports: [Home, LoginPage, RegisterPage, MyAccountPage],
})
export class PagesModule {}
