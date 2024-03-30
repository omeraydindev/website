interface PostMetadata {
  title: string;
  date: string;
  categories: Category[];
}

export interface PostWithId extends PostMetadata {
  id: string;
}

export interface PostWithContent extends PostMetadata {
  content: string;
  contentRaw: string;
}

export interface Category {
  id: string;
  title: string;
}
