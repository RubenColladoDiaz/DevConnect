import { ChangeDetectorRef, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { User } from '../../../shared/types/User';
import { PostsService } from '../../../shared/services/posts-service';
import { Post } from '../../../shared/types/Post';
import { UsersService } from '../../../shared/services/users-service';
import { AuthService } from '../../../shared/services/auth-service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ProjectsService } from '../../../shared/services/projects-service';
import { Project, ProjectStatus } from '../../../shared/types/Project';

type UserListItem = Pick<User, 'userId' | 'username' | 'display_name' | 'avatar_url'>;

@Component({
  selector: 'app-my-account-page',
  standalone: false,
  templateUrl: './my-account-page.html',
  styleUrl: './my-account-page.css',
})
export class MyAccountPage implements OnInit {
  user: WritableSignal<User>;

  postsFromUser: Post[] = [];
  reposts: WritableSignal<Post>[] = [];
  savedPosts: WritableSignal<Post>[] = [];
  likedPosts: WritableSignal<Post>[] = [];
  projects: WritableSignal<Project>[] = [];
  collaborations: WritableSignal<Project>[] = [];
  projectInvitations: Project[] = [];
  likes: number = 0;
  comments: number = 0;
  followers: number = 0;
  followersList: UserListItem[] = [];
  followingList: UserListItem[] = [];
  activeUserList: 'followers' | 'following' | null = null;
  connectionsError: string = '';
  views: number = 0;
  isOwnProfile: boolean = true;
  isFollowing: boolean = false;
  isUpdatingFollow: boolean = false;
  followError: string = '';

  get isLoggedIn(): boolean {
    return !!this.authService.user().username;
  }

  editingBio: boolean = false;
  editedBio: string = '';
  editingAvatar: boolean = false;
  editedAvatar: string = '';
  avatarError: string = '';
  editingProfile = false;
  editedDisplayName = '';
  editedUsername = '';
  editedLocation = '';
  editedJobTitle = '';
  editedCompany = '';
  editedPortfolio = '';
  profileError = '';
  hasCv = false;
  cvError = '';
  editingStack = false;
  editedStack: string[] = [];
  technologyInput = '';
  stackError = '';
  editingCover = false;
  editedCover = '';
  coverError = '';
  creatingProject = false;
  editingProjectId = '';
  newProjectName = '';
  newProjectDescription = '';
  newProjectImage = '';
  newProjectGit = '';
  newProjectStatus: ProjectStatus = 'in_progress';
  newProjectStartDate = '';
  newProjectEndDate = '';
  newProjectCollaborators: string[] = [];
  collaboratorInput = '';
  projectError = '';
  sharingProject = false;
  projectPostContent = '';
  projectPostError = '';

  constructor(
    private postsService: PostsService,
    private projectsService: ProjectsService,
    private usersService: UsersService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.user = this.authService.user;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const username = params.get('username');
      this.isOwnProfile = !username || username === this.authService.user().username;
      this.editingBio = false;
      this.editingAvatar = false;
      this.editingProfile = false;
      this.editingStack = false;
      this.editingCover = false;
      this.isFollowing = false;
      this.followError = '';
      this.activeUserList = null;
      this.connectionsError = '';
      this.followersList = [];
      this.followingList = [];
      this.savedPosts = [];
      this.likedPosts = [];
      this.projects = [];
      this.collaborations = [];
      this.projectInvitations = [];
      this.creatingProject = false;
      this.sharingProject = false;
      this.hasCv = false;
      this.cvError = '';

      if (this.isOwnProfile) {
        this.getSavedPosts();
        this.getLikedPosts();
        this.getProjectInvitations();
      }

      if (username) {
        if (this.isOwnProfile) {
          this.user = this.authService.user;
        }
        this.getAllInfoFromUser(username);
      } else {
        this.user = this.authService.user;
        this.getAllInfoFromUser();
      }
    });
  }

  editProfile(): void {
    this.editedDisplayName = this.user().display_name || '';
    this.editedUsername = this.user().username || '';
    this.editedLocation = this.user().location || 'Unknown';
    this.editedJobTitle = this.user().job_title || '';
    this.editedCompany = this.user().company || '';
    this.editedPortfolio = this.user().portfolio_url || '';
    this.profileError = '';
    this.editingProfile = true;
  }

  saveProfile(): void {
    this.profileError = '';
    this.usersService
      .UpdateProfile(
        this.editedDisplayName,
        this.editedUsername,
        this.editedLocation,
        this.editedJobTitle,
        this.editedCompany,
        this.editedPortfolio,
      )
      .subscribe({
        next: (res: any) => {
          localStorage.setItem('token', res.token);
          const updatedUser = { ...this.user(), ...res.user };
          this.authService.setUser(updatedUser);
          this.user = this.authService.user;
          this.editingProfile = false;
          this.cdr.detectChanges();
          this.router.navigate(['/account', updatedUser.username]);
        },
        error: (err) => {
          this.profileError = err.error?.message || 'Failed to update profile';
          this.cdr.detectChanges();
        },
      });
  }

  get cvUrl(): string {
    return this.usersService.GetCvUrl(this.user().userId);
  }

  uploadCv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.cvError = '';
    if (file.type !== 'application/pdf') {
      this.cvError = 'Please choose a PDF file';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.cvError = 'The PDF must be 5 MB or less';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.usersService.UploadCv(file.name, String(reader.result)).subscribe({
        next: () => {
          this.hasCv = true;
          input.value = '';
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cvError = err.error?.message || 'Failed to upload CV';
          input.value = '';
          this.cdr.detectChanges();
        },
      });
    };
    reader.readAsDataURL(file);
  }

  cancelProfile(): void {
    this.editingProfile = false;
    this.profileError = '';
  }

  editStack(): void {
    this.editedStack = [...(this.user().stack || [])];
    this.technologyInput = '';
    this.stackError = '';
    this.editingStack = true;
  }

  addTechnology(): void {
    const technology = this.technologyInput.trim();
    if (!technology) return;
    if (this.editedStack.some((item) => item.toLowerCase() === technology.toLowerCase())) {
      this.technologyInput = '';
      return;
    }
    this.editedStack.push(technology);
    this.technologyInput = '';
  }

  removeTechnology(technology: string): void {
    this.editedStack = this.editedStack.filter((item) => item !== technology);
  }

  saveStack(): void {
    this.stackError = '';
    this.usersService.UpdateStack(this.editedStack).subscribe({
      next: (res: any) => {
        const updatedUser = { ...this.user(), stack: res.stack };
        this.authService.setUser(updatedUser);
        this.user = this.authService.user;
        this.editingStack = false;
      },
      error: (err) => {
        this.stackError = err.error?.message || 'Failed to update technologies';
      },
    });
  }

  cancelStack(): void {
    this.editingStack = false;
    this.stackError = '';
  }

  editCover(): void {
    this.editedCover = this.user().cover_url || '';
    this.coverError = '';
    this.editingCover = true;
  }

  saveCover(): void {
    const cover = this.editedCover.trim();
    if (cover && !/^https?:\/\/.+/i.test(cover)) {
      this.coverError = 'Please enter a valid image URL starting with http:// or https://';
      return;
    }

    this.usersService.UpdateCover(cover).subscribe({
      next: (res: any) => {
        const updatedUser = { ...this.user(), cover_url: res.cover_url };
        this.authService.setUser(updatedUser);
        this.user = this.authService.user;
        this.editingCover = false;
      },
      error: (err) => {
        this.coverError = err.error?.message || 'Failed to update cover image';
      },
    });
  }

  cancelCover(): void {
    this.editingCover = false;
    this.coverError = '';
  }

  editBio(): void {
    this.editedBio = this.user().bio;
    this.editingBio = true;
  }

  editAvatar(): void {
    this.editedAvatar = this.user().avatar_url || '';
    this.editingAvatar = true;
  }

  saveAvatar(): void {
    const urlPattern = /^(https?:\/\/).+/i;
    if (!this.editedAvatar || !urlPattern.test(this.editedAvatar)) {
      this.avatarError = 'Please enter a valid image URL starting with http:// or https://';
      return;
    }

    this.avatarError = '';
    this.usersService.UpdateAvatar(this.editedAvatar).subscribe({
      next: (res: any) => {
        const updatedUser = { ...this.user(), avatar_url: res.avatar_url };
        this.authService.setUser(updatedUser);
        this.cdr.detectChanges();
        this.editingAvatar = false;
      },
      error: (res: any) => {
        console.log(res);
        this.avatarError = 'Failed to update avatar';
      },
    });
  }

  cancelAvatar(): void {
    this.editedAvatar = '';
    this.editingAvatar = false;
  }

  saveBio(): void {
    this.usersService.UpdateBio(this.editedBio).subscribe({
      next: (res: any) => {
        const updatedUser = { ...this.user(), bio: res.bio };
        this.authService.setUser(updatedUser);
        this.cdr.detectChanges();
      },
      error: (res: any) => {
        console.log(res);
      },
    });
    this.editingBio = false;
  }

  cancelBio(): void {
    this.editedBio = '';
    this.editingBio = false;
  }

  toggleFollow(): void {
    if (this.isOwnProfile || this.isUpdatingFollow || !this.user().userId) return;

    this.isUpdatingFollow = true;
    this.followError = '';
    this.usersService.ToggleFollow(this.user().userId).subscribe({
      next: (res: any) => {
        this.isFollowing = res.isFollowing;
        this.followers = res.followersCount;
        this.user.update((user) => ({ ...user, followers: res.followers }));
        this.getUserConnections(this.user().userId);
        this.isUpdatingFollow = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating follow:', err);
        this.followError = 'Failed to update follow';
        this.isUpdatingFollow = false;
      },
    });
  }

  toggleUserList(list: 'followers' | 'following'): void {
    if (this.activeUserList === list) {
      this.activeUserList = null;
      return;
    }

    this.activeUserList = list;
  }

  private getUserConnections(userId: number): void {
    if (!userId) return;

    this.usersService.GetUserConnections(userId).subscribe({
      next: (res: any) => {
        this.followersList = res.followers;
        this.followingList = res.following;
        this.connectionsError = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading followers and following:', err);
        this.connectionsError = 'Failed to load followers and following';
      },
    });
  }

  private parseCreatedAt(value: any): Date | any {
    if (!value) return value;
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    if (value.$date) return new Date(value.$date);
    return new Date(value);
  }

  getAllInfoFromUser(username?: string): void {
    this.postsService.getAllInfoFromUser(username).subscribe({
      next: (res: any) => {
        if (username && !this.isOwnProfile) {
          this.user = signal<User>({
            ...res.user,
            email: '',
            password: '',
          });
          this.isFollowing = res.isFollowing;
        }
        this.views = res.user?.profile_views ?? res.views ?? 0;
        this.hasCv = res.hasCv;
        this.getUserConnections(this.user().userId);
        this.getProjects(this.user().userId);
        this.postsFromUser = res.posts.map((post: any) => ({
          ...post,
          createdAt: this.parseCreatedAt(post.createdAt),
        }));
        this.likes = res.likes;
        this.comments = res.comments;
        this.followers = res.followersCount ?? res.followers;
        this.reposts = res.reposts.map((post: any) =>
          signal({
            ...post,
            createdAt: this.parseCreatedAt(post.createdAt),
          }),
        );
        this.cdr.detectChanges();
      },
      error: (res: any) => {
        console.log(res);
      },
    });
  }

  getSavedPosts(): void {
    this.postsService.getSavedPosts().subscribe({
      next: (res: any) => {
        this.savedPosts = res.posts.map((post: any) =>
          signal({
            ...post,
            createdAt: this.parseCreatedAt(post.createdAt),
          }),
        );
        this.cdr.detectChanges();
      },
      error: (res: any) => {
        console.log(res);
      },
    });
  }

  getLikedPosts(): void {
    this.postsService.getLikedPosts().subscribe({
      next: (res: any) => {
        this.likedPosts = res.posts.map((post: any) =>
          signal({
            ...post,
            createdAt: this.parseCreatedAt(post.createdAt),
          }),
        );
        this.cdr.detectChanges();
      },
      error: (res: any) => {
        console.log(res);
      },
    });
  }

  getProjects(userId: number): void {
    if (!userId) return;

    this.projectsService.getProjects(userId).subscribe({
      next: (res) => {
        this.projects = res.projects.map((project) => signal(project));
        this.collaborations = res.collaborations.map((project) => signal(project));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading projects:', err),
    });
  }

  getProjectInvitations(): void {
    this.projectsService.getProjectInvitations().subscribe({
      next: (invitations) => {
        this.projectInvitations = invitations;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading project invitations:', err),
    });
  }

  respondInvitation(projectId: string, accepted: boolean): void {
    this.projectsService.respondProjectInvitation(projectId, accepted).subscribe({
      next: () => {
        this.getProjectInvitations();
        this.getProjects(this.user().userId);
      },
      error: (err) => console.error('Error answering project invitation:', err),
    });
  }

  newProject(): void {
    this.newProjectName = '';
    this.newProjectDescription = '';
    this.newProjectImage = '';
    this.newProjectGit = '';
    this.newProjectStatus = 'in_progress';
    this.newProjectStartDate = '';
    this.newProjectEndDate = '';
    this.newProjectCollaborators = [];
    this.collaboratorInput = '';
    this.projectError = '';
    this.editingProjectId = '';
    this.creatingProject = true;
  }

  editProject(project: Project): void {
    this.newProjectName = project.name;
    this.newProjectDescription = project.description;
    this.newProjectImage = project.image_url;
    this.newProjectGit = project.git_url;
    this.newProjectStatus = project.status;
    this.newProjectStartDate = project.start_date;
    this.newProjectEndDate = project.end_date;
    this.newProjectCollaborators = [];
    this.collaboratorInput = '';
    this.projectError = '';
    this.editingProjectId = project._id;
    this.creatingProject = true;
  }

  removeProject(projectId: string): void {
    this.projects = this.projects.filter((project) => project()._id !== projectId);
    this.collaborations = this.collaborations.filter((project) => project()._id !== projectId);
    this.cdr.detectChanges();
  }

  addCollaborator(): void {
    const username = this.collaboratorInput.trim();
    if (!username) return;
    if (this.newProjectCollaborators.some((item) => item.toLowerCase() === username.toLowerCase())) {
      this.collaboratorInput = '';
      return;
    }
    this.newProjectCollaborators.push(username);
    this.collaboratorInput = '';
  }

  removeCollaborator(username: string): void {
    this.newProjectCollaborators = this.newProjectCollaborators.filter((item) => item !== username);
  }

  saveProject(): void {
    if (!this.newProjectName.trim()) {
      this.projectError = 'Please enter a project name';
      return;
    }

    this.projectError = '';

    if (this.editingProjectId) {
      this.updateProject();
      return;
    }

    this.projectsService
      .createProject(
        this.newProjectName,
        this.newProjectDescription,
        this.newProjectImage,
        this.newProjectGit,
        this.newProjectStatus,
        this.newProjectStartDate,
        this.newProjectEndDate,
        this.newProjectCollaborators,
      )
      .subscribe({
        next: (res: any) => {
          this.projects = [signal(res.project), ...this.projects];
          this.creatingProject = false;
          this.projectPostContent = this.buildProjectPost(res.project);
          this.projectPostError = '';
          this.sharingProject = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.projectError = err.error?.message || 'Failed to create project';
          this.cdr.detectChanges();
        },
      });
  }

  updateProject(): void {
    this.projectsService
      .updateProject(
        this.editingProjectId,
        this.newProjectName,
        this.newProjectDescription,
        this.newProjectImage,
        this.newProjectGit,
        this.newProjectStatus,
        this.newProjectStartDate,
        this.newProjectEndDate,
      )
      .subscribe({
        next: (res: any) => {
          const updatedProject = this.projects.find((project) => project()._id === res.project._id);
          if (updatedProject) {
            updatedProject.set(res.project);
          }
          this.creatingProject = false;
          this.editingProjectId = '';
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.projectError = err.error?.message || 'Failed to update project';
          this.cdr.detectChanges();
        },
      });
  }

  buildProjectPost(project: Project): string {
    let content = '';
    if (project.status === 'finished') {
      content = '🚀 I have just finished a new project: ' + project.name + '!';
    } else {
      content = '🚀 I have just started working on a new project: ' + project.name + '!';
    }

    if (project.description) {
      content += '\n\n' + project.description;
    }
    if (project.git_url) {
      content += '\n\nTake a look at the code: ' + project.git_url;
    }
    content += '\n\nAny feedback is welcome!';

    return content;
  }

  publishProjectPost(): void {
    const content = this.projectPostContent.trim();
    if (!content) {
      this.projectPostError = 'The post cannot be empty';
      return;
    }

    this.projectPostError = '';
    this.postsService
      .createPost(content, ['project'], [{ type: 'text', content: content }], 'post')
      .subscribe({
        next: (res: any) => {
          this.postsFromUser = [
            { ...res.post, createdAt: this.parseCreatedAt(res.post.createdAt) },
            ...this.postsFromUser,
          ];
          this.sharingProject = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.projectPostError = err.error?.message || 'Failed to publish post';
          this.cdr.detectChanges();
        },
      });
  }

  cancelProjectPost(): void {
    this.sharingProject = false;
    this.projectPostError = '';
  }

  cancelProject(): void {
    this.creatingProject = false;
    this.projectError = '';
  }
}
