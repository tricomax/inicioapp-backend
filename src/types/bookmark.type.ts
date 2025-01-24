export interface Bookmark {
  id: string;
  title: string;
  url: string;
  type: 'bookmark' | 'folder';
  location?: string;  // Ruta al archivo del icono
  children?: Bookmark[];
}