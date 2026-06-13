export type MediaType = 'games' | 'books' | 'webNovels' | 'manga' | 'anime' | 'tvShows' | 'movies';

export type Status = 'Not Started' | 'Started' | 'Completed' | 'Dropped';

export interface MediaEntry {
  id: string;
  name: string;
  type: MediaType;
  status: Status;
  progress: number;
  total: number;
  rating: number;
}

export const MEDIA_TYPES: MediaType[] = ['games', 'books', 'webNovels', 'manga', 'anime', 'tvShows', 'movies'];

export const STATUS_OPTIONS: Status[] = ['Not Started', 'Started', 'Completed', 'Dropped'];

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  games: 'Games',
  books: 'Books',
  webNovels: 'Web Novels',
  manga: 'Manga',
  anime: 'Anime',
  tvShows: 'TV Shows',
  movies: 'Movies',
};

export const MEDIA_TYPE_FILE_NAMES: Record<MediaType, string> = {
  games: 'Games',
  books: 'Books',
  webNovels: 'Web Novels',
  manga: 'Manga',
  anime: 'Anime',
  tvShows: 'TV Shows',
  movies: 'Movies',
};

export const HAS_PROGRESS: Record<MediaType, boolean> = {
  games: false,
  books: false,
  webNovels: true,
  manga: true,
  anime: true,
  tvShows: true,
  movies: false,
};

export const MEDIA_TYPE_COLORS: Record<MediaType, string> = {
  games: '#4ade80',
  books: '#f59e0b',
  webNovels: '#f97316',
  manga: '#a855f7',
  anime: '#ec4899',
  tvShows: '#3b82f6',
  movies: '#14b8a6',
};

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
