import { Elysia } from "elysia";
import { sql } from "../db";

export const authPlugin = new Elysia({ name: "auth" })
  .derive({ as: "global" }, async ({ request }) => {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return { user: null };
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    try {
      const [user] = await sql`
        SELECT id, username, role, status
        FROM "user"
        WHERE authorize_token = ${token} AND status = 'Active'
      `;
      
      if (!user) {
        return { user: null };
      }

      return {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    } catch {
      return { user: null };
    }
  })
  .onBeforeHandle({ as: "global" }, ({ request, user, set }) => {
    if (user) {
      return;
    }

    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "");

    const isPublicUserRoute =
      (request.method === "POST" && pathname === "/user") ||
      (request.method === "GET" && (pathname === "/user" || pathname.startsWith("/user/"))) ||
      (request.method === "POST" && pathname === "/organization") ||
      (request.method === "GET" && (pathname === "/organization" || pathname.startsWith("/organization/")));

    if (isPublicUserRoute) {
      return;
    }

    set.status = 401;
    return { success: false, error: "Unauthorized: Invalid or missing token" };
  });
