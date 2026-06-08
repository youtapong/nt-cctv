import { Elysia, t } from "elysia";
import { sql } from "../db";

export const incidentRoutes = new Elysia({ prefix: "/incident" })
  // 1. Get all incidents
  .get(
    "/",
    async () => {
      try {
        const incidents = await sql`
          SELECT i.incident_id, i.camera_id, c.camera_name, i.timestamp, i.event_type, 
                 i.danger_level, i.confidence, i.rationale, i.people_count, i.image_path, i.is_resolved
          FROM "ai_incidents" i
          LEFT JOIN "cameras" c ON i.camera_id = c.camera_id
          ORDER BY i.incident_id DESC
        `;
        return { success: true, data: incidents };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["Incident"],
        summary: "ดึงข้อมูลเหตุการณ์ AI ทั้งหมด (Get all incidents)",
      },
    }
  )

  // 2. Get incident by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const incidents = await sql`
          SELECT i.incident_id, i.camera_id, c.camera_name, i.timestamp, i.event_type, 
                 i.danger_level, i.confidence, i.rationale, i.people_count, i.image_path, i.is_resolved
          FROM "ai_incidents" i
          LEFT JOIN "cameras" c ON i.camera_id = c.camera_id
          WHERE i.incident_id = ${id}
        `;
        if (incidents.length === 0) {
          return { success: false, error: "ไม่พบข้อมูลเหตุการณ์นี้" };
        }
        return { success: true, data: incidents[0] };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Incident"],
        summary: "ดึงข้อมูลเหตุการณ์ด้วย ID (Get incident by ID)",
      },
    }
  )

  // 3. Create a new incident
  .post(
    "/",
    async ({ body }) => {
      try {
        const insertData = { ...body };
        
        const allowedColumns = [
          "camera_id",
          "timestamp",
          "event_type",
          "danger_level",
          "confidence",
          "rationale",
          "people_count",
          "image_path",
          "is_resolved"
        ];
        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedColumns.includes(key)
        );

        const [newIncident] = await sql`
          INSERT INTO "ai_incidents" ${sql(insertData, ...insertKeys)}
          RETURNING incident_id, camera_id, timestamp, event_type, danger_level, confidence, rationale, people_count, image_path, is_resolved
        `;

        return { success: true, data: newIncident };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        camera_id: t.Optional(t.Integer()),
        timestamp: t.Optional(t.String()), // ISO String/Timestamp
        event_type: t.String({ minLength: 1 }),
        danger_level: t.String({ minLength: 1 }),
        confidence: t.Optional(t.Number()),
        rationale: t.Optional(t.String()),
        people_count: t.Optional(t.Integer({ default: 0 })),
        image_path: t.Optional(t.String()),
        is_resolved: t.Optional(t.Boolean({ default: false })),
      }),
      detail: {
        tags: ["Incident"],
        summary: "แจ้งเหตุการณ์วิเคราะห์ด้วย AI ใหม่ (Create incident)",
      },
    }
  )

  // 4. Update incident by ID
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existingIncident] = await sql`
          SELECT incident_id FROM "ai_incidents" WHERE incident_id = ${id}
        `;
        if (!existingIncident) {
          return { success: false, error: "ไม่พบข้อมูลเหตุการณ์ที่ต้องการอัปเดต" };
        }

        const updateData = { ...body };
        
        const allowedColumns = [
          "camera_id",
          "timestamp",
          "event_type",
          "danger_level",
          "confidence",
          "rationale",
          "people_count",
          "image_path",
          "is_resolved"
        ];
        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }

        const [updatedIncident] = await sql`
          UPDATE "ai_incidents"
          SET ${sql(updateData, ...updateKeys)}
          WHERE incident_id = ${id}
          RETURNING incident_id, camera_id, timestamp, event_type, danger_level, confidence, rationale, people_count, image_path, is_resolved
        `;

        return { success: true, data: updatedIncident };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        camera_id: t.Optional(t.Integer()),
        timestamp: t.Optional(t.String()),
        event_type: t.Optional(t.String({ minLength: 1 })),
        danger_level: t.Optional(t.String({ minLength: 1 })),
        confidence: t.Optional(t.Number()),
        rationale: t.Optional(t.String()),
        people_count: t.Optional(t.Integer()),
        image_path: t.Optional(t.String()),
        is_resolved: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Incident"],
        summary: "แก้ไขข้อมูลเหตุการณ์ด้วย ID (Update incident)",
      },
    }
  )

  // 5. Delete incident by ID
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [deletedIncident] = await sql`
          DELETE FROM "ai_incidents"
          WHERE incident_id = ${id}
          RETURNING incident_id, event_type
        `;

        if (!deletedIncident) {
          return { success: false, error: "ไม่พบข้อมูลเหตุการณ์ที่ต้องการลบ" };
        }

        return { success: true, message: `ลบเหตุการณ์ ${deletedIncident.event_type} เรียบร้อยแล้ว` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Incident"],
        summary: "ลบข้อมูลเหตุการณ์ด้วย ID (Delete incident)",
      },
    }
  );
