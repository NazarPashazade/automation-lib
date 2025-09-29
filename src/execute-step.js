const { sendToServiceBus } = require("./service-bus");
const {
  captureFailureSnapshot,
  captureLastPassedSnapshot,
  fetchLastPassedSnapshotURL,
} = require("./storage");

async function executeStep({
  stepName,
  page,
  actionFn,
  selector = null,
  additionalInfo = {},
  expectNavigation = false,
  storyboardId,
}) {
  const log = {
    stepName,
    checkpointType: selector ? "action" : "navigation",
    selector,
    sourceURL: page.url(),
    expectedOutcome: "element visible and intractable",
    status: "pending",
    failureReason: null,
    lastPassedSnapshotURL: null,
    failureSnapshotURL: null,
    // failureScreenshotFileURL: null,
    timestamp: new Date().toISOString(),
    additionalInfo,
  };

  const safeStepName = stepName.replace(/\s+/g, "_");

  try {
    if (expectNavigation) {
      await Promise.all([
        actionFn(),
        page.waitForNavigation({ waitUntil: "networkidle0" }),
      ]);
    } else {
      await actionFn();
    }

    log.status = "SUCCESS";

    log.lastPassedSnapshotURL = await captureLastPassedSnapshot(
      page,
      storyboardId,
      safeStepName
    );
  } catch (err) {
    log.status = "FAILED";
    log.failureReason = err.message;

    log.failureSnapshotURL = await captureFailureSnapshot(
      page,
      storyboardId,
      safeStepName
    );

    log.lastPassedSnapshotURL = await fetchLastPassedSnapshotURL(
      storyboardId,
      safeStepName
    );

    await sendToServiceBus(log);

    throw new Error(`Step failed: ${stepName} - ${log.failureReason}`);
  }

  console.log(JSON.stringify(log, null, 2));
  return log;
}

module.exports = executeStep;
