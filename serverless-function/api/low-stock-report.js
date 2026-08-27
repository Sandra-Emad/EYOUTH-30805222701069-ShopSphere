import pg from "pg";

const { Pool } = pg;
let pool;

const getPool = () => {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
    });
  }
  return pool;
};

const isAuthorizedCron = (req) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.authorization === `Bearer ${secret}`;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const threshold = Math.max(
    Number.parseInt(process.env.LOW_STOCK_THRESHOLD || "5", 10) || 5,
    0
  );

  try {
    const result = await getPool().query(
      `SELECT
         COUNT(*)::int AS total_products,
         COUNT(*) FILTER (WHERE stock <= $1)::int AS low_stock_products,
         COALESCE(SUM(stock) FILTER (WHERE stock <= $1), 0)::int AS low_stock_units
       FROM "Product"`,
      [threshold]
    );

    const report = {
      generatedAt: new Date().toISOString(),
      threshold,
      ...result.rows[0],
    };

    console.log(JSON.stringify({
      timestamp: report.generatedAt,
      level: "INFO",
      service: "shopsphere-low-stock-function",
      message: "Low-stock background report completed",
      report,
    }));

    return res.status(200).json({
      success: true,
      workload: "low-stock-report",
      report,
    });
  } catch (error) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "ERROR",
      service: "shopsphere-low-stock-function",
      message: "Low-stock background report failed",
      error: error.message,
    }));

    return res.status(500).json({
      success: false,
      message: "Background workload failed",
    });
  }
}
