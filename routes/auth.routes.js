// auth.routes.js — đăng nhập
const router = require("express").Router();
const { sql, getPool } = require("../config/db");
const { sendErr } = require("./_helpers");

// POST /api/auth/login  { taiKhoan, matKhau }
router.post("/login", async (req, res) => {
  try {
    const { taiKhoan, matKhau } = req.body;
    if (!taiKhoan || !matKhau)
      return res.status(400).json({ error: "Thiếu tài khoản hoặc mật khẩu." });
    const r = await getPool().request()
      .input("taiKhoan", sql.VarChar(50), taiKhoan)
      .input("matKhau", sql.VarChar(255), matKhau)
      .execute("sp_DangNhap");
    if (!r.recordset.length)
      return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu." });
    res.json(r.recordset[0]); // { maNV, tenNV, vaiTro, maChiNhanh, loaiNV }
  } catch (e) { sendErr(res, e); }
});

// POST /api/auth/login-pos  { taiKhoan, maPIN }  -> đăng nhập máy POS bằng PIN cửa hàng
router.post("/login-pos", async (req, res) => {
  try {
    const { taiKhoan, maPIN } = req.body;
    if (!taiKhoan || !maPIN)
      return res.status(400).json({ error: "Thiếu tài khoản hoặc mã PIN." });
    const r = await getPool().request()
      .input("taiKhoan", sql.VarChar(50), taiKhoan)
      .input("maPIN", sql.VarChar(10), maPIN)
      .execute("sp_DangNhapPOS");
    if (!r.recordset.length)
      return res.status(401).json({ error: "Tài khoản hoặc mã PIN máy POS không đúng." });
    res.json(r.recordset[0]); // { maNV, tenNV, vaiTro, maChiNhanh, tenChiNhanh, maQuay, tenQuay }
  } catch (e) { sendErr(res, e); }
});

module.exports = router;
