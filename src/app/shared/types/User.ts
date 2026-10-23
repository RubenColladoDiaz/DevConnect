export type User = {
  userId: number;
  username: string;
  display_name: string;
  bio: string;
  stack: string[];
  followers: number[];
  email: string;
  password: string;
  location: string;
  status: string;
  avatar_url: string;
  cover_url?: string;
  job_title?: string;
  company?: string;
  portfolio_url?: string;
  profile_views?: number;
  created_at: string;
};

export type UserSearchResult = Pick<User, 'userId' | 'username' | 'display_name' | 'avatar_url'>;

export type TopFollowerUser = UserSearchResult & {
  followersCount: number;
};

export type TopViewedUser = UserSearchResult & {
  profile_views: number;
};

export type FollowingPresence = UserSearchResult & {
  online: boolean;
};

export type TopQuestionSolver = UserSearchResult & {
  solvedQuestionCount: number;
};
