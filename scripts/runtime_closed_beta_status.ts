import { getClosedBetaRuntimeStatus } from "@/server/services/closedBetaRuntimeStatus";

getClosedBetaRuntimeStatus()
  .then((status) => {
    console.log(JSON.stringify(status, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

