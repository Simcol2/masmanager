import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

export type UploadProgress = (pct: number) => void;

/**
 * Upload a file to Firebase Storage and return its public download URL.
 * @param path   Storage path, e.g. "masterPieces/arm-bands.jpg"
 * @param file   The File object from an <input type="file">
 * @param onProgress  Optional callback with 0-100 progress
 */
export function uploadFile(
  path: string,
  file: File,
  onProgress?: UploadProgress
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Upload a master piece photo and return the download URL.
 * Files are stored at masterPieces/{pieceId}/{filename}
 */
export async function uploadMasterPiecePhoto(
  pieceId: string,
  file: File,
  onProgress?: UploadProgress
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `masterPieces/${pieceId}/photo.${ext}`;
  return uploadFile(path, file, onProgress);
}

/**
 * Upload a season piece config photo.
 * Files are stored at seasonPieces/{seasonId}/{costumeType}/{pieceId}/{filename}
 */
export async function uploadSeasonPiecePhoto(
  seasonId: string,
  costumeType: string,
  pieceId: string,
  file: File,
  onProgress?: UploadProgress
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `seasonPieces/${seasonId}/${costumeType}/${pieceId}/photo.${ext}`;
  return uploadFile(path, file, onProgress);
}

/**
 * Delete a file from Firebase Storage by its full URL.
 */
export async function deleteFileByURL(url: string): Promise<void> {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // File may not exist — ignore
  }
}
