import { Component, Input, model, ModelSignal, output, signal, WritableSignal } from '@angular/core';
import { Project } from '../../../shared/types/Project';
import { ProjectsService } from '../../../shared/services/projects-service';

@Component({
  selector: 'app-project-template',
  standalone: false,
  templateUrl: './project-template.html',
  styleUrl: './project-template.css',
})
export class ProjectTemplate {
  @Input() canManage = false;
  @Input() canLeave = false;

  project: ModelSignal<Project | undefined> = model<Project>();
  editRequested = output<Project>();
  removed = output<string>();

  inviting: WritableSignal<boolean> = signal<boolean>(false);
  confirmingDelete: WritableSignal<boolean> = signal<boolean>(false);
  errorMessage: WritableSignal<string> = signal<string>('');
  inviteUsername: string = '';

  constructor(private projectsService: ProjectsService) {}

  toggleInviting(): void {
    this.inviting.update((inviting) => !inviting);
    this.inviteUsername = '';
    this.errorMessage.set('');
  }

  inviteCollaborator(): void {
    const id = this.project()?._id;
    const username = this.inviteUsername.trim();
    if (!id || !username) return;

    this.projectsService.inviteCollaborator(id, username).subscribe({
      next: (res) => {
        this.project.set(res.project);
        this.toggleInviting();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to invite collaborator');
      },
    });
  }

  removeCollaborator(userId: number): void {
    const id = this.project()?._id;
    if (!id) return;

    this.projectsService.removeCollaborator(id, userId).subscribe({
      next: (res) => {
        this.project.set(res.project);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to remove collaborator');
      },
    });
  }

  editProject(): void {
    const currentProject = this.project();
    if (!currentProject) return;

    this.editRequested.emit(currentProject);
  }

  toggleConfirmingDelete(): void {
    this.confirmingDelete.update((confirming) => !confirming);
  }

  deleteProject(): void {
    const id = this.project()?._id;
    if (!id) return;

    this.projectsService.deleteProject(id).subscribe({
      next: () => {
        this.removed.emit(id);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete project');
      },
    });
  }

  leaveProject(): void {
    const id = this.project()?._id;
    if (!id) return;

    this.projectsService.leaveProject(id).subscribe({
      next: () => {
        this.removed.emit(id);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to leave project');
      },
    });
  }
}
