// _helpers.js — tiện ích dùng chung cho các route
const { sql } = require("../config/db");

// Dựng Table-Valued Parameter dbo.DanhSachHangType từ mảng [{maSanPham, soLuong}]
function buildHangTVP(items) {
  const t = new sql.Table("dbo.DanhSachHangType");
  t.columns.add("maSanPham", sql.VarChar(10), { nullable: false });
  t.columns.add("soLuong", sql.Int, { nullable: false });
  (items || []).forEach((i) => t.rows.add(i.maSanPham, Number(i.soLuong)));
  return t;
}

// Lỗi nghiệp vụ từ THROW (50000..59999) -> HTTP 400 kèm message; còn lại -> 500
function sendErr(res, err) {
  const n = err.number || (err.originalError && err.originalError.info && err.originalError.info.number);
  if (n >= 50000 && n < 60000) return res.status(400).json({ error: err.message, code: n });
  console.error(err);
  return res.status(500).json({ error: err.message });
}

module.exports = { buildHangTVP, sendErr };
