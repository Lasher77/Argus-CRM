const db = require('../../db/database');

const baseSelect = `
  SELECT
    so.*,
    a.name AS account_name,
    a.address AS account_address,
    a.email AS account_email,
    ia.name AS invoice_account_name,
    p.name AS property_name,
    p.address AS property_address,
    p.city AS property_city,
    p.postal_code AS property_postal_code,
    p.latitude AS property_latitude,
    p.longitude AS property_longitude,
    sr.first_name || ' ' || sr.last_name AS service_recipient_name,
    sr.phone AS service_recipient_phone,
    sr.email AS service_recipient_email
  FROM service_orders so
  JOIN accounts a ON so.account_id = a.account_id
  LEFT JOIN properties p ON so.property_id = p.property_id
  LEFT JOIN contacts sr ON so.service_recipient_contact_id = sr.contact_id
  LEFT JOIN accounts ia ON so.invoice_account_id = ia.account_id
`;

const assignmentSelect = db.prepare(`
  SELECT
    oa.*,
    e.first_name,
    e.last_name,
    e.role,
    e.is_field_worker,
    e.color
  FROM order_assignments oa
  JOIN employees e ON oa.employee_id = e.employee_id
  WHERE oa.order_id = ?
  ORDER BY
    oa.scheduled_date,
    oa.scheduled_start
`);

const timeEntrySelect = db.prepare(`
  SELECT
    te.*,
    e.first_name,
    e.last_name,
    e.color
  FROM time_entries te
  JOIN employees e ON te.employee_id = e.employee_id
  WHERE te.order_id = ?
  ORDER BY te.start_time
`);

const materialUsageSelect = db.prepare(`
  SELECT
    mu.*,
    e.first_name,
    e.last_name
  FROM material_usage mu
  LEFT JOIN employees e ON mu.employee_id = e.employee_id
  WHERE mu.order_id = ?
  ORDER BY mu.created_at DESC
`);

const photoSelect = db.prepare(`
  SELECT
    op.*,
    e.first_name,
    e.last_name
  FROM order_photos op
  LEFT JOIN employees e ON op.employee_id = e.employee_id
  WHERE op.order_id = ?
  ORDER BY op.created_at DESC
`);

const signatureSelect = db.prepare(`
  SELECT *
  FROM order_signatures
  WHERE order_id = ?
`);

const calculateDuration = (start, end) => {
  if (!start || !end) {
    return null;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    return null;
  }

  return Math.max(0, Math.round((endDate - startDate) / 60000));
};

const hydrateOrder = (row) => {
  if (!row) {
    return null;
  }

  const assignments = assignmentSelect.all(row.order_id).map((assignment) => ({
    ...assignment,
    employee_name: `${assignment.first_name} ${assignment.last_name}`.trim()
  }));

  const timeEntries = timeEntrySelect.all(row.order_id).map((entry) => ({
    ...entry,
    employee_name: `${entry.first_name} ${entry.last_name}`.trim(),
    duration_minutes: entry.duration_minutes ?? calculateDuration(entry.start_time, entry.end_time)
  }));

  const materials = materialUsageSelect.all(row.order_id).map((usage) => ({
    ...usage,
    employee_name: usage.first_name ? `${usage.first_name} ${usage.last_name}`.trim() : null
  }));

  const photos = photoSelect.all(row.order_id).map((photo) => ({
    ...photo,
    employee_name: photo.first_name ? `${photo.first_name} ${photo.last_name}`.trim() : null
  }));

  const signature = signatureSelect.get(row.order_id) ?? null;

  const totalTrackedMinutes = timeEntries.reduce((sum, entry) => {
    if (typeof entry.duration_minutes === 'number') {
      return sum + entry.duration_minutes;
    }
    return sum;
  }, 0);

  return {
    ...row,
    assignments,
    time_entries: timeEntries,
    material_usage: materials,
    photos,
    signature,
    total_tracked_minutes: totalTrackedMinutes
  };
};

