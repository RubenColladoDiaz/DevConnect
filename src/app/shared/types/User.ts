export type User = {
  userId: number;
  username: string;
  display_name: string;
  bio: string;
  stack: string[];
  followers: number[];
  email: string;
  password: string;
  locatinon: string;
  status: string;
  avatar_url: string;
  created_at: string;
};

export type UserSearchResult = Pick<User, 'userId' | 'username' | 'display_name' | 'avatar_url'>;
