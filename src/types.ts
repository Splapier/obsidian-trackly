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
  books: true,
  webNovels: true,
  manga: true,
  anime: true,
  tvShows: true,
  movies: false,
};

export const MEDIA_TYPE_COLORS: Record<MediaType, string> = {
  games: '#00b347',
  books: '#e6a817',
  webNovels: '#d63384',
  manga: '#7b2d8e',
  anime: '#e00020',
  tvShows: '#0091ea',
  movies: '#20b2aa',
};

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function titleCase(name: string): string {
  return name.split(/\s+/).map((word) => {
    if (!word.length) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}
