import type { PostContentBlock } from './Post';

export type Comment = {
  answerId?: string;
  content: string;
  contentBlocks?: PostContentBlock[];
  username: string;
  avatar_url?: string;
};
