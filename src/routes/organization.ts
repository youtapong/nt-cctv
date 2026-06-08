import { Elysia, t } from "elysia";
import { sql } from "../db";

export const organizationRoutes = new Elysia({ prefix: "/organization" })
  // 1. Get all organizations
  .get(
    "/",
    async () => {
      try {
        const orgs = await sql`
          SELECT org_id, org_name, org_type, contact_info, org_token, updated, created_at
          FROM "organizations"
          ORDER BY org_id DESC
        `;
        return { success: true, data: orgs };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["Organization"],
        summary: "ดึงข้อมูลองค์กรทั้งหมด (Get all organizations)",
      },
    }
  )

  // 2. Get organization by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const orgs = await sql`
          SELECT org_id, org_name, org_type, contact_info, org_token, updated, created_at
          FROM "organizations"
          WHERE org_id = ${id}
        `;
        if (orgs.length === 0) {
          return { success: false, error: "ไม่พบข้อมูลองค์กรนี้" };
        }
        return { success: true, data: orgs[0] };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Organization"],
        summary: "ดึงข้อมูลองค์กรรายบุคคลด้วย ID (Get organization by ID)",
      },
    }
  )

  // 3. Create a new organization
  .post(
    "/",
    async ({ body }) => {
      try {
        const org_name = body.org_name;
        const org_type = body.org_type || "";
        const now = new Date();

        // 1. Insert temporary record first to generate org_id & created_at
        const insertData: Record<string, any> = {
          ...body,
          org_token: "", // temporary placeholder
          updated: now,
          created_at: now,
        };

        const allowedColumns = ["org_name", "org_type", "contact_info", "org_token", "updated", "created_at"];
        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedColumns.includes(key)
        );

        const [tempOrg] = await sql`
          INSERT INTO "organizations" ${sql(insertData, ...insertKeys)}
          RETURNING org_id, org_name, org_type, contact_info, created_at
        `;

        // 2. Generate org_token containing org_id
        const org_id = tempOrg.org_id;
        const createdAtStr = tempOrg.created_at instanceof Date 
          ? tempOrg.created_at.toISOString() 
          : new Date(tempOrg.created_at).toISOString();
        
        const tokenData = `${org_id},${org_name},${org_type},${createdAtStr}`;
        const org_token = Buffer.from(tokenData).toString("base64");

        // 3. Update the record with computed org_token
        const [newOrg] = await sql`
          UPDATE "organizations"
          SET org_token = ${org_token}, updated = ${now}
          WHERE org_id = ${org_id}
          RETURNING org_id, org_name, org_type, contact_info, org_token, updated, created_at
        `;

        return { success: true, data: newOrg };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        org_name: t.String({ minLength: 1 }),
        org_type: t.Optional(t.String()),
        contact_info: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Organization"],
        summary: "สร้างหน่วยงาน/องค์กรใหม่ (Create organization)",
      },
    }
  )

  // 4. Update organization by ID
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        // Fetch existing organization to get name, type, and created_at for token calculation
        const [existingOrg] = await sql`
          SELECT org_id, org_name, org_type, created_at FROM "organizations" WHERE org_id = ${id}
        `;
        if (!existingOrg) {
          return { success: false, error: "ไม่พบข้อมูลหน่วยงาน/องค์กรที่ต้องการอัปเดต" };
        }

        const org_name = body.org_name !== undefined ? body.org_name : existingOrg.org_name;
        const org_type = body.org_type !== undefined ? body.org_type : (existingOrg.org_type || "");
        
        const createdAtStr = existingOrg.created_at instanceof Date 
          ? existingOrg.created_at.toISOString() 
          : new Date(existingOrg.created_at).toISOString();

        // Include id (org_id) in token calculation
        const tokenData = `${id},${org_name},${org_type},${createdAtStr}`;
        const org_token = Buffer.from(tokenData).toString("base64");

        const now = new Date();
        const updateData: Record<string, any> = {
          ...body,
          org_token,
          updated: now,
        };

        const allowedColumns = ["org_name", "org_type", "contact_info", "org_token", "updated"];
        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }

        const [updatedOrg] = await sql`
          UPDATE "organizations"
          SET ${sql(updateData, ...updateKeys)}
          WHERE org_id = ${id}
          RETURNING org_id, org_name, org_type, contact_info, org_token, updated, created_at
        `;

        return { success: true, data: updatedOrg };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        org_name: t.Optional(t.String({ minLength: 1 })),
        org_type: t.Optional(t.String()),
        contact_info: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Organization"],
        summary: "แก้ไขข้อมูลหน่วยงาน/องค์กรด้วย ID (Update organization)",
      },
    }
  )

  // 5. Delete organization by ID
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [deletedOrg] = await sql`
          DELETE FROM "organizations"
          WHERE org_id = ${id}
          RETURNING org_id, org_name
        `;

        if (!deletedOrg) {
          return { success: false, error: "ไม่พบข้อมูลหน่วยงาน/องค์กรที่ต้องการลบ" };
        }

        return { success: true, message: `ลบหน่วยงาน/องค์กร ${deletedOrg.org_name} เรียบร้อยแล้ว` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Organization"],
        summary: "ลบหน่วยงาน/องค์กรด้วย ID (Delete organization)",
      },
    }
  );
