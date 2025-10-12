const db = require('../../db/database');
const ServiceOrder = require('./serviceOrder');
const Material = require('./material');

const toDateString = (date) => {
  if (!date) {
    return null;
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.valueOf())) {
    return null;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Montag als Wochenstart
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfWeek = (date) => {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return d;
};

const Report = {
  getDashboardSnapshot: (referenceDate = new Date()) => {
    const today = toDateString(referenceDate) ?? toDateString(new Date());
    const weekStart = startOfWeek(referenceDate);
    const weekEnd = endOfWeek(referenceDate);
    const weekStartStr = toDateString(weekStart);
    const weekEndStr = toDateString(weekEnd);

    const ordersToday = ServiceOrder.getUpcomingForDate(today);
    const weeklyOrders = ServiceOrder.getAll({ from: weekStartStr, to: weekEndStr });
    const openOrders = ServiceOrder.getOpenOrders();
    const lowStockMaterials = Material.getLowStock();

    const workloadPerDay = weeklyOrders.reduce((acc, order) => {
      const plannedDate = order.planned_date ? toDateString(order.planned_date) : null;
      if (!plannedDate) {
        return acc;
      }

      if (!acc[plannedDate]) {
        acc[plannedDate] = {
          planned_minutes: 0,
          tracked_minutes: 0,
          orders: 0
        };
      }

      acc[plannedDate].orders += 1;
      if (order.estimated_hours) {
        acc[plannedDate].planned_minutes += Number(order.estimated_hours) * 60;
      }
      acc[plannedDate].tracked_minutes += order.total_tracked_minutes ?? 0;
      return acc;
    }, {});

    const quoteStatsStmt = db.prepare(`
      SELECT status, COUNT(*) AS count
      FROM quotes
      GROUP BY status
    `);

    const invoiceStatsStmt = db.prepare(`
      SELECT
        strftime('%Y-%m', invoice_date) AS period,
        SUM(total_gross) AS total_gross,
        SUM(total_net) AS total_net,
        SUM(amount_paid) AS total_paid
      FROM invoices
      WHERE invoice_date >= date('now', '-6 months')
      GROUP BY period
      ORDER BY period
    `);

    const timeByEmployeeStmt = db.prepare(`
      SELECT
        e.employee_id,
        e.first_name || ' ' || e.last_name AS employee_name,
        SUM(te.duration_minutes) AS minutes
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.employee_id
      WHERE date(te.start_time) = date(?)
      GROUP BY e.employee_id
      ORDER BY minutes DESC
    `);

    const quoteStats = quoteStatsStmt.all();
    const invoiceStats = invoiceStatsStmt.all();
    const timeByEmployee = timeByEmployeeStmt.all(today);

    return {
      today,
      orders_today: ordersToday,
      weekly_overview: {
        week_start: weekStartStr,
        week_end: weekEndStr,
        workload_per_day: workloadPerDay,
        open_orders: openOrders.length
      },
      material_alerts: lowStockMaterials,
      quote_stats: quoteStats,
      invoice_stats: invoiceStats,
      time_by_employee: timeByEmployee
    };
  },

  getDailyReport: (dateParam) => {
    const date = toDateString(dateParam) ?? toDateString(new Date());

    const orders = ServiceOrder.getAll({ from: date, to: date });

    const timeEntriesStmt = db.prepare(`
      SELECT
        te.*,
        e.first_name || ' ' || e.last_name AS employee_name,
        so.title AS order_title
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.employee_id
      JOIN service_orders so ON te.order_id = so.order_id
      WHERE date(te.start_time) = date(?)
      ORDER BY te.start_time
    `);

    const materialUsageStmt = db.prepare(`
      SELECT
        mu.*,
        so.title AS order_title,
        e.first_name || ' ' || e.last_name AS employee_name
      FROM material_usage mu
      JOIN service_orders so ON mu.order_id = so.order_id
      LEFT JOIN employees e ON mu.employee_id = e.employee_id
      WHERE date(mu.created_at) = date(?)
      ORDER BY mu.created_at DESC
    `);

    const totalsStmt = db.prepare(`
      SELECT
        SUM(COALESCE(te.duration_minutes, 0)) AS minutes,
        SUM(COALESCE(te.distance_km, 0)) AS distance
      FROM time_entries te
      WHERE date(te.start_time) = date(?)
    `);

    const timeEntries = timeEntriesStmt.all(date);
    const materialUsage = materialUsageStmt.all(date);
    const totals = totalsStmt.get(date);

    return {
      date,
      orders,
      time_entries: timeEntries,
      material_usage: materialUsage,
      totals: {
        minutes: totals?.minutes ?? 0,
        distance_km: totals?.distance ?? 0
      }
    };
  },

  getWeeklyReport: (startParam, endParam) => {
    const start = startParam ? new Date(startParam) : startOfWeek(new Date());
    const end = endParam ? new Date(endParam) : endOfWeek(start);

    const startStr = toDateString(start);
    const endStr = toDateString(end);

    const orders = ServiceOrder.getAll({ from: startStr, to: endStr });

    const aggregatedStmt = db.prepare(`
      SELECT
        date(te.start_time) AS day,
        SUM(te.duration_minutes) AS minutes,
        SUM(te.distance_km) AS distance
      FROM time_entries te
      WHERE date(te.start_time) BETWEEN date(?) AND date(?)
      GROUP BY day
      ORDER BY day
    `);

    const revenueStmt = db.prepare(`
      SELECT
        account_id,
        SUM(total_gross) AS total_gross
      FROM invoices
      WHERE date(invoice_date) BETWEEN date(?) AND date(?)
      GROUP BY account_id
      ORDER BY total_gross DESC
    `);

    const aggregated = aggregatedStmt.all(startStr, endStr);
    const revenue = revenueStmt.all(startStr, endStr);

    return {
      start: startStr,
      end: endStr,
      orders,
      time_summary: aggregated,
      revenue_by_account: revenue
    };
  },

  getRevenueByMonth: (yearParam) => {
    const year = Number(yearParam) || new Date().getFullYear();
    const stmt = db.prepare(`
      SELECT
        strftime('%m', invoice_date) AS month,
        SUM(total_net) AS total_net,
        SUM(total_gross) AS total_gross,
        SUM(amount_paid) AS total_paid
      FROM invoices
      WHERE strftime('%Y', invoice_date) = ?
      GROUP BY month
      ORDER BY month
    `);

    const data = stmt.all(String(year));
    return { year, data };
  },

  getServiceOrderReport: ({ from, to, accountId, propertyId } = {}) => {
    const orders = ServiceOrder.getAll({ from, to });

    const filtered = orders.filter((order) => {
      if (accountId && Number(order.account_id) !== Number(accountId)) {
        return false;
      }
      if (propertyId && Number(order.property_id) !== Number(propertyId)) {
        return false;
      }
      return true;
    });

    const items = filtered.map((order) => ({
      order_id: order.order_id,
      title: order.title,
      planned_date: order.planned_date,
      planned_start: order.planned_start,
      planned_end: order.planned_end,
      status: order.status,
      priority: order.priority,
      account_id: order.account_id,
      account_name: order.account_name,
      invoice_account_id: order.invoice_account_id,
      invoice_account_name: order.invoice_account_name,
      property_id: order.property_id,
      property_name: order.property_name,
      estimated_hours: order.estimated_hours,
      total_tracked_minutes: order.total_tracked_minutes,
      assignments: order.assignments?.map((assignment) => ({
        employee_id: assignment.employee_id,
        employee_name: assignment.employee_name,
        scheduled_date: assignment.scheduled_date,
        scheduled_start: assignment.scheduled_start,
        scheduled_end: assignment.scheduled_end,
        is_primary: assignment.is_primary
      })) ?? []
    }));

    const totalEstimatedHours = items.reduce(
      (sum, order) => sum + (order.estimated_hours ? Number(order.estimated_hours) : 0),
      0
    );
    const totalTrackedMinutes = items.reduce(
      (sum, order) => sum + (order.total_tracked_minutes ? Number(order.total_tracked_minutes) : 0),
      0
    );

    const employees = {};
    items.forEach((order) => {
      order.assignments.forEach((assignment) => {
        if (!employees[assignment.employee_id]) {
          employees[assignment.employee_id] = {
            employee_id: assignment.employee_id,
            employee_name: assignment.employee_name,
            orders: 0
          };
        }
        employees[assignment.employee_id].orders += 1;
      });
    });

    return {
      filters: {
        from: from ?? null,
        to: to ?? null,
        accountId: accountId ? Number(accountId) : null,
        propertyId: propertyId ? Number(propertyId) : null
      },
      totals: {
        orders: items.length,
        estimated_hours: totalEstimatedHours,
        tracked_hours: totalTrackedMinutes / 60
      },
      employees: Object.values(employees),
      orders: items
    };
  }
};

module.exports = Report;
