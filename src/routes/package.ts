import { Elysia, t } from "elysia";
import { sql } from "../db";

export const packageRoutes = new Elysia({ prefix: "/package" })
  // 1. Get all packages
  .get(
    "/",
    async () => {
      try {
        const packages = await sql`
          SELECT package_id, package_name, description, monthly_fee
          FROM "cctv_packages"
          ORDER BY package_id DESC
        `;
        return { success: true, data: packages };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["Package"],
        summary: "ดึงข้อมูลแพ็กเกจ CCTV ทั้งหมด (Get all packages)",
      },
    }
  )

  // 2. Get package by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const packages = await sql`
          SELECT package_id, package_name, description, monthly_fee
          FROM "cctv_packages"
          WHERE package_id = ${id}
        `;
        if (packages.length === 0) {
          return { success: false, error: "ไม่พบแพ็กเกจ CCTV นี้" };
        }
        return { success: true, data: packages[0] };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Package"],
        summary: "ดึงข้อมูลแพ็กเกจรายตัวด้วย ID (Get package by ID)",
      },
    }
  )

  // 3. Create a new package
  .post(
    "/",
    async ({ body }) => {
      try {
        const insertData = { ...body };
        
        const allowedColumns = ["package_name", "description", "monthly_fee"];
        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedColumns.includes(key)
        );

        const [newPackage] = await sql`
          INSERT INTO "cctv_packages" ${sql(insertData, ...insertKeys)}
          RETURNING package_id, package_name, description, monthly_fee
        `;

        return { success: true, data: newPackage };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        package_name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        monthly_fee: t.Number(), // mapped from DECIMAL
      }),
      detail: {
        tags: ["Package"],
        summary: "สร้างแพ็กเกจ CCTV ใหม่ (Create package)",
      },
    }
  )

  // 4. Update package by ID
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existingPackage] = await sql`
          SELECT package_id FROM "cctv_packages" WHERE package_id = ${id}
        `;
        if (!existingPackage) {
          return { success: false, error: "ไม่พบข้อมูลแพ็กเกจ CCTV ที่ต้องการอัปเดต" };
        }

        const updateData = { ...body };
        
        const allowedColumns = ["package_name", "description", "monthly_fee"];
        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }

        const [updatedPackage] = await sql`
          UPDATE "cctv_packages"
          SET ${sql(updateData, ...updateKeys)}
          WHERE package_id = ${id}
          RETURNING package_id, package_name, description, monthly_fee
        `;

        return { success: true, data: updatedPackage };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        package_name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
        monthly_fee: t.Optional(t.Number()),
      }),
      detail: {
        tags: ["Package"],
        summary: "แก้ไขข้อมูลแพ็กเกจ CCTV ด้วย ID (Update package)",
      },
    }
  )

  // 5. Delete package by ID
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [deletedPackage] = await sql`
          DELETE FROM "cctv_packages"
          WHERE package_id = ${id}
          RETURNING package_id, package_name
        `;

        if (!deletedPackage) {
          return { success: false, error: "ไม่พบข้อมูลแพ็กเกจ CCTV ที่ต้องการลบ" };
        }

        return { success: true, message: `ลบแพ็กเกจ ${deletedPackage.package_name} เรียบร้อยแล้ว` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Package"],
        summary: "ลบแพ็กเกจ CCTV ด้วย ID (Delete package)",
      },
    }
  );
