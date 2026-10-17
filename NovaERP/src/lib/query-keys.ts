// Query key factory for TanStack Query
// Centralizes cache key management to prevent key collisions and enable
// targeted invalidation.

export const queryKeys = {
  // Auth
  auth: {
    me: ["auth", "me"] as const,
  },

  // Company
  companies: {
    all: ["companies"] as const,
    detail: (id: string) => ["companies", id] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    detail: (id: string) => ["users", id] as const,
  },

  // Roles
  roles: {
    all: ["roles"] as const,
    detail: (id: string) => ["roles", id] as const,
  },

  // Future modules — add keys here as modules are developed
  // products: {
  //   all: ["products"] as const,
  //   detail: (id: string) => ["products", id] as const,
  // },
  // categories: {
  //   all: ["categories"] as const,
  //   detail: (id: string) => ["categories", id] as const,
  // },
} as const;
