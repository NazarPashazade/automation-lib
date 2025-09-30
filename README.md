## 🔹 Usage

Functions Overview

#### Library exposes three key functions:

- init(config) – Initialize the library with environment-specific values (Azure Storage + Service Bus).

- executeStep(options) – Run an automation step (click, type, navigate, etc.) and log snapshots or failures.

- getConfig() – Access the configuration that was set by init()

---

### 🔹 init(config): Required Setup

Purpose:

- Set up your library with the configuration. This avoids hardcoding credentials and allows the library to securely use Azure resources.

- After calling init, your library internally stores these values and uses them for:

  - Uploading failure snapshots or last-passed snapshots to Azure Storage.

  - Sending step logs to Azure Service Bus.

  ```js
  const { init } = require("@nazar-pasha/automation-lib");

  init({
    STORAGE_CONTAINER_NAME: "my-container",
    STORAGE_CONNECTION_STRING:
      "DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net",
    SERVICE_BUS_QUEUE_NAME: "failed-steps",
    SERVICE_BUS_CONNECTION_STRING:
      "Endpoint=sb://...;SharedAccessKeyName=...;SharedAccessKey=...",
  });
  ```

---

### 🔹 executeStep(options)

Purpose:

- Wrap a single automation step in a structured log. Handles errors, takes snapshots, and optionally pushes logs to Service Bus.

- Parameters (all in a single object):

  ```js
  interface ExecuteStepOptions {
    stepName: string; // Name of the step for logging
    page: any; // Puppeteer page object
    actionFn: Function; // Async function that performs the action (click, type, navigate)
    selector?: string; // CSS selector for reference in logs
    additionalInfo?: object; // Optional metadata
    expectNavigation?: boolean; // Set true if step triggers page navigation
    storyboardId: string;
  }
  ```

- Usage

  ```ts
  const { executeStep } = require("@nazar-pasha/automation-lib");

  await executeStep({
    storyboardId: "12345",
    stepName: "Click Login Button",
    page, // puppeteer page
    selector: "#login-btn",
    expectNavigation: true,
    actionFn: async () => {
      const btn = await page.waitForSelector("#login-btn");
      await btn.click();
    },
  });
  ```

## Azure Service Bus Input

Here is an example of a json object passed to Azure Service Bus in case failure

```json
{
  "storyboardId": "123e9078975b098094567e89b",
  "stepName": "Click Anwendungen",
  "sourceURL": "https://example.com/login",
  "selector": "/html/body/div[2]/div[2]/div[3]/a",
  "failureReason": "waiting for XPath `/html/body/div[2]/a` failed: timeout 30000ms exceeded",
  "lastPassedSnapshotURL": "https://example.com/snapshots/LastPassedSnapshot.html",
  "failureSnapshotURL": "https://example.com/snapshots/FailureSnapshot.html",
  "failedCodeSnippet": "const el = await page.waitForXPath(selectors.portalView.anwendungen);\nawait el.click();"
}
```
