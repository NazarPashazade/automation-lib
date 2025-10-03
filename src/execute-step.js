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
  storyboardId,
  selector = null,
  additionalInfo = {},
  expectNavigation = false,
  onError = null,
}) {
  const log = {
    storyboardId,
    stepName,
    selector,
    sourceURL: page.url(),
    status: "pending",
    failureReason: null,
    lastPassedSnapshotURL: null,
    failureSnapshotURL: null,
    timestamp: new Date().toISOString(),
    failedCodeSnippet: "",
    additionalInfo,
  };

  const safeStepName = stepName.replace(/\s+/g, "_");

  try {
    const fnString = actionFn.toString();
    const bodyMatch = fnString.match(/{([\s\S]*)}/);
    log.failedCodeSnippet = bodyMatch ? bodyMatch[1].trim() : fnString;
  } catch (_) {
    log.failedCodeSnippet = "Unable to capture code snippet.";
  }

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

    if (typeof onError === "function") {
      await onError(err, log);
    } else {
      await sendToServiceBus(log);
      throw new Error(`Step failed: ${stepName} - ${log.failureReason}`);
    }
  }

  console.log(log);
  return log;
}

module.exports = executeStep;
