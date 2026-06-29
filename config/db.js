const sql = require("mssql");

const config = {
  server: "localhost\\SQLEXPRESS",
  database: "QLST",
  user: "sa",
  password: "Emarket@2026",            // đúng mật khẩu sa bạn đặt
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: "SQLEXPRESS",
  },
};

let pool;
async function connectDB() {
  try {
    pool = await sql.connect(config);
    console.log("✅ Đã kết nối SQL Server!");
    return pool;
  } catch (err) {
    console.error("❌ Lỗi kết nối SQL Server:", err.message);
    process.exit(1);
  }
}
function getPool() {
  if (!pool) throw new Error("Chưa kết nối DB.");
  return pool;
}
module.exports = { sql, connectDB, getPool };
