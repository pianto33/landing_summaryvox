/**
 * Metadata para Stripe Radar — free trial abuse prevention.
 * @see https://docs.stripe.com/radar/free-trial-abuse
 */
export const STRIPE_MD_IS_FREE_TRIAL = "is_free_trial";

export function freeTrialRadarMetadata(): Record<string, string> {
  return { [STRIPE_MD_IS_FREE_TRIAL]: "true" };
}
