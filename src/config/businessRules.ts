export const BUSINESS_RULES = {
  approvalThreshold: Number(process.env.AGENT_APPROVAL_THRESHOLD ?? 25000),
  unsafeWorkflowPhrases: [
    "approve payment",
    "release payment",
    "clear payment block",
    "close po",
    "approve invoice",
    "release invoice"
  ]
};
