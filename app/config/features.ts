export interface Feature {
  enabled: boolean;
  message?: string;
}

export const FEATURES: Record<string, Feature> = {
  dashboard: {
    enabled: false,
    message: "Dashboard coming soon! We're building something amazing for you."
  },
  transactions: {
    enabled: false,
    message: "Transaction tracking coming soon"
  },
  positions: {
    enabled: false,
    message: "Position management coming soon"
  },
  tradeLots: {
    enabled: false,
    message: "Trade lot tracking coming soon"
  },
  reports: {
    enabled: false,
    message: "Reports and analytics coming soon"
  }
};

export function isFeatureEnabled(featureName: string): boolean {
  return FEATURES[featureName]?.enabled ?? false;
}

export function getFeatureMessage(featureName: string): string {
  return FEATURES[featureName]?.message ?? "Coming soon";
}