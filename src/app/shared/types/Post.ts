export type Post = {
  _id: string;
  username: string;
  content: string;
  reposts: number;
  views: number;
  tags: string[];
  createdAt: Date;
  likes: number;
  liked?: boolean;
  comments: string[];
};
