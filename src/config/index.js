let config = {};

function init(customConfig = {}) {
  config = { ...customConfig };
}

function getConfig() {
  if (
    !config.STORAGE_CONTAINER_NAME ||
    !config.STORAGE_CONNECTION_STRING ||
    !config.SERVICE_BUS_QUEUE_NAME ||
    !config.SERVICE_BUS_CONNECTION_STRING
  ) {
    throw new Error(
      "❌ Config not initialized. Please call init({...}) before using the library."
    );
  }
  return config;
}

module.exports = { init, getConfig };
