import { promises as fs } from 'node:fs';
import path from 'node:path';
import { uploadFile as uploadAzureFile } from '@/lib/azure/storage';

export interface UploadResult {
  storageUrl: string;
  storagePath: string;
}

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

async function saveLocalFile(buffer: Buffer, fileName: string): Promise<UploadResult> {
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const localPath = path.join(LOCAL_UPLOAD_DIR, fileName);
  await fs.writeFile(localPath, buffer);

  return {
    storagePath: `uploads/${fileName}`,
    storageUrl: `/uploads/${fileName}`,
  };
}

export async function persistFile(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<UploadResult> {
  const hasAzure = Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING);

  if (!hasAzure) {
    return saveLocalFile(buffer, fileName);
  }

  try {
    const azureUrl = await uploadAzureFile(buffer, fileName, contentType);
    return {
      storagePath: fileName,
      storageUrl: azureUrl,
    };
  } catch {
    return saveLocalFile(buffer, fileName);
  }
}
