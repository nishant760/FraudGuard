export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Dispatches a custom event to dynamically shift background dots
 * to the corresponding risk color for 3 seconds, then auto-revert to emerald green.
 */
export const triggerRiskDots = (riskLevel: RiskLevel) => {
  window.dispatchEvent(
    new CustomEvent('fraudguard:risk-assessed', {
      detail: { riskLevel },
    })
  );
};
