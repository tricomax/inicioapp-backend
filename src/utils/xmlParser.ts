import { parseStringPromise } from "xml2js";

export async function parseXMLToJSON(xml: string) {
  try {
    console.log("Parsing XML to JSON...");
    const result = await parseStringPromise(xml);
    console.log("XML parsed to JSON successfully.");
    return transformBookmarks(result.xbel);
  } catch (error) {
    console.error("Error parsing XML to JSON:", error);
    throw error;
  }
}

function transformBookmarks(data: any): any {
  if (data.folder) {
    return data.folder.map((folder: any) => ({
      id: folder.$.id,
      title: folder.title[0],
      type: "folder",
      children: folder.bookmark
        ? folder.bookmark
            .map((bookmark: any) => ({
              id: bookmark.$.id,
              title: bookmark.title[0],
              url: bookmark.$.href,
      type: "bookmark",
            }))
            .concat(
              folder.folder ? transformBookmarks(folder) : []
            )
        : folder.folder
        ? transformBookmarks(folder)
        : [],
    }));
  } else if (data.bookmark) {
    return data.bookmark.map((bookmark: any) => ({
      id: bookmark.$.id,
      title: bookmark.title[0],
      url: bookmark.$.href,
      type: "bookmark",
    }));
  } else {
    console.log("Unknown element type:", data);
    return [];
  }
}