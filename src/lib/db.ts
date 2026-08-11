import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    ca: fs.readFileSync(
      path.join(process.cwd(), "certs", "ca.pem"),
      "utf8",
    ),
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ทดสอบว่า Vercel ต่อ Database ตัวไหน
async function checkDatabase() {
  try {
    const [rows] = await pool.query(`
      SELECT
        DATABASE() AS db_name,
        @@hostname AS db_hostname,
        MAX(sensor_timestamp) AS latest_time,
        COUNT(*) AS total_rows
      FROM sensor_data
    `);

    console.log("DB CHECK:", rows);
  } catch (error) {
    console.error("DB CHECK ERROR:", error);
  }
}

checkDatabase();

export default pool;