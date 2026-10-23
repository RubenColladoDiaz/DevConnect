import { UserSearchResult } from './User';

export type ProjectStatus = 'in_progress' | 'finished';

export type Project = {
  _id: string;
  ownerId: number;
  name: string;
  description: string;
  image_url: string;
  git_url: string;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  owner?: UserSearchResult;
  collaborators: UserSearchResult[];
  invited: UserSearchResult[];
  createdAt: Date;
};
