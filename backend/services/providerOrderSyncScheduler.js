
const {
  claimProviderOrdersForSync,
  syncProviderOrderStatus,
} = require("../models/orderModels");

let schedulerStarted = false;
let schedulerRunning = false;

const BATCH_SIZE = 25;
const POLL_INTERVAL_SECONDS = 60;
const WORKER_COUNT = 5;

const runProviderOrderSync = async () => {
  if (schedulerRunning) {
    return;
  }

  schedulerRunning = true;

  try {
    const orderIds = await claimProviderOrdersForSync({
      batchSize: BATCH_SIZE,
      intervalSeconds: POLL_INTERVAL_SECONDS,
    });

    if (orderIds.length === 0) {
      return;
    }

    console.log(
      `[Provider Sync] Claimed ${orderIds.length} orders.`
    );

    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < orderIds.length) {
        const currentIndex = nextIndex++;
        const orderId = orderIds[currentIndex];

        try {
          const result = await syncProviderOrderStatus(orderId, {
  alreadyClaimed: true,
});

          console.log(
            `[Provider Sync] Order ${orderId}: ${
              result?.status || "Skipped"
            }`
          );
        } catch (error) {
          console.error(
            `[Provider Sync] Order ${orderId} failed:`,
            error.message
          );
        }
      }
    };

    const workers = Array.from(
      {
        length: Math.min(WORKER_COUNT, orderIds.length),
      },
      () => worker()
    );

    await Promise.all(workers);

  } catch (error) {
    console.error(
      "[Provider Sync] Scheduler error:",
      error
    );
  } finally {
    schedulerRunning = false;
  }
};

const startProviderOrderSyncScheduler = () => {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;

  console.log(
    "[Provider Sync] Automatic synchronization enabled."
  );

  // Run once when the server starts.
  runProviderOrderSync();

  // Then run every 60 seconds.
  setInterval(
    runProviderOrderSync,
    POLL_INTERVAL_SECONDS * 1000
  );
};

module.exports = {
  startProviderOrderSyncScheduler,
  runProviderOrderSync,
};
