// products.routes.js — sản phẩm
const router = require("express").Router();
const { sql, getPool } = require("../config/db");
const { sendErr } = require("./_helpers");

// GET /api/products
router.get("/", async (_req, res) => {
  try {
    const r = await getPool().request().execute("sp_DanhSachSanPham");
    res.json(r.recordset);
  } catch (e) { sendErr(res, e); }
});

// GET /api/products/search?q=...
router.get("/search", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("tuKhoa", sql.NVarChar(100), req.query.q || "")
      .execute("sp_TimSanPham");
    res.json(r.recordset);
  } catch (e) { sendErr(res, e); }
});

module.exports = router;
