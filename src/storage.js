const { BlobServiceClient } = require("@azure/storage-blob");
const { getConfig } = require("./config");

const getFileName = (suffix, safeStepName, format = "html") => {
  return `${suffix}-${safeStepName}.${format}`;
};

function getContainerClient() {
  const { STORAGE_CONNECTION_STRING, STORAGE_CONTAINER_NAME } = getConfig();

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    STORAGE_CONNECTION_STRING
  );
  return blobServiceClient.getContainerClient(STORAGE_CONTAINER_NAME);
}

async function ensureContainerExists(containerClient) {
  const exists = await containerClient.exists();
  if (!exists) await containerClient.create();
}

async function uploadToBlob(
  storyBoardId,
  fileName,
  buffer,
  contentType = "application/octet-stream"
) {
  const containerClient = getContainerClient();
  try {
    await ensureContainerExists(containerClient);
    const blobName = `${storyBoardId}/${fileName}`;
    const blobClient = containerClient.getBlockBlobClient(blobName);
    const options = { blobHTTPHeaders: { blobContentType: contentType } };
    await blobClient.uploadData(buffer, options);
    console.log(`Uploaded: ${fileName}`);
    return blobClient.url;
  } catch (err) {
    console.error("❌ Upload failed:", err.message);
    return null;
  }
}

async function captureFailureSnapshot(page, storyBoardId, stepName) {
  const html = await page.content();
  const buffer = Buffer.from(html, "utf-8");
  const fileName = getFileName("FailureSnapshot", stepName, "html");
  return uploadToBlob(storyBoardId, fileName, buffer, "text/html");
}

async function captureLastPassedSnapshot(page, storyBoardId, stepName) {
  const html = await page.content();
  const buffer = Buffer.from(html, "utf-8");
  const fileName = getFileName("LastPassedSnapshot", stepName, "html");
  return uploadToBlob(storyBoardId, fileName, buffer, "text/html");
}

async function fetchLastPassedSnapshotURL(storyboardId, stepName) {
  const { STORAGE_CONNECTION_STRING, STORAGE_CONTAINER_NAME } = getConfig();
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(
    STORAGE_CONTAINER_NAME
  );

  const fileName = getFileName("LastPassedSnapshot", stepName, "html");
  const blobName = `${storyboardId}/${fileName}`;
  const blobClient = containerClient.getBlockBlobClient(blobName);
  const exists = await blobClient.exists();
  const url = exists ? blobClient.url : null;
  console.log(`Fetched: ${url}`);
  return url;
}

async function captureScreenshot(
  page,
  storyBoardId,
  stepName,
  suffix = "Failure"
) {
  const buffer = await page.screenshot();
  const fileName = `${suffix}Screenshot-${stepName}.png`;
  return uploadToBlob(storyBoardId, fileName, buffer, "image/png");
}

module.exports = {
  captureFailureSnapshot,
  captureLastPassedSnapshot,
  captureScreenshot,
  fetchLastPassedSnapshotURL,
};
