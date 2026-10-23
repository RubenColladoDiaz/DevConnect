import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Project, ProjectStatus } from '../types/Project';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private nodeURL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getProjects(userId: number): Observable<{ projects: Project[]; collaborations: Project[] }> {
    return this.http.get<{ projects: Project[]; collaborations: Project[] }>(
      `${this.nodeURL}/getProjects/${userId}`,
    );
  }

  getProjectInvitations(): Observable<Project[]> {
    const token = localStorage.getItem('token');

    return this.http.get<Project[]>(this.nodeURL + '/getProjectInvitations', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  createProject(
    name: string,
    description: string,
    image_url: string,
    git_url: string,
    status: ProjectStatus,
    start_date: string,
    end_date: string,
    collaborators: string[],
  ): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      name,
      description,
      image_url,
      git_url,
      status,
      start_date,
      end_date,
      collaborators,
    };
    return this.http.post(this.nodeURL + '/createProject', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  inviteCollaborator(projectId: string, username: string): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      projectId,
      username,
    };
    return this.http.post(this.nodeURL + '/inviteCollaborator', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  updateProject(
    projectId: string,
    name: string,
    description: string,
    image_url: string,
    git_url: string,
    status: ProjectStatus,
    start_date: string,
    end_date: string,
  ): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      projectId,
      name,
      description,
      image_url,
      git_url,
      status,
      start_date,
      end_date,
    };
    return this.http.post(this.nodeURL + '/updateProject', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  deleteProject(projectId: string): Observable<any> {
    const token = localStorage.getItem('token');

    return this.http.post(
      this.nodeURL + '/deleteProject',
      { projectId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  removeCollaborator(projectId: string, userId: number): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      projectId,
      userId,
    };
    return this.http.post(this.nodeURL + '/removeCollaborator', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  leaveProject(projectId: string): Observable<any> {
    const token = localStorage.getItem('token');

    return this.http.post(
      this.nodeURL + '/leaveProject',
      { projectId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  respondProjectInvitation(projectId: string, accepted: boolean): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      projectId,
      accepted,
    };
    return this.http.post(this.nodeURL + '/respondProjectInvitation', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
