// shifts.routes.js — ca bán hàng (POS) + ca làm việc / chấm công
const router = require("express").Router();
console.log("===== shifts.routes loaded =====");
const { sql, getPool } = require("../config/db");
const { sendErr } = require("./_helpers");

// ---------- CA BÁN HÀNG ----------
// POST /api/shifts/sales/open  { maNV, maQuay, tienDauCa }
router.post("/sales/open", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maNV", sql.VarChar(20), req.body.maNV)
      .input("maQuay", sql.VarChar(20), req.body.maQuay)
      .input("tienDauCa", sql.Decimal(15, 2), req.body.tienDauCa || 0)
      .output("maCaBH", sql.VarChar(10))
      .execute("sp_MoCa");
    res.status(201).json({ maCaBH: r.output.maCaBH });
  } catch (e) { sendErr(res, e); }
});

// GET /api/shifts/sales/open?maNV=...  — ca đang mở của NV
router.get("/sales/open", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maNV", sql.VarChar(20), req.query.maNV)
      .execute("sp_CaDangMo");
    res.json(r.recordset[0] || null);
  } catch (e) { sendErr(res, e); }
});

// POST /api/shifts/sales/:id/close  { tienMatKiemDem }  -> trả bảng đối soát
router.post("/sales/:id/close", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maCaBH", sql.VarChar(10), req.params.id)
      .input("tienMatKiemDem", sql.Decimal(15, 2), req.body.tienMatKiemDem || 0)
      .execute("sp_DongCa");
    res.json(r.recordset[0]);
  } catch (e) { sendErr(res, e); }
});

// ---------- CA LÀM VIỆC / CHẤM CÔNG ----------
// POST /api/shifts/work — tạo lịch ca làm việc mới
// body: { maNV, loaiCa, ngayLamViec, gioBatDauDuKien, gioKetThucDuKien }
console.log("POST /work route registered");
router.post("/work", async (req, res) => {
  try {
    const { maNV, loaiCa, ngayLamViec, gioBatDauDuKien, gioKetThucDuKien } = req.body;

    if (!maNV || !loaiCa || !ngayLamViec || !gioBatDauDuKien || !gioKetThucDuKien) {
      return res.status(400).json({ error: "Thiếu thông tin tạo ca." });
    }

    const r = await getPool().request()
      .input("maNV", sql.VarChar(20), maNV)
      .input("loaiCa", sql.VarChar(20), loaiCa)
      .input("ngayLamViec", sql.Date, ngayLamViec)
      .input("gioBatDau", sql.VarChar(8), gioBatDauDuKien + ":00")
      .input("gioKetThuc", sql.VarChar(8), gioKetThucDuKien + ":00")
      .query(`
        BEGIN TRY
          BEGIN TRAN;

          IF NOT EXISTS (SELECT 1 FROM NHAN_VIEN WHERE maNV = @maNV AND trangThai = 'active')
            THROW 50001, N'Nhân viên không tồn tại hoặc không hoạt động.', 1;

          IF EXISTS (
            SELECT 1
            FROM CA_LAM_VIEC clv
            JOIN LICH_CA lc ON lc.maLich = clv.maLich
            WHERE lc.maNV = @maNV
              AND clv.ngayLamViec = @ngayLamViec
              AND CAST(@gioBatDau AS TIME) < clv.gioKetThucDuKien
              AND CAST(@gioKetThuc AS TIME) > clv.gioBatDauDuKien
          )
            THROW 50002, N'Nhân viên đã có ca trùng thời gian trong ngày này.', 1;

          DECLARE @nextLich INT;
          SELECT @nextLich =
            ISNULL(MAX(TRY_CAST(SUBSTRING(maLich, 3, 20) AS INT)), 0) + 1
          FROM LICH_CA
          WHERE maLich LIKE 'LC%';

          DECLARE @maLich VARCHAR(20);
          SET @maLich = 'LC' + RIGHT('000' + CAST(@nextLich AS VARCHAR(10)), 3);

          INSERT INTO LICH_CA
          (
            maLich,
            maNV,
            tuNgay,
            denNgay,
            trangThai,
            ghiChu,
            ngayTao
          )
          VALUES
          (
            @maLich,
            @maNV,
            @ngayLamViec,
            @ngayLamViec,
            'cho_duyet',
            N'Lịch ca tạo từ giao diện quản lý',
            GETDATE()
          );

          DECLARE @nextCa INT;
          SELECT @nextCa =
            ISNULL(MAX(TRY_CAST(SUBSTRING(maCaLV, 4, 20) AS INT)), 0) + 1
          FROM CA_LAM_VIEC
          WHERE maCaLV LIKE 'CLV%';

          DECLARE @maCaLV VARCHAR(20);
          SET @maCaLV = 'CLV' + RIGHT('000' + CAST(@nextCa AS VARCHAR(10)), 3);

          INSERT INTO CA_LAM_VIEC
          (
            maCaLV,
            maLich,
            loaiCa,
            ngayLamViec,
            gioBatDauDuKien,
            gioKetThucDuKien,
            gioBatDauThucTe,
            gioKetThucThucTe,
            soGioCong,
            trangThai,
            daXacNhan
          )
          VALUES
          (
            @maCaLV,
            @maLich,
            @loaiCa,
            @ngayLamViec,
            CAST(@gioBatDau AS TIME),
            CAST(@gioKetThuc AS TIME),
            NULL,
            NULL,
            0,
            'cho_duyet',
            0
          );

          COMMIT;

          SELECT @maCaLV AS maCaLV, @maLich AS maLich;
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0 ROLLBACK;
          THROW;
        END CATCH
      `);

    res.status(201).json(r.recordset[0]);

  } catch (e) {
    sendErr(res, e);
  }
});

