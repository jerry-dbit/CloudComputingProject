import { CosmosClient, Container } from '@azure/cosmos';

const endpoint = process.env.AZURE_COSMOS_ENDPOINT || '';
const key = process.env.AZURE_COSMOS_KEY || '';

let client: CosmosClient | null = null;

export function getCosmosClient(): CosmosClient {
  if (!client) {
    if (!endpoint || !key) {
      throw new Error('Azure Cosmos DB not configured');
    }
    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

async function getOrCreateDatabase() {
  const client = getCosmosClient();
  const dbResponse = await client.databases.createIfNotExists({
    id: 'studyflow',
  });
  return dbResponse.database;
}

export async function getContainer(containerId: string): Promise<Container> {
  const database = await getOrCreateDatabase();
  const contResponse = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ['/id'] },
  });
  return contResponse.container;
}

export async function createUser(user: {
  id: string;
  email: string;
  username: string;
  avatar: string;
  createdAt: string;
  lastLogin: string;
}) {
  const container = await getContainer('users');
  return await container.items.create(user);
}

export async function getUserById(id: string) {
  const container = await getContainer('users');
  const { resource } = await container.item(id, id).read();
  return resource;
}

export async function createDocument(doc: {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  highlights: unknown[];
  annotations: unknown[];
}) {
  const container = await getContainer('documents');
  return await container.items.create(doc);
}

export async function getDocumentsByUser(userId: string) {
  const container = await getContainer('documents');
  const iterator = container.items.query({
    query: 'SELECT * FROM documents WHERE documents.ownerId = @userId',
    parameters: [{ name: '@userId', value: userId }],
  });
  const { resources } = await iterator.fetchAll();
  return resources;
}

export async function getDocumentById(id: string) {
  const container = await getContainer('documents');
  const { resource } = await container.item(id, id).read();
  return resource;
}

export async function updateDocument(id: string, updates: Record<string, unknown>) {
  const container = await getContainer('documents');
  const { resource } = await container.item(id, id).read();
  
  if (!resource) {
    throw new Error('Document not found');
  }
  
  const updated = { ...resource, ...updates };
  return await container.items.upsert(updated);
}

export async function deleteDocument(id: string) {
  const container = await getContainer('documents');
  return await container.item(id, id).delete();
}

export async function createStudyRoom(room: {
  id: string;
  name: string;
  subject: string;
  code: string;
  ownerId: string;
  maxParticipants: number;
  currentDocumentId: string | null;
  participants: unknown[];
  createdAt: string;
  isActive: boolean;
}) {
  const container = await getContainer('studyrooms');
  return await container.items.create(room);
}

export async function getStudyRooms() {
  const container = await getContainer('studyrooms');
  const iterator = container.items.query(
    'SELECT * FROM studyrooms WHERE studyrooms.isActive = true'
  );
  const { resources } = await iterator.fetchAll();
  return resources;
}

export async function getStudyRoomById(id: string) {
  const container = await getContainer('studyrooms');
  const { resource } = await container.item(id, id).read();
  return resource;
}

export async function getStudyRoomByCode(code: string) {
  const container = await getContainer('studyrooms');
  const iterator = container.items.query({
    query: 'SELECT * FROM studyrooms WHERE studyrooms.code = @code',
    parameters: [{ name: '@code', value: code }],
  });
  const { resources } = await iterator.fetchAll();
  return resources[0];
}

export async function updateStudyRoom(id: string, updates: Record<string, unknown>) {
  const container = await getContainer('studyrooms');
  const { resource } = await container.item(id, id).read();
  
  if (!resource) {
    throw new Error('Study room not found');
  }
  
  const updated = { ...resource, ...updates };
  return await container.items.upsert(updated);
}

export async function deleteStudyRoom(id: string) {
  const container = await getContainer('studyrooms');
  return await container.item(id, id).delete();
}