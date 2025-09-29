const { ServiceBusClient } = require("@azure/service-bus");

const { getConfig } = require("./config");

async function sendToServiceBus(log) {
  const { SERVICE_BUS_CONNECTION_STRING, SERVICE_BUS_QUEUE_NAME } = getConfig();

  const body = {
    stepName: log.stepName,
    selector: log.selector,
    failureReason: log.failureReason,
    expectedOutcome: log.expectedOutcome,
    lastPassedSnapshotURL: log.lastPassedSnapshotURL,
    failureSnapshotURL: log.failureSnapshotURL,
  };

  const sbClient = new ServiceBusClient(SERVICE_BUS_CONNECTION_STRING);
  const sender = sbClient.createSender(SERVICE_BUS_QUEUE_NAME);

  try {
    await sender.sendMessages({ body, contentType: "application/json" });

    console.log(
      `SERVICE_BUS: Step PUSHED to "${SERVICE_BUS_QUEUE_NAME}" Queue: ${body.stepName}`
    );
  } catch (err) {
    console.error("SERVICE_BUS: FAILED to send message:", err.message);
  } finally {
    await sender.close();
    await sbClient.close();
  }
}

module.exports = { sendToServiceBus };
