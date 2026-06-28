import { runReferenceRiskMonitorOnce } from "@/server/services/referenceRiskMonitor";

runReferenceRiskMonitorOnce({
  pauseOnRisk: process.env.RISK_MONITOR_PAUSE_ON_ALERT === "true",
  logEvents: process.env.RISK_MONITOR_LOG_EVENTS !== "false",
})
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
