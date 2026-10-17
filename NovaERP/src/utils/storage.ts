// Storage utility for consistent localStorage/sessionStorage access

const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  USER: "user",
} as const;

export const storage = {
  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setToken: (token: string, rememberMe: boolean = false): void => {
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
  },

  removeToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getUser: <T>(): T | null => {
    const user = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
    if (!user) return null;

    try {
      return JSON.parse(user) as T;
    } catch {
      return null;
    }
  },

  setUser: <T>(user: T, rememberMe: boolean = false): void => {
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      sessionStorage.removeItem(STORAGE_KEYS.USER);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  removeUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
  },

  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
  },
};
