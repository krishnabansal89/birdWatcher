import { BlobServiceClient } from "@azure/storage-blob";

const account = process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_NAME;
const sasToken = process.env.NEXT_PUBLIC_AZURE_STORAGE_SAS_TOKEN; 

const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net/?${sasToken}`
);

export type BlobInfo = {
    name: string;
    url: string;
    createdAt: Date;
};

export async function getBlobs(containerName: string): Promise<BlobInfo[]> {
  const data: BlobInfo[] = [];
  try {
    const containerClientWithSAS = blobServiceClient.getContainerClient(containerName);
    for await (const blob of containerClientWithSAS.listBlobsFlat()) {
        // Get Blob Client from name, to get the URL
        const tempBlockBlobClient = containerClientWithSAS.getBlockBlobClient(blob.name);
        data.push({name:blob.name, url:tempBlockBlobClient.url, createdAt:new Date(blob.properties.createdOn as unknown as string)})
      }
  } catch (error) {
    console.error("Error fetching blobs:", error);
  }
  return data;
}
