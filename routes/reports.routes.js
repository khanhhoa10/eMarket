// reports.routes.js — báo cáo doanh thu
const router = require("express").Router();
const { sql, getPool } = require("../config/db");
const { sendErr } = require("./_helpers");

// GET /api/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/revenue", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "Thiếu khoảng ngày (from, to)." });
    const r = await getPool().request()
      .input("tuNgay", sql.Date, from)
      .input("denNgay", sql.Date, to)
      .execute("sp_BaoCaoDoanhThu");
    const tong = r.recordset.reduce((s, x) => s + Number(x.doanhThuThuc || 0), 0);
    res.json({ rows: r.recordset, tongDoanhThuThuc: tong });
  } catch (e) { sendErr(res, e); }
});

module.exports = router;