// GET /api/shifts/work?maNV=&from=&to=
router.get("/work", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maNV", sql.VarChar(20), req.query.maNV || null)
      .input("tuNgay", sql.Date, req.query.from || null)
      .input("denNgay", sql.Date, req.query.to || null)
      .execute("sp_DanhSachCaLamViec");
    res.json(r.recordset);
  } catch (e) { sendErr(res, e); }
});

// POST /api/shifts/work/:id/checkin  { viDo?, kinhDo?, khoangCach? }
router.post("/work/:id/checkin", async (req, res) => {
  try {
    const { viDo, kinhDo, khoangCach } = req.body || {};
    await getPool().request()
      .input("maCaLV", sql.VarChar(20), req.params.id)
      .input("viDo", sql.Decimal(9, 6), viDo ?? null)
      .input("kinhDo", sql.Decimal(9, 6), kinhDo ?? null)
      .input("khoangCach", sql.Float, khoangCach ?? null)
      .execute("sp_CheckIn");
    res.json({ ok: true });
  } catch (e) { sendErr(res, e); }
});

// POST /api/shifts/work/:id/checkout
router.post("/work/:id/checkout", async (req, res) => {
  try {
    await getPool().request()
      .input("maCaLV", sql.VarChar(20), req.params.id)
      .execute("sp_CheckOut");
    res.json({ ok: true });
  } catch (e) { sendErr(res, e); }
});

// POST /api/shifts/work/:id/confirm  { maQuanLy }
router.post("/work/:id/confirm", async (req, res) => {
  try {
    await getPool().request()
      .input("maCaLV", sql.VarChar(20), req.params.id)
      .input("maQuanLy", sql.VarChar(20), req.body.maQuanLy)
      .execute("sp_XacNhanCa");
    res.json({ ok: true });
  } catch (e) { sendErr(res, e); }
});

// POST /api/shifts/work/:id/reject  { maQuanLy, lyDo }
router.post("/work/:id/reject", async (req, res) => {
  try {
    await getPool().request()
      .input("maCaLV", sql.VarChar(20), req.params.id)
      .input("maQuanLy", sql.VarChar(20), req.body.maQuanLy)
      .input("lyDo", sql.NVarChar(255), req.body.lyDo || null)
      .execute("sp_TuChoiCa");
    res.json({ ok: true });
  } catch (e) { sendErr(res, e); }
});

// GET /api/shifts/attendance?maNV=&from=&to=
router.get("/attendance", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maNV", sql.VarChar(20), req.query.maNV || null)
      .input("tuNgay", sql.Date, req.query.from)
      .input("denNgay", sql.Date, req.query.to)
      .execute("sp_BangChamCong");
    res.json(r.recordset);
  } catch (e) { sendErr(res, e); }
});

