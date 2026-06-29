const { connectDB } = require("./config/db");
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Cho phép truy cập các file giao diện (index.html, app.js, styles.css...)
app.use(express.static(path.join(__dirname, "public")));

// Trang chủ
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API thử nghiệm
app.get("/api/test", (req, res) => {
  res.json({ message: "API Node.js hoạt động!" });
});

// ===== API các module =====
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/products", require("./routes/products.routes"));
app.use("/api/customers", require("./routes/customers.routes"));
app.use("/api/orders", require("./routes/orders.routes"));
app.use("/api/shifts", require("./routes/shifts.routes"));
app.use("/api/reports", require("./routes/reports.routes"));

const PORT = process.env.PORT || 3000;

// 404 - phải đặt sau tất cả routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API không tồn tại."
  });
});

// Error handler - đặt sau middleware 404
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Lỗi máy chủ."
  });
});

// Kết nối DB rồi mới chạy server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối SQL Server:", err.message);
    process.exit(1);
  });