const ServiceOrder = {
  getAll: (filters = {}) => {
    const conditions = [];
    const params = [];
    let query = `${baseSelect}`;

    if (filters.from) {
      conditions.push('date(so.planned_date) >= date(?)');
      params.push(filters.from);
    }

    if (filters.to) {
      conditions.push('date(so.planned_date) <= date(?)');
      params.push(filters.to);
    }

    if (filters.status && Array.isArray(filters.status) && filters.status.length) {
      const placeholders = filters.status.map(() => '?').join(', ');
      conditions.push(`so.status IN (${placeholders})`);
      params.push(...filters.status);
    } else if (typeof filters.status === 'string') {
      conditions.push('so.status = ?');
      params.push(filters.status);
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY so.planned_date, so.planned_start, so.order_id';

    const stmt = db.prepare(query);
    let orders = stmt.all(...params).map(hydrateOrder);

    if (filters.employeeId) {
      const employeeId = Number(filters.employeeId);
      orders = orders.filter((order) =>
        order.assignments.some((assignment) => assignment.employee_id === employeeId)
      );
    }

    if (filters.onlyActive) {
      orders = orders.filter(
        (order) => order.status !== 'completed' && order.status !== 'cancelled'
      );
    }

    return orders;
  },

  getById: (id) => {
    const stmt = db.prepare(`${baseSelect} WHERE so.order_id = ?`);
    const row = stmt.get(id);
    return hydrateOrder(row);
  },

  create: (data) => {
    const createTx = db.transaction((payload) => {
      const orderStmt = db.prepare(`
        INSERT INTO service_orders (
          title,
          description,
          account_id,
          property_id,
          service_recipient_contact_id,
          invoice_account_id,
          status,
          priority,
          planned_date,
          planned_start,
          planned_end,
          estimated_hours,
          google_event_id,
          outlook_event_id,
          notes,
          created_by
        )
        VALUES (
          @title,
          @description,
          @account_id,
          @property_id,
          @service_recipient_contact_id,
          @invoice_account_id,
          @status,
          @priority,
          @planned_date,
          @planned_start,
          @planned_end,
          @estimated_hours,
          @google_event_id,
          @outlook_event_id,
          @notes,
          @created_by
        )
      `);

      const orderData = {
        title: payload.title,
        description: payload.description ?? null,
        account_id: payload.account_id,
        property_id: payload.property_id ?? null,
        service_recipient_contact_id: payload.service_recipient_contact_id ?? null,
        invoice_account_id: payload.invoice_account_id ?? payload.account_id,
        status: payload.status ?? 'planned',
        priority: payload.priority ?? 'normal',
        planned_date: payload.planned_date ?? null,
        planned_start: payload.planned_start ?? null,
        planned_end: payload.planned_end ?? null,
        estimated_hours: payload.estimated_hours ?? null,
        google_event_id: payload.google_event_id ?? null,
        outlook_event_id: payload.outlook_event_id ?? null,
        notes: payload.notes ?? null,
        created_by: payload.created_by ?? null
      };

      const result = orderStmt.run(orderData);
      const orderId = result.lastInsertRowid;

      if (Array.isArray(payload.assignments)) {
        const assignmentStmt = db.prepare(`
          INSERT INTO order_assignments (
            order_id,
            employee_id,
            scheduled_date,
            scheduled_start,
            scheduled_end,
            is_primary
          )
          VALUES (
            @order_id,
            @employee_id,
            @scheduled_date,
            @scheduled_start,
            @scheduled_end,
            @is_primary
          )
        `);

        payload.assignments.forEach((assignment, index) => {
          assignmentStmt.run({
            order_id: orderId,
            employee_id: assignment.employee_id,
            scheduled_date: assignment.scheduled_date ?? payload.planned_date ?? null,
            scheduled_start: assignment.scheduled_start ?? payload.planned_start ?? null,
            scheduled_end: assignment.scheduled_end ?? payload.planned_end ?? null,
            is_primary: assignment.is_primary ? 1 : index === 0 ? 1 : 0
          });
        });
      }

      if (Array.isArray(payload.material_usage)) {
        const materialStmt = db.prepare(`
          INSERT INTO material_usage (
            order_id,
            employee_id,
            material_id,
            material_name,
            quantity,
            unit,
            unit_price
          )
          VALUES (
            @order_id,
            @employee_id,
            @material_id,
            @material_name,
            @quantity,
            @unit,
            @unit_price
          )
        `);

        payload.material_usage.forEach((usage) => {
          materialStmt.run({
            order_id: orderId,
            employee_id: usage.employee_id ?? null,
            material_id: usage.material_id ?? null,
            material_name: usage.material_name,
            quantity: usage.quantity,
            unit: usage.unit,
            unit_price: usage.unit_price ?? null
          });
        });
      }

      if (Array.isArray(payload.time_entries)) {
        const timeStmt = db.prepare(`
          INSERT INTO time_entries (
            order_id,
            employee_id,
            start_time,
            end_time,
            duration_minutes,
            source,
            start_lat,
            start_lng,
            end_lat,
            end_lng,
            distance_km,
            notes
          )
          VALUES (
            @order_id,
            @employee_id,
            @start_time,
            @end_time,
            @duration_minutes,
            @source,
            @start_lat,
            @start_lng,
            @end_lat,
            @end_lng,
            @distance_km,
            @notes
          )
        `);

        payload.time_entries.forEach((entry) => {
          const duration =
            entry.duration_minutes ?? calculateDuration(entry.start_time, entry.end_time);
          timeStmt.run({
            order_id: orderId,
            employee_id: entry.employee_id,
            start_time: entry.start_time,
            end_time: entry.end_time ?? null,
            duration_minutes: duration,
            source: entry.source ?? 'manual',
            start_lat: entry.start_lat ?? null,
            start_lng: entry.start_lng ?? null,
            end_lat: entry.end_lat ?? null,
            end_lng: entry.end_lng ?? null,
            distance_km: entry.distance_km ?? null,
            notes: entry.notes ?? null
          });
        });
      }

      if (payload.signature && payload.signature.signature_data) {
        const signatureStmt = db.prepare(`
          INSERT INTO order_signatures (
            order_id,
            signed_by,
            signed_at,
            signature_data
          )
          VALUES (
            @order_id,
            @signed_by,
            @signed_at,
            @signature_data
          )
        `);

        signatureStmt.run({
          order_id: orderId,
          signed_by: payload.signature.signed_by ?? null,
          signed_at: payload.signature.signed_at ?? new Date().toISOString(),
          signature_data: payload.signature.signature_data
        });
      }

      return orderId;
    });

    const orderId = createTx(data);
    return ServiceOrder.getById(orderId);
  },

  update: (id, data) => {
    const updateTx = db.transaction((payload) => {
      const stmt = db.prepare(`
        UPDATE service_orders
        SET title = @title,
            description = @description,
            account_id = @account_id,
            property_id = @property_id,
            service_recipient_contact_id = @service_recipient_contact_id,
            invoice_account_id = @invoice_account_id,
            status = @status,
            priority = @priority,
            planned_date = @planned_date,
            planned_start = @planned_start,
            planned_end = @planned_end,
            actual_start = @actual_start,
            actual_end = @actual_end,
            estimated_hours = @estimated_hours,
            google_event_id = @google_event_id,
            outlook_event_id = @outlook_event_id,
            notes = @notes,
            updated_at = datetime('now')
        WHERE order_id = @order_id
      `);

      const orderData = {
        order_id: id,
        title: payload.title,
        description: payload.description ?? null,
        account_id: payload.account_id,
        property_id: payload.property_id ?? null,
        service_recipient_contact_id: payload.service_recipient_contact_id ?? null,
        invoice_account_id: payload.invoice_account_id ?? payload.account_id,
        status: payload.status ?? 'planned',
        priority: payload.priority ?? 'normal',
        planned_date: payload.planned_date ?? null,
        planned_start: payload.planned_start ?? null,
        planned_end: payload.planned_end ?? null,
        actual_start: payload.actual_start ?? null,
        actual_end: payload.actual_end ?? null,
        estimated_hours: payload.estimated_hours ?? null,
        google_event_id: payload.google_event_id ?? null,
        outlook_event_id: payload.outlook_event_id ?? null,
        notes: payload.notes ?? null
      };

      stmt.run(orderData);

      if (Array.isArray(payload.assignments)) {
        db.prepare('DELETE FROM order_assignments WHERE order_id = ?').run(id);

        const assignmentStmt = db.prepare(`
          INSERT INTO order_assignments (
            order_id,
            employee_id,
            scheduled_date,
            scheduled_start,
            scheduled_end,
            is_primary
          )
          VALUES (
            @order_id,
            @employee_id,
            @scheduled_date,
            @scheduled_start,
            @scheduled_end,
            @is_primary
          )
        `);

        payload.assignments.forEach((assignment, index) => {
          assignmentStmt.run({
            order_id: id,
            employee_id: assignment.employee_id,
            scheduled_date: assignment.scheduled_date ?? payload.planned_date ?? null,
            scheduled_start: assignment.scheduled_start ?? payload.planned_start ?? null,
            scheduled_end: assignment.scheduled_end ?? payload.planned_end ?? null,
            is_primary: assignment.is_primary ? 1 : index === 0 ? 1 : 0
          });
        });
      }

      if (payload.signature === null) {
        db.prepare('DELETE FROM order_signatures WHERE order_id = ?').run(id);
      } else if (payload.signature && payload.signature.signature_data) {
        db.prepare(
          `
          INSERT INTO order_signatures (order_id, signed_by, signed_at, signature_data)
          VALUES (@order_id, @signed_by, @signed_at, @signature_data)
          ON CONFLICT(order_id) DO UPDATE SET
            signed_by = excluded.signed_by,
            signed_at = excluded.signed_at,
            signature_data = excluded.signature_data
        `
        ).run({
          order_id: id,
          signed_by: payload.signature.signed_by ?? null,
          signed_at: payload.signature.signed_at ?? new Date().toISOString(),
          signature_data: payload.signature.signature_data
        });
      }
    });

    updateTx(data);
    return ServiceOrder.getById(id);
  },

  updateStatus: (id, status) => {
    const stmt = db.prepare(`
      UPDATE service_orders
      SET status = ?,
          updated_at = datetime('now')
      WHERE order_id = ?
    `);

    const result = stmt.run(status, id);
    if (!result.changes) {
      return null;
    }

    return ServiceOrder.getById(id);
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM service_orders WHERE order_id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  addTimeEntry: (orderId, entry) => {
    const stmt = db.prepare(`
      INSERT INTO time_entries (
        order_id,
        employee_id,
        start_time,
        end_time,
        duration_minutes,
        source,
        start_lat,
        start_lng,
        end_lat,
        end_lng,
        distance_km,
        notes
      )
      VALUES (
        @order_id,
        @employee_id,
        @start_time,
        @end_time,
        @duration_minutes,
        @source,
        @start_lat,
        @start_lng,
        @end_lat,
        @end_lng,
        @distance_km,
        @notes
      )
    `);

    const duration = entry.duration_minutes ?? calculateDuration(entry.start_time, entry.end_time);

    stmt.run({
      order_id: orderId,
      employee_id: entry.employee_id,
      start_time: entry.start_time,
      end_time: entry.end_time ?? null,
      duration_minutes: duration,
      source: entry.source ?? 'manual',
      start_lat: entry.start_lat ?? null,
      start_lng: entry.start_lng ?? null,
      end_lat: entry.end_lat ?? null,
      end_lng: entry.end_lng ?? null,
      distance_km: entry.distance_km ?? null,
      notes: entry.notes ?? null
    });

    return ServiceOrder.getById(orderId);
  },

  updateTimeEntry: (timeEntryId, entry) => {
    const stmt = db.prepare(`
      UPDATE time_entries
      SET start_time = @start_time,
          end_time = @end_time,
          duration_minutes = @duration_minutes,
          source = @source,
          start_lat = @start_lat,
          start_lng = @start_lng,
          end_lat = @end_lat,
          end_lng = @end_lng,
          distance_km = @distance_km,
          notes = @notes,
          updated_at = datetime('now')
      WHERE time_entry_id = @time_entry_id
    `);

    const duration = entry.duration_minutes ?? calculateDuration(entry.start_time, entry.end_time);

    const result = stmt.run({
      time_entry_id: timeEntryId,
      start_time: entry.start_time,
      end_time: entry.end_time ?? null,
      duration_minutes: duration,
      source: entry.source ?? 'manual',
      start_lat: entry.start_lat ?? null,
      start_lng: entry.start_lng ?? null,
      end_lat: entry.end_lat ?? null,
      end_lng: entry.end_lng ?? null,
      distance_km: entry.distance_km ?? null,
      notes: entry.notes ?? null
    });

    if (!result.changes) {
      return null;
    }

    const orderId = db
      .prepare('SELECT order_id FROM time_entries WHERE time_entry_id = ?')
      .get(timeEntryId)?.order_id;
    return orderId ? ServiceOrder.getById(orderId) : null;
  },

  deleteTimeEntry: (timeEntryId) => {
    const orderIdRow = db
      .prepare('SELECT order_id FROM time_entries WHERE time_entry_id = ?')
      .get(timeEntryId);
    if (!orderIdRow) {
      return null;
    }

    const stmt = db.prepare('DELETE FROM time_entries WHERE time_entry_id = ?');
    const result = stmt.run(timeEntryId);
    if (!result.changes) {
      return null;
    }

    return ServiceOrder.getById(orderIdRow.order_id);
  },

  addMaterialUsage: (orderId, usage) => {
    const stmt = db.prepare(`
      INSERT INTO material_usage (
        order_id,
        employee_id,
        material_id,
        material_name,
        quantity,
        unit,
        unit_price
      )
      VALUES (
        @order_id,
        @employee_id,
        @material_id,
        @material_name,
        @quantity,
        @unit,
        @unit_price
      )
    `);

    stmt.run({
      order_id: orderId,
      employee_id: usage.employee_id ?? null,
      material_id: usage.material_id ?? null,
      material_name: usage.material_name,
      quantity: usage.quantity,
      unit: usage.unit,
      unit_price: usage.unit_price ?? null
    });

    return ServiceOrder.getById(orderId);
  },

  updateMaterialUsage: (usageId, usage) => {
    const stmt = db.prepare(`
      UPDATE material_usage
      SET material_id = @material_id,
          material_name = @material_name,
          quantity = @quantity,
          unit = @unit,
          unit_price = @unit_price
      WHERE usage_id = @usage_id
    `);

    const result = stmt.run({
      usage_id: usageId,
      material_id: usage.material_id ?? null,
      material_name: usage.material_name,
      quantity: usage.quantity,
      unit: usage.unit,
      unit_price: usage.unit_price ?? null
    });

    if (!result.changes) {
      return null;
    }

    const orderRow = db
      .prepare('SELECT order_id FROM material_usage WHERE usage_id = ?')
      .get(usageId);
    return orderRow ? ServiceOrder.getById(orderRow.order_id) : null;
  },

  deleteMaterialUsage: (usageId) => {
    const orderRow = db
      .prepare('SELECT order_id FROM material_usage WHERE usage_id = ?')
      .get(usageId);
    if (!orderRow) {
      return null;
    }

    const stmt = db.prepare('DELETE FROM material_usage WHERE usage_id = ?');
    const result = stmt.run(usageId);
    if (!result.changes) {
      return null;
    }

    return ServiceOrder.getById(orderRow.order_id);
  },

  addPhoto: (orderId, photo) => {
    const stmt = db.prepare(`
      INSERT INTO order_photos (
        order_id,
        employee_id,
        photo_data,
        caption
      )
      VALUES (
        @order_id,
        @employee_id,
        @photo_data,
        @caption
      )
    `);

    stmt.run({
      order_id: orderId,
      employee_id: photo.employee_id ?? null,
      photo_data: photo.photo_data,
      caption: photo.caption ?? null
    });

    return ServiceOrder.getById(orderId);
  },

  deletePhoto: (photoId) => {
    const orderRow = db
      .prepare('SELECT order_id FROM order_photos WHERE photo_id = ?')
      .get(photoId);
    if (!orderRow) {
      return null;
    }

    const stmt = db.prepare('DELETE FROM order_photos WHERE photo_id = ?');
    const result = stmt.run(photoId);
    if (!result.changes) {
      return null;
    }

    return ServiceOrder.getById(orderRow.order_id);
  },

  setSignature: (orderId, signature) => {
    const stmt = db.prepare(`
      INSERT INTO order_signatures (
        order_id,
        signed_by,
        signed_at,
        signature_data
      )
      VALUES (
        @order_id,
        @signed_by,
        @signed_at,
        @signature_data
      )
      ON CONFLICT(order_id) DO UPDATE SET
        signed_by = excluded.signed_by,
        signed_at = excluded.signed_at,
        signature_data = excluded.signature_data
    `);

    stmt.run({
      order_id: orderId,
      signed_by: signature.signed_by ?? null,
      signed_at: signature.signed_at ?? new Date().toISOString(),
      signature_data: signature.signature_data
    });

    return ServiceOrder.getById(orderId);
  },

  clearSignature: (orderId) => {
    db.prepare('DELETE FROM order_signatures WHERE order_id = ?').run(orderId);
    return ServiceOrder.getById(orderId);
  },

  getUpcomingForDate: (date) => {
    const stmt = db.prepare(
      `${baseSelect} WHERE date(so.planned_date) = date(?) ORDER BY so.planned_start`
    );
    return stmt.all(date).map(hydrateOrder);
  },

  getOpenOrders: () => {
    const stmt = db.prepare(
      `${baseSelect} WHERE so.status NOT IN ('completed', 'cancelled') ORDER BY so.planned_date`
    );
    return stmt.all().map(hydrateOrder);
  }
};

module.exports = ServiceOrder;
