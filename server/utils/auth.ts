import { SignJWT, jwtVerify } from "jose";
import { H3Event, HTTPError, getCookie } from "nitro/h3";
import { useRuntimeConfig } from "nitro/runtime-config";

export interface User {
  name: string;
  roles: string[];
  refresh?: boolean;
}

const getSecret = () =>
  new TextEncoder().encode(useRuntimeConfig().jwtSecret as string);

export async function createJWT(user: User, expiresIn: string = "10m", isRefresh: boolean = false): Promise<string> {
  return await new SignJWT({ ...user, refresh: isRefresh })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyJWT(event: H3Event): Promise<User> {
  const authHeader = event.node.req.headers["authorization"];
  let token = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // try the new generic token cookie, keep fallback for auth_token just in case
    token = getCookie(event, "token") || getCookie(event, "auth_token") || "";
  }

  if (!token) {
    throw new HTTPError("Unauthorized: No token provided", { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      name: payload.name as string,
      roles: payload.roles as string[],
      refresh: payload.refresh as boolean
    };
  } catch (error) {
    throw new HTTPError("Unauthorized: Invalid token", { status: 401 });
  }
}
