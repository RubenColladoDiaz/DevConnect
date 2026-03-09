import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Home } from '../../../views/pages/home/home';
import { ComponentsModule } from '../components/components-module';
import { AppRoutingModule } from '../../../app-routing-module';
import { LoginPage } from '../../../views/pages/login-page/login-page';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegisterPage } from '../../../views/pages/register-page/register-page';

@NgModule({
  declarations: [Home, LoginPage, RegisterPage],
  imports: [
    CommonModule,
    ComponentsModule,
    AppRoutingModule,
    FormsModule,
    NgOptimizedImage,
    ReactiveFormsModule,
  ],
  exports: [Home, LoginPage, RegisterPage],
})
export class PagesModule {}
