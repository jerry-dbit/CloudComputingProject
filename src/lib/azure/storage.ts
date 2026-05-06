import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'documents';

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

export function getBlobServiceClient(): BlobServiceClient {
  if (!blobServiceClient) {
    if (!connectionString) {
      throw new Error('Azure Storage connection string not configured');
    }
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }
  return blobServiceClient;
}

export function getContainerClient(): ContainerClient {
  if (!containerClient) {
    containerClient = getBlobServiceClient().getContainerClient(containerName);
  }
  return containerClient;
}

export async function uploadFile(file: Buffer, fileName: string, contentType: string): Promise<string> {
  const container = getContainerClient();
  const blobClient = container.getBlockBlobClient(fileName);
  
  await blobClient.uploadData(file, {
    blobHTTPHeaders: {
      blobContentType: contentType,
    },
  });
  
  return blobClient.url;
}

export async function downloadFile(fileName: string): Promise<Blob> {
  const container = getContainerClient();
  const blobClient = container.getBlockBlobClient(fileName);
  
  const downloadBlockBlobResponse = await blobClient.download();
  return downloadBlockBlobResponse.blobBody as Promise<Blob>;
}

export async function deleteFile(fileName: string): Promise<void> {
  const container = getContainerClient();
  const blobClient = container.getBlockBlobClient(fileName);
  
  await blobClient.delete();
}

export function getFileUrl(fileName: string): string {
  const container = getContainerClient();
  return container.getBlockBlobClient(fileName).url;
}