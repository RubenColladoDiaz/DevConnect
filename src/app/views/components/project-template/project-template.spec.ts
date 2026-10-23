import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectsService } from '../../../shared/services/projects-service';

import { ProjectTemplate } from './project-template';

describe('ProjectTemplate', () => {
  let component: ProjectTemplate;
  let fixture: ComponentFixture<ProjectTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectTemplate],
      providers: [{ provide: ProjectsService, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectTemplate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
