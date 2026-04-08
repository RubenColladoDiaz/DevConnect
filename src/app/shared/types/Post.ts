export type Post = {
  username: string;
  content: string;
  reposts: number;
  views: number;
  tags: string[];
  createdAt: Date;
  likes: number;
  comments: string[];
};
