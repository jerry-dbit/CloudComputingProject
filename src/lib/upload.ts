import { uploadFile as uploadAzureFile } from '@/lib/azure/storage';

export interface UploadResult {
  storageUrl: string;
  storagePath: string;
}

export async function persistFile(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<UploadResult> {
  if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is required for uploads.');
  }

  const azureUrl = await uploadAzureFile(buffer, fileName, contentType);
  return {
    storagePath: fileName,
    storageUrl: azureUrl,
  };
}