// DELETE /api/shifts/work/:id
// Chỉ cho xóa lịch ca khi chưa chấm công, chưa xác nhận công
router.delete("/work/:id", async (req, res) => {
  try {
    await getPool().request()
      .input("maCaLV", sql.VarChar(20), req.params.id)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM CA_LAM_VIEC
          WHERE maCaLV = @maCaLV
        )
        BEGIN
          THROW 50001, N'Ca làm việc không tồn tại.', 1;
        END;

        IF EXISTS (
          SELECT 1 FROM CA_LAM_VIEC
          WHERE maCaLV = @maCaLV
            AND (
              daXacNhan = 1
              OR gioBatDauThucTe IS NOT NULL
              OR gioKetThucThucTe IS NOT NULL
              OR trangThai IN ('dang_lam','da_lam')
            )
        )
        BEGIN
          THROW 50002, N'Chỉ được xóa ca chưa chấm công và chưa xác nhận công.', 1;
        END;

        -- Xóa log liên quan trước để không lỗi FK_LOG_CLV
        DELETE FROM NHAT_KY_THAO_TAC
        WHERE maCaLV = @maCaLV;

        DELETE FROM CA_LAM_VIEC
        WHERE maCaLV = @maCaLV;

        SELECT 1 AS ok;
      `);

    res.json({ success: true });
  } catch (e) {
    sendErr(res, e);
  }
});

// POST /api/shifts/work/:id/confirm-manual  { maQuanLy, gioBatDauThucTe, gioKetThucThucTe, soGioCong }
// QL xác nhận THỦ CÔNG khi NV quên chấm công (nhập tay giờ vào/ra + số giờ)
router.post("/work/:id/confirm-manual", async (req, res) => {
  try {
    const { maQuanLy, gioBatDauThucTe, gioKetThucThucTe, soGioCong } = req.body;
    if (!gioBatDauThucTe || !gioKetThucThucTe || soGioCong == null)
      return res.status(400).json({ error: "Thiếu giờ vào/ra hoặc số giờ công." });
    await getPool().request()
      .input("maCaLV", sql.VarChar(20), req.params.id)
      .input("maQuanLy", sql.VarChar(20), maQuanLy)
      .input("gioBatDauThucTe", sql.VarChar(8), gioBatDauThucTe.length === 5 ? gioBatDauThucTe + ":00" : gioBatDauThucTe)
      .input("gioKetThucThucTe", sql.VarChar(8), gioKetThucThucTe.length === 5 ? gioKetThucThucTe + ":00" : gioKetThucThucTe)
      .input("soGioCong", sql.Decimal(5, 2), Number(soGioCong))
      .execute("sp_XacNhanCaThuCong");
    res.json({ ok: true });
  } catch (e) { sendErr(res, e); }
});

// POST /api/shifts/work/:id/approve-schedule
// Duyệt lịch ca: cho nhân viên nhìn thấy lịch, KHÔNG xác nhận công
router.post("/work/:id/approve-schedule", async (req, res) => {
  try {
    const r = await getPool().request()
      .input("maCaLV", sql.VarChar(20), req.params.id)
      .query(`
        DECLARE @maLich VARCHAR(20);

        SELECT @maLich = maLich
        FROM CA_LAM_VIEC
        WHERE maCaLV = @maCaLV;

        IF @maLich IS NULL
          THROW 50001, N'Ca làm việc không tồn tại.', 1;

        -- Nếu đã duyệt rồi thì trả ok, không báo lỗi
        IF EXISTS (
          SELECT 1
          FROM CA_LAM_VIEC
          WHERE maCaLV = @maCaLV
            AND trangThai = 'cho_lam'
            AND daXacNhan = 0
        )
        BEGIN
          SELECT 1 AS affected;
          RETURN;
        END;

        -- Chỉ duyệt lịch khi chưa chấm công
        UPDATE CA_LAM_VIEC
        SET trangThai = 'cho_lam',
            daXacNhan = 0,
            maNguoiXacNhan = NULL,
            ngayXacNhan = NULL
        WHERE maCaLV = @maCaLV
          AND trangThai = 'cho_duyet'
          AND gioBatDauThucTe IS NULL
          AND gioKetThucThucTe IS NULL;

        IF @@ROWCOUNT = 0
          THROW 50002, N'Chỉ duyệt lịch được ca đang chờ duyệt và chưa chấm công.', 1;

        -- Quan trọng: cập nhật cả LICH_CA
        UPDATE LICH_CA
        SET trangThai = 'da_duyet'
        WHERE maLich = @maLich;

        SELECT 1 AS affected;
      `);

    res.json({ ok: true });
  } catch (e) {
    sendErr(res, e);
  }
});
// PUT /api/shifts/staff/profile
router.put("/staff/profile", async (req, res) => {
  try {
    const { maNV, soDienThoai, email } = req.body;

    if (!maNV) {
      return res.status(400).json({ error: "Thiếu mã nhân viên." });
    }

    await getPool().request()
      .input("maNV", sql.VarChar(20), maNV)
      .input("soDienThoai", sql.VarChar(20), soDienThoai || null)
      .input("email", sql.VarChar(100), email || null)
      .query(`
        UPDATE NHAN_VIEN
        SET soDienThoai = @soDienThoai,
            email = @email
        WHERE maNV = @maNV;

        SELECT maNV, tenNV, taiKhoan, vaiTro, maChiNhanh, loaiNV, email, soDienThoai
        FROM NHAN_VIEN
        WHERE maNV = @maNV;
      `);

    res.json({ ok: true });
  } catch (e) { sendErr(res, e); }
});
module.exports = router;