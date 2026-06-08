import { Elysia, t } from "elysia";
import { sql } from "../db";

export const ssoRoutes = new Elysia({ prefix: "/sso" })
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const { username, password } = body;

        const [user] = await sql`
          SELECT id, username, role, status, authorize_token
          FROM "user"
          WHERE username = ${username} AND password = ${password}
        `;

        if (!user) {
          set.status = 401;
          return { success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
        }

        if (user.status !== "Active") {
          set.status = 403;
          return { success: false, error: "บัญชีผู้ใช้งานนี้ไม่พร้อมใช้งาน (Inactive)" };
        }

        return {
          success: true,
          access_token: user.authorize_token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            status: user.status,
          },
        };
      } catch (error: any) {
        set.status = 500;
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
      detail: {
        tags: ["Authentication"],
        summary: "เข้าสู่ระบบรับ Access Token (SSO Login)",
      },
    }
  );
