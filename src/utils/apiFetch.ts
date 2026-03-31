export interface ApiFetchOptions extends RequestInit {
  cacheKey?: string;
}

export type LoginUser = {
  name: string;
  roles?: string[];
};

const STORAGE_PREFIX = "fc_";

export const apiCheck = async (): Promise<{
  success: boolean;
  user?: LoginUser;
}> => {
  if (!localStorage.getItem(STORAGE_PREFIX + "refreshToken")) {
    localStorage.removeItem(STORAGE_PREFIX + "user");
    return { success: false };
  }

  if (!navigator.onLine) {
    const cachedUser = localStorage.getItem(STORAGE_PREFIX + "user");
    if (cachedUser) {
      return { success: true, user: JSON.parse(cachedUser) as LoginUser };
    }
    return { success: false };
  }

  try {
    const resp = await apiFetch("/api/auth/check", { cacheKey: "user" });
    if (resp.ok) {
      const userS = (await resp.json()) as LoginUser;
      return { success: true, user: userS };
    }
  } catch (error) {
    const cachedUser = localStorage.getItem(STORAGE_PREFIX + "user");
    if (cachedUser) {
      return { success: true, user: JSON.parse(cachedUser) as LoginUser };
    }
  }
  return { success: false };
};

export const apiLogin = async (data: {
  name: string;
  password: string;
}): Promise<boolean> => {
  if (!navigator.onLine) throw new Error("Offline");
  const resp = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: data.name, password: data.password }),
  });

  if (resp.ok) {
    const loginResp = await resp.json();
    localStorage.setItem(
      STORAGE_PREFIX + "refreshToken",
      loginResp.refreshToken,
    );
    return true;
  }
  return false;
};

let refreshPromise: Promise<boolean> | null = null;

export const doRefreshToken = async (): Promise<boolean> => {
  const token = localStorage.getItem(STORAGE_PREFIX + "refreshToken");
  if (!token) return false;

  if (!navigator.onLine) throw new Error("Offline");

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const resp = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: token }),
      });

      if (resp.ok) {
        const loginResp = await resp.json();
        localStorage.setItem(
          STORAGE_PREFIX + "refreshToken",
          loginResp.refreshToken,
        );
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Errore refresh token", e);
      if (!navigator.onLine) throw e;
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const apiLogout = async () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });

  window.dispatchEvent(new Event("auth:logout"));

  if (navigator.onLine) {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Remote logout failed (offline?)", e);
    }
  }
};

export const apiFetch = async (
  input: RequestInfo | URL,
  init?: ApiFetchOptions,
): Promise<Response> => {
  const cacheKey = init?.cacheKey ? STORAGE_PREFIX + init.cacheKey : null;

  if (!navigator.onLine) {
    if (cacheKey) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        return new Response(cachedData, {
          status: 200,
          statusText: "OK [Offline]",
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    throw new Error("Offline");
  }

  try {
    let response = await fetch(input, init);

    if (response.status === 401) {
      const urlStr = input.toString();
      if (
        !urlStr.includes("/api/auth/refresh") &&
        !urlStr.includes("/api/auth/login")
      ) {
        const refreshed = await doRefreshToken();
        if (refreshed) {
          response = await fetch(input, init);
        } else {
          await apiLogout();
          return response;
        }
      }
    }

    if (response.ok && cacheKey) {
      const clonedResponse = response.clone();
      try {
        const body = await clonedResponse.json();
        localStorage.setItem(cacheKey, JSON.stringify(body));
      } catch (e) {}
    }

    return response;
  } catch (error) {
    if (cacheKey) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        return new Response(cachedData, {
          status: 200,
          statusText: "OK [Offline]",
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    throw error;
  }
};
