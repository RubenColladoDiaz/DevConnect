import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../../views/components/header/header';
import { NewPostComponent } from '../../../views/components/new-post-component/new-post-component';

@NgModule({
  declarations: [Header, NewPostComponent],
  imports: [CommonModule],
  exports: [Header, NewPostComponent],
})
export class ComponentsModule {}
