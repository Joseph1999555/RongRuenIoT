import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  timezone: "+07:00",

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

export default pool;