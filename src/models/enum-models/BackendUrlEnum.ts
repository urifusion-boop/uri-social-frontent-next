export const BackendUrlEnum = {
  INSIGHTS: '',
} as const;

export type BackendUrlEnum = (typeof BackendUrlEnum)[keyof typeof BackendUrlEnum];
