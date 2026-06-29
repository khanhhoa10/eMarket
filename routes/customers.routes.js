// customers.routes.js — khách hàng (module CSKH)
const router = require("express").Router();
const { sql, getPool } = require("../config/db");
const { sendErr } = require("./_helpers");

// GET /api/customers — danh sách (kèm hạng) cho bảng KH
router.get("/", async (_req, res) => {
  try {
    const r = await getPool().request().query(`
      SELECT kh.maKhachHang, kh.tenKhachHang, kh.soDienThoai, kh.email,
             kh.ngaySinh, kh.ngayDangKy, kh.diemTichLuy, htv.tenHang
      FROM KHACH_HANG kh
      LEFT JOIN THE_THANH_VIEN tv   ON tv.maKH    = kh.maKhachHang
      LEFT JOIN HANG_THANH_VIEN htv ON htv.maHang = tv.maHang
      ORDER BY kh.maKhachHang;`);
    res.json(r.recordset);
  } catch (e) { sendErr(res, e); }
});

// GET /api/customers/search?q=...
router.get("/search", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("tuKhoa", sql.NVarChar(100), req.query.q || "")
      .execute("sp_TraCuuKhachHang");
    res.json(r.recordset);
  } catch (e) { sendErr(res, e); }
});

// GET /api/customers/upgrades — KH đủ điều kiện thăng hạng
router.get("/upgrades", async (_req, res) => {
  try {
    const r = await getPool().request().execute("sp_DanhSachThangHang");
    res.json(r.recordset);
  } catch (e) { sendErr(res, e); }
});

// GET /api/customers/upgrade-history/list
router.get("/upgrade-history/list", async (_req, res) => {
  try {
    const r = await getPool().request().query(`
      SELECT TOP 50
             ls.maLS,
             ls.maKhachHang,
             kh.tenKhachHang,
             ls.maHangCu,
             ls.tenHangCu,
             ls.maHangMoi,
             ls.tenHangMoi,
             ls.maNV,
             ISNULL(ls.tenNV, nv.tenNV) AS tenNV,
             ls.ngayDieuChinh
      FROM LICH_SU_DIEU_CHINH_HANG ls
      LEFT JOIN KHACH_HANG kh ON kh.maKhachHang = ls.maKhachHang
      LEFT JOIN NHAN_VIEN nv ON nv.maNV = ls.maNV
      ORDER BY ls.ngayDieuChinh DESC;
    `);

    res.json(r.recordset);
  } catch (e) {
    sendErr(res, e);
  }
});

// GET /api/customers/:id — chi tiết hồ sơ thẻ
router.get("/:id", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maKH", sql.VarChar(10), req.params.id)
      .execute("sp_ChiTietKhachHang");
    if (!r.recordset.length) return res.status(404).json({ error: "Không tìm thấy khách hàng." });
    res.json(r.recordset[0]);
  } catch (e) { sendErr(res, e); }
});

// GET /api/customers/:id/history — lịch sử mua hàng
router.get("/:id/history", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maKH", sql.VarChar(10), req.params.id)
      .execute("sp_LichSuMuaHang");
    res.json(r.recordset);
  } catch (e) { sendErr(res, e); }
});

// POST /api/customers — tạo KH mới + thẻ + sổ điểm (chưa có proc -> batch)
router.post("/", async (req, res) => {
  try {
    const { tenKhachHang, soDienThoai, email, diaChi, ngaySinh } = req.body;
    if (!tenKhachHang || !soDienThoai)
      return res.status(400).json({ error: "Thiếu tên hoặc số điện thoại." });
    const r = await getPool().request()
      .input("ten", sql.NVarChar(100), tenKhachHang)
      .input("sdt", sql.VarChar(20), soDienThoai)
      .input("email", sql.VarChar(100), email || null)
      .input("diaChi", sql.NVarChar(255), diaChi || null)
      .input("ngaySinh", sql.Date, ngaySinh || null)
      .query(`
        DECLARE @ma VARCHAR(10) = dbo.fn_MaCode('KH', NEXT VALUE FOR dbo.SEQ_KHACH_HANG, 3);
        INSERT INTO KHACH_HANG (maKhachHang, tenKhachHang, soDienThoai, email, diaChi, ngaySinh)
        VALUES (@ma, @ten, @sdt, @email, @diaChi, @ngaySinh);
        DECLARE @maThe INT;
        INSERT INTO THE_THANH_VIEN (maKH, maHang, trangThaiThe) VALUES (@ma, 1, 'active');
        SET @maThe = SCOPE_IDENTITY();
        INSERT INTO DIEM_TICH_LUY (maThe, tongDiem, ngayCapNhat) VALUES (@maThe, 0, GETDATE());
        SELECT @ma AS maKhachHang;`);
    res.status(201).json({ maKhachHang: r.recordset[0].maKhachHang });
  } catch (e) { sendErr(res, e); }
});

