import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Home } from '../../../views/pages/home/home';
import {ComponentsModule} from "../components/components-module";

@NgModule({
  declarations: [Home],
    imports: [CommonModule, ComponentsModule],
  exports: [Home],
})
export class PagesModule {}
