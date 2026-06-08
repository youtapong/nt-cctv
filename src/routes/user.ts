import { Elysia, t } from "elysia";
import { sql } from "../db";

export const userRoutes = new Elysia({ prefix: "/user" })
  // 1. Get all users
  .get(
    "/",
    async () => {
      try {
        // Exclude password field for security
        const users = await sql`
          SELECT 
            id, image, username, firstname, lastname, email, 
            id_card, phone, address, role, authorize_token, 
            remark, status, created, updated 
          FROM "user" 
          ORDER BY id DESC
        `;
        return { success: true, data: users };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["User"],
        summary: "ดึงข้อมูลผู้ใช้ทั้งหมด (Get all users)",
      },
    }
  )

  // 2. Get user by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const users = await sql`
          SELECT 
            id, image, username, firstname, lastname, email, 
            id_card, phone, address, role, authorize_token, 
            remark, status, created, updated 
          FROM "user" 
          WHERE id = ${id}
        `;
        if (users.length === 0) {
          return { success: false, error: "ไม่พบผู้ใช้งานนี้" };
        }
        return { success: true, data: users[0] };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["User"],
        summary: "ดึงข้อมูลผู้ใช้รายบุคคลด้วย ID (Get user by ID)",
      },
    }
  )

  // 3. Create a new user
  .post(
    "/",
    async ({ body }) => {
      try {
        const username = body.username;
        const role = body.role || "client";
        const updatedDate = new Date();
        const updatedStr = updatedDate.toISOString();
        const tokenData = `${username},${role},${updatedStr}`;
        const authorize_token = Buffer.from(tokenData).toString("base64");

        const insertData: Record<string, any> = {
          ...body,
          role,
          authorize_token,
          updated: updatedDate,
          created: updatedDate,
        };

        const allowedPostColumns = [
          "image",
          "username",
          "password",
          "firstname",
          "lastname",
          "email",
          "id_card",
          "phone",
          "address",
          "role",
          "authorize_token",
          "remark",
          "status",
          "created",
          "updated",
        ];

        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedPostColumns.includes(key)
        );

        const [newUser] = await sql`
          INSERT INTO "user" ${sql(insertData, ...insertKeys)}
          RETURNING id, username, firstname, lastname, email, role, status, authorize_token, created, updated
        `;
        return { success: true, data: newUser };
      } catch (error: any) {
        if (error.code === "23505") {
          return { success: false, error: "Username นี้ถูกใช้งานไปแล้ว" };
        }
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        image: t.Optional(t.String()),
        username: t.String({ minLength: 3 }),
        password: t.String({ minLength: 6 }),
        firstname: t.String({ minLength: 1 }),
        lastname: t.String({ minLength: 1 }),
        email: t.String({ format: "email" }),
        id_card: t.String({ minLength: 5 }),
        phone: t.String({ minLength: 9 }),
        address: t.Optional(t.String()),
        role: t.Optional(t.String({ default: "client" })),
        remark: t.Optional(t.String()),
        status: t.Optional(t.String({ default: "Active" })),
      }),
      detail: {
        tags: ["User"],
        summary: "สร้างผู้ใช้งานใหม่ (Create user)",
      },
    }
  )

  // 4. Update user by ID
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        // Fetch existing user to get username and role for token calculation
        const [existingUser] = await sql`
          SELECT username, role FROM "user" WHERE id = ${id}
        `;
        if (!existingUser) {
          return { success: false, error: "ไม่พบข้อมูลผู้ใช้งานที่ต้องการอัปเดต" };
        }

        const username = existingUser.username;
        const role = body.role || existingUser.role;
        const updatedDate = new Date();
        const updatedStr = updatedDate.toISOString();
        const tokenData = `${username},${role},${updatedStr}`;
        const authorize_token = Buffer.from(tokenData).toString("base64");

        const updateData: Record<string, any> = {
          ...body,
          authorize_token,
          updated: updatedDate,
        };

        const allowedColumns = [
          "image",
          "password",
          "firstname",
          "lastname",
          "email",
          "id_card",
          "phone",
          "address",
          "role",
          "authorize_token",
          "remark",
          "status",
          "updated",
        ];

        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }
        
        const [updatedUser] = await sql`
          UPDATE "user" 
          SET ${sql(updateData, ...updateKeys)}
          WHERE id = ${id}
          RETURNING id, username, firstname, lastname, email, role, status, authorize_token, updated
        `;

        return { success: true, data: updatedUser };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        image: t.Optional(t.String()),
        password: t.Optional(t.String({ minLength: 6 })),
        firstname: t.Optional(t.String()),
        lastname: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
        id_card: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        address: t.Optional(t.String()),
        role: t.Optional(t.String()),
        remark: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
      detail: {
        tags: ["User"],
        summary: "แก้ไขข้อมูลผู้ใช้ด้วย ID (Update user by ID)",
      },
    }
  )

  // 5. Delete user by ID
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [deletedUser] = await sql`
          DELETE FROM "user" 
          WHERE id = ${id}
          RETURNING id, username
        `;

        if (!deletedUser) {
          return { success: false, error: "ไม่พบข้อมูลผู้ใช้งานที่ต้องการลบ" };
        }

        return { success: true, message: `ลบผู้ใช้งาน ${deletedUser.username} เรียบร้อยแล้ว` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["User"],
        summary: "ลบผู้ใช้ด้วย ID (Delete user by ID)",
      },
    }
  );