// PUT /api/customers/:id — cập nhật thông tin KH (tên, SĐT, email, ngày sinh, địa chỉ)
router.put("/:id", async (req, res) => {
  try {
    const { tenKhachHang, soDienThoai, email, diaChi, ngaySinh } = req.body;
    if (!tenKhachHang || !soDienThoai)
      return res.status(400).json({ error: "Thiếu tên hoặc số điện thoại." });
    const r = await getPool().request()
      .input("ma", sql.VarChar(10), req.params.id)
      .input("ten", sql.NVarChar(100), tenKhachHang)
      .input("sdt", sql.VarChar(20), soDienThoai)
      .input("email", sql.VarChar(100), email || null)
      .input("diaChi", sql.NVarChar(255), diaChi || null)
      .input("ngaySinh", sql.Date, ngaySinh || null)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM KHACH_HANG WHERE maKhachHang=@ma)
          THROW 50100, N'Không tìm thấy khách hàng.', 1;
        IF EXISTS (SELECT 1 FROM KHACH_HANG WHERE soDienThoai=@sdt AND maKhachHang<>@ma)
          THROW 50101, N'Số điện thoại đã thuộc về khách hàng khác.', 1;
        UPDATE KHACH_HANG
        SET tenKhachHang=@ten, soDienThoai=@sdt, email=@email, diaChi=@diaChi, ngaySinh=@ngaySinh
        WHERE maKhachHang=@ma;
        SELECT @ma AS maKhachHang;`);
    res.json({ maKhachHang: r.recordset[0].maKhachHang });
  } catch (e) { sendErr(res, e); }
});


// POST /api/customers/:id/upgrade
router.post("/:id/upgrade", async (req, res) => {
  try {
    const { maNV } = req.body;

    if(!maNV){
      return res.status(400).json({ error: "Thiếu mã nhân viên thực hiện." });
    }

    const r = await getPool().request()
      .input("maKH", sql.VarChar(10), req.params.id)
      .input("maNV", sql.VarChar(20), maNV)
      .query(`
        DECLARE @diem DECIMAL(18,2);
        DECLARE @maThe INT;
        DECLARE @maHangCu INT;
        DECLARE @tenHangCu NVARCHAR(50);
        DECLARE @maHangMoi INT;
        DECLARE @tenHangMoi NVARCHAR(50);
        DECLARE @tenNV NVARCHAR(100);

        SELECT @diem = diemTichLuy
        FROM KHACH_HANG
        WHERE maKhachHang = @maKH;

        IF @diem IS NULL
            THROW 50100, N'Không tìm thấy khách hàng.', 1;

        SELECT TOP 1
               @maThe = tv.maThe,
               @maHangCu = tv.maHang,
               @tenHangCu = h.tenHang
        FROM THE_THANH_VIEN tv
        LEFT JOIN HANG_THANH_VIEN h ON h.maHang = tv.maHang
        WHERE tv.maKH = @maKH
        ORDER BY tv.maThe DESC;

        SELECT TOP 1
               @maHangMoi = maHang,
               @tenHangMoi = tenHang
        FROM HANG_THANH_VIEN
        WHERE diemToiThieu <= @diem
        ORDER BY diemToiThieu DESC;

        IF @maHangMoi IS NULL
            THROW 50101, N'Không xác định được hạng mới.', 1;

        IF @maHangCu = @maHangMoi
            THROW 50102, N'Khách hàng chưa đủ điều kiện thăng hạng.', 1;

        UPDATE THE_THANH_VIEN
        SET maHang = @maHangMoi
        WHERE maThe = @maThe;

        SELECT @tenNV = tenNV
        FROM NHAN_VIEN
        WHERE maNV = @maNV;

        INSERT INTO LICH_SU_DIEU_CHINH_HANG
            (maKhachHang, maHangCu, tenHangCu, maHangMoi, tenHangMoi, maNV, tenNV)
        VALUES
            (@maKH, @maHangCu, @tenHangCu, @maHangMoi, @tenHangMoi, @maNV, @tenNV);

        SELECT @maKH AS maKhachHang,
               @tenHangCu AS tenHangCu,
               @tenHangMoi AS tenHangMoi,
               @tenNV AS tenNV;
      `);

    res.json(r.recordset[0]);
  } catch (e) { sendErr(res, e); }
});

module.exports = router;