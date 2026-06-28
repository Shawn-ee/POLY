import { generateResolutionProposalsOnce } from "@/server/services/resolutionProposalBot";

generateResolutionProposalsOnce({ store: process.env.RESOLUTION_PROPOSAL_STORE !== "false" })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
