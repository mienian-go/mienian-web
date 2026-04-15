import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";
import { v4 as uuidv4 } from "uuid"; // We'll need to install uuid

export const uploadFile = async (file: File, folder: string) => {
  const filename = `${uuidv4()}-${file.name}`;
  const storageRef = ref(storage, `${folder}/${filename}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path: `${folder}/${filename}` };
};

export const deleteFile = async (path: string) => {
  if (!path) return;
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (err) {
    console.error("Error deleting file:", err);
  }
};
