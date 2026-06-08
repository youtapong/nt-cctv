import { Elysia, t } from "elysia";
import { sql } from "../db";

export const cameraRoutes = new Elysia({ prefix: "/camera" })
  // 1. Get all cameras
  .get(
    "/",
    async () => {
      try {
        const cameras = await sql`
          SELECT c.camera_id, c.org_id, o.org_name, c.package_id, p.package_name,
                 c.camera_name, c.rtsp_url, c.location_lat, c.location_lon, c.is_active, c.created_at
          FROM "cameras" c
          LEFT JOIN "organizations" o ON c.org_id = o.org_id
          LEFT JOIN "cctv_packages" p ON c.package_id = p.package_id
          ORDER BY c.camera_id DESC
        `;
        return { success: true, data: cameras };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["Camera"],
        summary: "ดึงข้อมูลกล้อง CCTV ทั้งหมด (Get all cameras)",
      },
    }
  )

  // 2. Get camera by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const cameras = await sql`
          SELECT c.camera_id, c.org_id, o.org_name, c.package_id, p.package_name,
                 c.camera_name, c.rtsp_url, c.location_lat, c.location_lon, c.is_active, c.created_at
          FROM "cameras" c
          LEFT JOIN "organizations" o ON c.org_id = o.org_id
          LEFT JOIN "cctv_packages" p ON c.package_id = p.package_id
          WHERE c.camera_id = ${id}
        `;
        if (cameras.length === 0) {
          return { success: false, error: "ไม่พบข้อมูลกล้องวงจรปิดนี้" };
        }
        return { success: true, data: cameras[0] };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Camera"],
        summary: "ดึงข้อมูลกล้องวงจรปิดรายตัวด้วย ID (Get camera by ID)",
      },
    }
  )

  // 3. Create a new camera
  .post(
    "/",
    async ({ body }) => {
      try {
        const insertData = { ...body };
        
        const allowedColumns = [
          "org_id",
          "package_id",
          "camera_name",
          "rtsp_url",
          "location_lat",
          "location_lon",
          "is_active"
        ];
        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedColumns.includes(key)
        );

        const [newCamera] = await sql`
          INSERT INTO "cameras" ${sql(insertData, ...insertKeys)}
          RETURNING camera_id, org_id, package_id, camera_name, rtsp_url, location_lat, location_lon, is_active, created_at
        `;

        return { success: true, data: newCamera };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        org_id: t.Optional(t.Integer()),
        package_id: t.Optional(t.Integer()),
        camera_name: t.String({ minLength: 1 }),
        rtsp_url: t.String({ minLength: 1 }),
        location_lat: t.Optional(t.Number()),
        location_lon: t.Optional(t.Number()),
        is_active: t.Optional(t.Boolean({ default: true })),
      }),
      detail: {
        tags: ["Camera"],
        summary: "เพิ่มข้อมูลกล้องวงจรปิดใหม่ (Create camera)",
      },
    }
  )

  // 4. Update camera by ID
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existingCamera] = await sql`
          SELECT camera_id FROM "cameras" WHERE camera_id = ${id}
        `;
        if (!existingCamera) {
          return { success: false, error: "ไม่พบข้อมูลกล้องวงจรปิดที่ต้องการอัปเดต" };
        }

        const updateData = { ...body };
        
        const allowedColumns = [
          "org_id",
          "package_id",
          "camera_name",
          "rtsp_url",
          "location_lat",
          "location_lon",
          "is_active"
        ];
        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }

        const [updatedCamera] = await sql`
          UPDATE "cameras"
          SET ${sql(updateData, ...updateKeys)}
          WHERE camera_id = ${id}
          RETURNING camera_id, org_id, package_id, camera_name, rtsp_url, location_lat, location_lon, is_active, created_at
        `;

        return { success: true, data: updatedCamera };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        org_id: t.Optional(t.Integer()),
        package_id: t.Optional(t.Integer()),
        camera_name: t.Optional(t.String({ minLength: 1 })),
        rtsp_url: t.Optional(t.String({ minLength: 1 })),
        location_lat: t.Optional(t.Number()),
        location_lon: t.Optional(t.Number()),
        is_active: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Camera"],
        summary: "แก้ไขข้อมูลกล้องวงจรปิดด้วย ID (Update camera)",
      },
    }
  )

  // 5. Delete camera by ID
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [deletedCamera] = await sql`
          DELETE FROM "cameras"
          WHERE camera_id = ${id}
          RETURNING camera_id, camera_name
        `;

        if (!deletedCamera) {
          return { success: false, error: "ไม่พบข้อมูลกล้องวงจรปิดที่ต้องการลบ" };
        }

        return { success: true, message: `ลบกล้องวงจรปิด ${deletedCamera.camera_name} เรียบร้อยแล้ว` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Camera"],
        summary: "ลบกล้องวงจรปิดด้วย ID (Delete camera)",
      },
    }
  );
