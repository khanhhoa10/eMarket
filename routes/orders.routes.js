// orders.routes.js — bán hàng (POS) + tra cứu/hủy/hoàn
const router = require("express").Router();
const { sql, getPool } = require("../config/db");
const { buildHangTVP, sendErr } = require("./_helpers");

// GET /api/orders?caBH=&from=&to=&trangThai=
router.get("/", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maCaBH", sql.VarChar(10), req.query.caBH || null)
      .input("tuNgay", sql.DateTime, req.query.from || null)
      .input("denNgay", sql.DateTime, req.query.to || null)
      .input("trangThai", sql.VarChar(20), req.query.trangThai || null)
      .execute("sp_DanhSachDonHang");
    res.json(r.recordset);
  } catch (e) { sendErr(res, e); }
});

// GET /api/orders/refunds/pending — phiếu hoàn chờ Quản lý duyệt (đơn >= 3tr)
router.get("/refunds/pending", async (_req, res) => {
  try {
    const r = await getPool().request().query(`
      SELECT ph.maPhieuHoan, ph.maDonHang, ph.tongTienHoan, ph.lyDo, ph.ngayHoan,
             ph.maNVXuLy, dh.maKhachHang, kh.tenKhachHang, hd.thanhTien AS thanhTienDon
      FROM PHIEU_HOAN ph
      JOIN DON_HANG dh ON dh.maDonHang = ph.maDonHang
      LEFT JOIN KHACH_HANG kh ON kh.maKhachHang = dh.maKhachHang
      LEFT JOIN HOA_DON hd ON hd.maDonHang = ph.maDonHang
      WHERE ph.trangThai = 'ChoDuyet'
      ORDER BY ph.ngayHoan DESC;`);
    res.json(r.recordset);
  } catch (e) { sendErr(res, e); }
});

// GET /api/orders/:id — header + dòng hàng (2 result set)
router.get("/:id", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maDonHang", sql.VarChar(10), req.params.id)
      .execute("sp_ChiTietDonHang");
    if (!r.recordsets[0].length) return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
    res.json({ donHang: r.recordsets[0][0], chiTiet: r.recordsets[1] });
  } catch (e) { sendErr(res, e); }
});

// POST /api/orders  { maCaBH, maNV, maKhachHang?, items:[{maSanPham,soLuong}], ghiChu? }
router.post("/", async (req, res) => {
  try {
    const { maCaBH, maNV, maKhachHang, items, ghiChu } = req.body;
    const r = await getPool().request()
      .input("maCaBH", sql.VarChar(10), maCaBH)
      .input("maNV", sql.VarChar(20), maNV)
      .input("maKhachHang", sql.VarChar(10), maKhachHang || null)
      .input("gioHang", buildHangTVP(items))
      .input("ghiChu", sql.NVarChar(500), ghiChu || null)
      .output("maDonHang", sql.VarChar(10))
      .execute("sp_TaoDonHang");
    res.status(201).json({ maDonHang: r.output.maDonHang });
  } catch (e) { sendErr(res, e); }
});

// PUT /api/orders/:id  { items, ghiChu? }
router.put("/:id", async (req, res) => {
  try {
    await getPool().request()
      .input("maDonHang", sql.VarChar(10), req.params.id)
      .input("gioHang", buildHangTVP(req.body.items))
      .input("ghiChu", sql.NVarChar(500), req.body.ghiChu || null)
      .execute("sp_CapNhatDonHang");
    res.json({ ok: true });
  } catch (e) { sendErr(res, e); }
});

// POST /api/orders/:id/checkout  { hinhThuc, soTienKhachDua }  -> trả phiếu thu
router.post("/:id/checkout", async (req, res) => {
  try {
    const { hinhThuc, soTienKhachDua } = req.body;
    const r = await getPool().request()
      .input("maDonHang", sql.VarChar(10), req.params.id)
      .input("hinhThuc", sql.VarChar(20), hinhThuc)
      .input("soTienKhachDua", sql.Decimal(15, 2), soTienKhachDua)
      .output("maHoaDon", sql.VarChar(10))
      .execute("sp_ThanhToan");
    res.json({ maHoaDon: r.output.maHoaDon, phieuThu: r.recordset[0] });
  } catch (e) { sendErr(res, e); }
});

// POST /api/orders/:id/cancel-otp  -> sinh OTP (đơn >= 3tr)
router.post("/:id/cancel-otp", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maDonHang", sql.VarChar(10), req.params.id)
      .output("otp", sql.VarChar(10))
      .execute("sp_TaoOTPHuy");
    res.json({ otp: r.output.otp }); // THẬT: gửi cho QL kênh riêng, không trả thẳng
  } catch (e) { sendErr(res, e); }
});

// POST /api/orders/:id/cancel  { maNV, lyDo, otp? }
router.post("/:id/cancel", async (req, res) => {
  try {
    await getPool().request()
      .input("maDonHang", sql.VarChar(10), req.params.id)
      .input("maNV", sql.VarChar(20), req.body.maNV)
      .input("lyDo", sql.NVarChar(500), req.body.lyDo || null)
      .input("otp", sql.VarChar(10), req.body.otp || null)
      .execute("sp_HuyDon");
    res.json({ ok: true });
  } catch (e) { sendErr(res, e); }
});

// POST /api/orders/:id/refund  { maNVXuLy, lyDo, items:[{maSanPham,soLuong}] }
router.post("/:id/refund", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maDonHang", sql.VarChar(10), req.params.id)
      .input("maNVXuLy", sql.VarChar(20), req.body.maNVXuLy)
      .input("lyDo", sql.NVarChar(500), req.body.lyDo || null)
      .input("gioHangHoan", buildHangTVP(req.body.items))
      .output("maPhieuHoan", sql.VarChar(10))
      .execute("sp_HoanDon");
    res.status(201).json({ maPhieuHoan: r.output.maPhieuHoan });
  } catch (e) { sendErr(res, e); }
});

// POST /api/orders/refunds/:maPhieuHoan/approve  { maQuanLy }
router.post("/refunds/:maPhieuHoan/approve", async (req, res) => {
  try {
    await getPool().request()
      .input("maPhieuHoan", sql.VarChar(10), req.params.maPhieuHoan)
      .input("maQuanLy", sql.VarChar(20), req.body.maQuanLy)
      .execute("sp_DuyetHoanDon");
    res.json({ ok: true });
  } catch (e) { sendErr(res, e); }
});

// POST /api/orders/refunds/:maPhieuHoan/reject  { maQuanLy, lyDo }
router.post("/refunds/:maPhieuHoan/reject", async (req, res) => {
  try {
    await getPool().request()
      .input("maPhieuHoan", sql.VarChar(10), req.params.maPhieuHoan)
      .input("maQuanLy", sql.VarChar(20), req.body.maQuanLy)
      .input("lyDo", sql.NVarChar(500), req.body.lyDo || null)
      .execute("sp_TuChoiHoanDon");
    res.json({ ok: true });
  } catch (e) { sendErr(res, e); }
});

module.exports = router;
