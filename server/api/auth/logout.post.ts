import { defineEventHandler, deleteCookie } from "nitro/h3";
import { verifyJWT } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  try {
    // verify login before logout
    await verifyJWT(event);
  } catch (e) {
    // maybe already expired, that's fine
  }

  deleteCookie(event, "token", {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  return { ok: true };
});
