interface Bookmark {
  id: string;
  type: 'bookmark';
  title: string;
  url: string;
  faviconUrl: string;
}

let obsoleteBookmarks: Bookmark[] = [];

export async function getObsoleteBookmarks(): Promise<Bookmark[]> {
  if (!obsoleteBookmarks) {
    obsoleteBookmarks = [];
  }
  return obsoleteBookmarks;
}

export async function addObsoleteBookmark(bookmark: { url: string, title?: string }): Promise<void> {
  if (!obsoleteBookmarks.some(b => b.url === bookmark.url)) {
    obsoleteBookmarks.push({
      id: `obsolete-${obsoleteBookmarks.length + 1}`,
      type: 'bookmark',
      url: bookmark.url,
      title: bookmark.title || bookmark.url,
      faviconUrl: '/favicons/default-icon.png'
    });
  }
}

// Limpiar la lista de obsoletos
export async function clearObsoleteBookmarks(): Promise<void> {
  obsoleteBookmarks = [];
}