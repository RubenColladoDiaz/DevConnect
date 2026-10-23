import { Comment } from './Comment';

export type PostCodeTheme = 'dark' | 'light' | 'monokai';

export type PostCodeLanguage =
  | 'JavaScript'
  | 'TypeScript'
  | 'Python'
  | 'Java'
  | 'C#'
  | 'HTML'
  | 'CSS'
  | 'SQL'
  | 'Text';

export type PostContentBlock =
  | {
      type: 'text';
      content: string;
    }
  | {
      type: 'code';
      content: string;
      language: PostCodeLanguage;
      theme: PostCodeTheme;
    };

export type PostType = 'post' | 'question';

export type Post = {
  _id: string;
  username: string;
  authorId?: number;
  type?: PostType;
  acceptedAnswerIds?: string[];
  content: string;
  contentBlocks?: PostContentBlock[];
  reposts: number;
  views: number;
  tags: string[];
  createdAt: Date;
  likes: number;
  liked?: boolean;
  reposted?: boolean;
  comments: Comment[];
};
