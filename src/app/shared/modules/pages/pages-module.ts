import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Home } from '../../../views/pages/home/home';
import { ComponentsModule } from '../components/components-module';
import { AppRoutingModule } from '../../../app-routing-module';
import { LoginPage } from '../../../views/pages/login-page/login-page';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [Home, LoginPage],
  imports: [CommonModule, ComponentsModule, AppRoutingModule, FormsModule],
  exports: [Home, LoginPage],
})
export class PagesModule {}
