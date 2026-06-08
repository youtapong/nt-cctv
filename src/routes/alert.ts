import { Elysia, t } from "elysia";
import { sql } from "../db";

export const alertRoutes = new Elysia({ prefix: "/alert" })
  // 1. Get all alert logs
  .get(
    "/",
    async () => {
      try {
        const alerts = await sql`
          SELECT a.alert_id, a.incident_id, i.event_type, i.danger_level, 
                 a.alert_channel, a.sent_at, a.status, a.recipient_info
          FROM "alerts_log" a
          LEFT JOIN "ai_incidents" i ON a.incident_id = i.incident_id
          ORDER BY a.alert_id DESC
        `;
        return { success: true, data: alerts };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      detail: {
        tags: ["Alert"],
        summary: "ดึงข้อมูลบันทึกการส่งการแจ้งเตือนทั้งหมด (Get all alert logs)",
      },
    }
  )

  // 2. Get alert log by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const alerts = await sql`
          SELECT a.alert_id, a.incident_id, i.event_type, i.danger_level, 
                 a.alert_channel, a.sent_at, a.status, a.recipient_info
          FROM "alerts_log" a
          LEFT JOIN "ai_incidents" i ON a.incident_id = i.incident_id
          WHERE a.alert_id = ${id}
        `;
        if (alerts.length === 0) {
          return { success: false, error: "ไม่พบข้อมูลบันทึกการแจ้งเตือนนี้" };
        }
        return { success: true, data: alerts[0] };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Alert"],
        summary: "ดึงข้อมูลบันทึกการแจ้งเตือนด้วย ID (Get alert log by ID)",
      },
    }
  )

  // 3. Create a new alert log
  .post(
    "/",
    async ({ body }) => {
      try {
        const insertData = { ...body };
        
        const allowedColumns = [
          "incident_id",
          "alert_channel",
          "sent_at",
          "status",
          "recipient_info"
        ];
        const insertKeys = Object.keys(insertData).filter(
          (key) => insertData[key] !== undefined && allowedColumns.includes(key)
        );

        const [newAlert] = await sql`
          INSERT INTO "alerts_log" ${sql(insertData, ...insertKeys)}
          RETURNING alert_id, incident_id, alert_channel, sent_at, status, recipient_info
        `;

        return { success: true, data: newAlert };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        incident_id: t.Optional(t.Integer()),
        alert_channel: t.String({ minLength: 1 }),
        sent_at: t.Optional(t.String()),
        status: t.Optional(t.String()),
        recipient_info: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Alert"],
        summary: "บันทึกการแจ้งเตือนใหม่ (Create alert log)",
      },
    }
  )

  // 4. Update alert log by ID
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const [existingAlert] = await sql`
          SELECT alert_id FROM "alerts_log" WHERE alert_id = ${id}
        `;
        if (!existingAlert) {
          return { success: false, error: "ไม่พบข้อมูลบันทึกการแจ้งเตือนที่ต้องการอัปเดต" };
        }

        const updateData = { ...body };
        
        const allowedColumns = [
          "incident_id",
          "alert_channel",
          "sent_at",
          "status",
          "recipient_info"
        ];
        const updateKeys = Object.keys(updateData).filter(
          (key) => updateData[key] !== undefined && allowedColumns.includes(key)
        );

        if (updateKeys.length === 0) {
          return { success: false, error: "ไม่มีข้อมูลสำหรับการแก้ไข" };
        }

        const [updatedAlert] = await sql`
          UPDATE "alerts_log"
          SET ${sql(updateData, ...updateKeys)}
          WHERE alert_id = ${id}
          RETURNING alert_id, incident_id, alert_channel, sent_at, status, recipient_info
        `;

        return { success: true, data: updatedAlert };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        incident_id: t.Optional(t.Integer()),
        alert_channel: t.Optional(t.String({ minLength: 1 })),
        sent_at: t.Optional(t.String()),
        status: t.Optional(t.String()),
        recipient_info: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Alert"],
        summary: "แก้ไขข้อมูลบันทึกการแจ้งเตือนด้วย ID (Update alert log)",
      },
    }
  )

  // 5. Delete alert log by ID
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      try {
        const [deletedAlert] = await sql`
          DELETE FROM "alerts_log"
          WHERE alert_id = ${id}
          RETURNING alert_id, alert_channel
        `;

        if (!deletedAlert) {
          return { success: false, error: "ไม่พบข้อมูลบันทึกการแจ้งเตือนที่ต้องการลบ" };
        }

        return { success: true, message: `ลบบันทึกการแจ้งเตือนผ่านช่องทาง ${deletedAlert.alert_channel} เรียบร้อยแล้ว` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        tags: ["Alert"],
        summary: "ลบข้อมูลบันทึกการแจ้งเตือนด้วย ID (Delete alert log)",
      },
    }
  );
