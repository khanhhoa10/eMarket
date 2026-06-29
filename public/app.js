// =========================================================
      // API HELPERS (gọi backend cùng origin :3000)
      // =========================================================
      async function apiGet(path){
        const r = await fetch('/api'+path);
        const d = await r.json().catch(()=>({}));
        if(!r.ok) throw new Error(d.error || ('Lỗi '+r.status));
        return d;
      }
      async function apiPost(path, body){
        const r = await fetch('/api'+path, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify(body||{})
        });
        const d = await r.json().catch(()=>({}));
        if(!r.ok) throw new Error(d.error || ('Lỗi '+r.status));
        return d;
      }
      async function apiPut(path, body){
        const r = await fetch('/api'+path, {
          method:'PUT', headers:{'Content-Type':'application/json'},
          body: JSON.stringify(body||{})
        });
        const d = await r.json().catch(()=>({}));
        if(!r.ok) throw new Error(d.error || ('Lỗi '+r.status));
        return d;
      }

      async function apiDelete(path){

        const r = await fetch('/api' + path,{
            method:'DELETE'
        });

        const d = await r.json().catch(()=>({}));

        if(!r.ok){
            throw new Error(d.error || ('Lỗi ' + r.status));
        }

        return d;
      }

      // Map bản ghi DB -> shape giao diện đang dùng
      const mapProduct  = p => ({ id:p.maSanPham, barcode:p.maVach||'', name:p.tenSanPham,
                                  unit:'', price:Number(p.donGia), stock:Number(p.soLuongTon) });
      const mapCustomer = c => ({ id:c.maKhachHang, name:c.tenKhachHang, phone:c.soDienThoai||'',
                                  email:c.email||'', dob:c.ngaySinh||'', regDate:c.ngayDangKy||'',
                                  points:Number(c.diemTichLuy||0), tier:c.tenHang||'Thành viên' });
      const payToHinhThuc = { cash:'TienMat', qr:'ChuyenKhoan', card:'QuetThe' };

      async function loadProducts(){
        try{ products = (await apiGet('/products')).map(mapProduct); renderProductGrid(); }
        catch(e){ toast('Lỗi tải sản phẩm: '+e.message,'error'); }
      }
      async function loadCustomers(){ 
        try{ 
          customers = (await apiGet('/customers')).map(mapCustomer);
          renderDashboardKPI();
        }
        catch(e){ toast('Lỗi tải khách hàng: '+e.message,'error'); }
      }

      async function showCustomerDetail(id){
        try{
          const c = await apiGet('/customers/' + id);
          const history = await apiGet('/customers/' + id + '/history');

          document.getElementById('custDetailId').textContent = c.maKhachHang || id;
          document.getElementById('custDetailName').textContent = c.tenKhachHang || '—';
          document.getElementById('custDetailPhone').textContent = c.soDienThoai || '—';
          document.getElementById('custDetailEmail').textContent = c.email || '—';
          document.getElementById('custDetailDob').textContent = c.ngaySinh ? new Date(c.ngaySinh).toLocaleDateString('vi-VN') : '—';
          document.getElementById('custDetailCreated').textContent = c.ngayDangKy ? new Date(c.ngayDangKy).toLocaleDateString('vi-VN') : '—';
          document.getElementById('custDetailPoint').textContent = Number(c.diemTichLuy || 0).toLocaleString('vi-VN') + ' điểm';
          document.getElementById('custDetailRank').textContent = c.tenHang || 'Thành viên';

          renderCustomerHistory(history);

          openModal('modalCustomerDetail');
        }catch(e){
          toast('Lỗi tải chi tiết khách hàng: ' + e.message, 'error');
        }
      }

      function renderCustomerHistory(history){
        const tbody = document.getElementById('custHistoryRows');
        if(!tbody) return;

        if(!history || history.length === 0){
          tbody.innerHTML = `
            <tr>
              <td colspan="5" class="p-6 text-center text-slate-400 italic">
                Chưa có đơn hàng nào.
              </td>
            </tr>`;
          return;
        }

        tbody.innerHTML = history.map(h => `
          <tr class="border-t border-slate-100">
            <td class="p-3 font-mono font-semibold">${h.maHoaDon || h.maDonHang || '—'}</td>
            <td class="p-3">${h.ngayLap ? new Date(h.ngayLap).toLocaleDateString('vi-VN') : '—'}</td>
            <td class="p-3 text-right font-semibold">${fmt(Number(h.thanhTien || h.tongTien || 0))}</td>
            <td class="p-3 text-center text-emerald-600 font-semibold">${h.diemCong || h.soDiem || 0}</td>
            <td class="p-3">${stBadge(_stMapOrd[h.trangThai] || 'paid')}</td>
          </tr>
        `).join('');
      }

      // Trích HH:MM từ giá trị TIME (mssql trả dạng ISO 1970-01-01THH:MM:SS)
      const _hhmm = v => { if(!v) return '—'; const m=String(v).match(/(\d{2}):(\d{2})/); return m?(m[1]+':'+m[2]):'—'; };
      const _ymd  = v => v ? String(v).slice(0,10) : '';
      // Map 1 ca làm việc (DB) -> shape giao diện workShifts
      function mapWorkShift(r){
        const date = _ymd(r.ngayLamViec);

        const hasCheckin = !!r.gioBatDauThucTe;
        const hasCheckout = !!r.gioKetThucThucTe;

        const confirmed =
          r.daXacNhan === true ||
          r.daXacNhan === 1 ||
          r.daXacNhan === '1' ||
          r.daXacNhan === 'true' ||
          r.daXacNhan === 'True';

        let status = 'pending';

        // cho_duyet: mới tạo lịch, nhân viên chưa thấy
        if(r.trangThai === 'cho_duyet'){
          status = 'pending';
        }

        // cho_lam: quản lý đã duyệt lịch, nhân viên được thấy
        else if(r.trangThai === 'cho_lam'){
          status = 'approved';
        }

        // dang_lam: nhân viên đã check-in, chưa check-out
        else if(r.trangThai === 'dang_lam'){
          status = 'checkedin';
        }

        // da_lam: nhân viên đã check-out, chờ quản lý xác nhận công
        else if(r.trangThai === 'da_lam'){
          status = confirmed ? 'done' : 'checkedin';
        }

        else if(r.trangThai === 'vang_mat'){
          status = 'absent';
        }

        else if(r.trangThai === 'tu_choi'){
          status = 'rejected';
        }

        if(confirmed){
          status = 'done';
        }

        return {
          id: r.maCaLV,
          staff: r.tenNV,
          code: r.maNV,
          date,
          time: _hhmm(r.gioBatDauDuKien) + '-' + _hhmm(r.gioKetThucDuKien),
          counter: r.tenQuay || r.maQuay || '—',
          checkinTime: hasCheckin ? _hhmm(r.gioBatDauThucTe) : '—',
          checkoutTime: hasCheckout ? _hhmm(r.gioKetThucThucTe) : '—',
          hours: r.soGioCong != null ? Number(r.soGioCong) : 0,
          status,
          note: r.trangThai === 'tu_choi'
            ? (r.lyDoTuChoi || 'Từ chối bởi quản lý')
            : ''
        };
      }
      
      async function loadWorkShifts(){
        try{
          workShifts = (await apiGet('/shifts/work')).map(mapWorkShift);
          syncManagedShiftsFromWorkShifts();
          renderWeekGrid();
          renderWorkShiftList(); 
          filterAttendance();
          updateMgrNotifications();
          renderDashboardKPI();
          renderSystemAlerts();
        }catch(e){ toast('Lỗi tải ca làm việc: '+e.message,'error'); }
      }

      // ----- Quản lý: đơn hàng + duyệt hoàn (thật) -----
      let mgrOrders = [];
      const _stMapOrd  = { DaThanhToan:'paid', HoanTra:'refund', DaHuy:'cancel', ChoThanhToan:'pending' };
      const _payMapOrd = { TienMat:'cash', ChuyenKhoan:'qr', QuetThe:'card' };
      function initRevenueDefaultDate(){
        const from = document.getElementById('revFrom');
        const to = document.getElementById('revTo');

        if(!from || !to) return;

        const today = new Date().toISOString().slice(0,10);

        if(!from.value) from.value = today;
        if(!to.value) to.value = today;
      }
      async function loadMgrOrders(){
        try{
          const rows = await apiGet('/orders');
          mgrOrders = rows.map(r=>({
            id: r.maDonHang,
            time: r.ngayLap ? new Date(r.ngayLap).toLocaleString('vi-VN') : '',
            rawDate: r.ngayLap,
            cust: r.tenKhachHang || 'Khách lẻ',
            phone: r.soDienThoai || '',
            total: Number(r.thanhTien!=null ? r.thanhTien : r.tongTien)||0,
            payMethod: _payMapOrd[r.hinhThuc] || '',
            st: _stMapOrd[r.trangThai] || 'paid',
            maNV: r.maNV,
            staffName: r.tenNV || r.maNV,
            items: []
          }));
          initRevenueDefaultDate();
          updateRevenueKpiFromChart();
          renderMgrOrders(mgrOrders);
          renderRecentOrders();
          renderPayMethodReal();
          renderTopProductsReal();
          renderCategoryRevenueReal();
          renderDashboardKPI();
          renderSystemAlerts();
          renderStaffPerf();
        }catch(e){ toast('Lỗi tải đơn hàng: '+e.message,'error'); }
      }
      async function loadPendingRefunds(){
        try{
          const rows = await apiGet('/orders/refunds/pending');
          returnRequests = rows.map(r=>({
            id: r.maPhieuHoan, orderId: r.maDonHang,
            cust: r.tenKhachHang || 'Khách lẻ',
            orderTotal: Number(r.thanhTienDon||0),
            returnAmount: Number(r.tongTienHoan||0),
            reason: r.lyDo || '—',
            requestedAt: r.ngayHoan ? new Date(r.ngayHoan).toLocaleString('vi-VN') : '',
            status: 'pending'
          }));
          renderReturnRequestPanel();
          renderSystemAlerts();
        }catch(e){ toast('Lỗi tải phiếu hoàn chờ duyệt: '+e.message,'error'); }
      }

      // ----- POS: tra cứu đơn hàng (thật) -----
      let posOrders = [];
      async function loadPosOrders(){
        try{
          const rows = await apiGet('/orders');
          posOrders = rows.map(r=>({
            id: r.maDonHang,
            time: r.ngayLap ? new Date(r.ngayLap).toLocaleString('vi-VN') : '',
            cust: r.tenKhachHang || 'Khách lẻ',
            phone: r.soDienThoai || '',
            total: Number(r.thanhTien!=null ? r.thanhTien : r.tongTien)||0,
            payMethod: _payMapOrd[r.hinhThuc] || '',
            st: _stMapOrd[r.trangThai] || 'paid'
          }));
          renderPosOrders(posOrders);
        }catch(e){ toast('Lỗi tải đơn hàng: '+e.message,'error'); }
      }

      // =========================================================
      // MOCK DATA (đang dần thay bằng API)
      // =========================================================
      const ACCOUNTS = {
        'M01':  { pin:'0000', role:'quan_ly',   name:'Quản Lý Minh' },
        'C01':  { pin:'1234', role:'thu_ngan',  name:'Nguyễn Văn An' },
        'E01':  { pin:'1234', role:'cham_cong', name:'Văn C' },
        'CS01': { pin:'1234', role:'cskh',      name:'Mai Thị Hoa' },
      };

      let customers = [
        { id:'KH001', name:'Phạm Thu Hà',      phone:'0901234567', email:'ha@mail.com', dob:'1992-03-15', regDate:'2025-01-10', points:1250, tier:'Vàng' },
        { id:'KH002', name:'Hoàng Văn Đức',    phone:'0912345678', email:'duc@mail.com', dob:'1988-07-22', regDate:'2025-03-05', points:85,   tier:'Thành viên' },
        { id:'KH003', name:'Nguyễn Lan Anh',   phone:'0923456789', email:'anh@mail.com', dob:'1995-11-08', regDate:'2024-11-20', points:10500,tier:'Kim Cương' },
        { id:'KH004', name:'Trần Minh Khoa',   phone:'0934567890', email:'khoa@mail.com',dob:'1990-05-30', regDate:'2025-04-12', points:560,  tier:'Bạc' },
        { id:'KH005', name:'Lê Thị Bảo Châu',  phone:'0945678901', email:'chau@mail.com',dob:'1997-02-14', regDate:'2025-06-01', points:2800, tier:'Vàng' },
        { id:'KH006', name:'Đinh Quốc Hùng',   phone:'0956789012', email:'hung@mail.com',dob:'1985-09-17', regDate:'2024-08-30', points:110,  tier:'Bạc' },
      ];

      let orders = [
        { id:'DH001', time:'08:12', cust:'Phạm Thu Hà',    total:285000,  payMethod:'cash',  st:'paid',   items:[{name:'Sữa tươi Vinamilk 1L',qty:3,price:35000},{name:'Bánh mì sandwich',qty:2,price:25000},{name:'Nước ngọt Pepsi 330ml',qty:4,price:15000}] },
        { id:'DH002', time:'09:45', cust:'Khách lẻ',        total:120000,  payMethod:'qr',    st:'paid',   items:[{name:'Mì Hảo Hảo tôm chua cay',qty:10,price:4500},{name:'Nước suối Aquafina 500ml',qty:5,price:8000}] },
        { id:'DH003', time:'10:20', cust:'Hoàng Văn Đức',  total:3250000, payMethod:'card',  st:'paid',   items:[{name:'Nước giặt OMO 3kg',qty:5,price:119000},{name:'Máy xay sinh tố',qty:1,price:1850000},{name:'Nồi cơm điện Sunhouse',qty:1,price:680000}] },
        { id:'DH004', time:'11:05', cust:'Nguyễn Lan Anh', total:180000,  payMethod:'cash',  st:'refund', items:[{name:'Dầu gội Clear 650ml',qty:2,price:90000}] },
        { id:'DH005', time:'13:30', cust:'Khách lẻ',        total:450000,  payMethod:'qr',    st:'paid',   items:[{name:'Trứng gà ta hộp 10',qty:3,price:68000},{name:'Sữa tươi Vinamilk 1L',qty:6,price:35000}] },
        { id:'DH006', time:'14:55', cust:'Lê Thị Bảo Châu',total:890000,  payMethod:'card',  st:'cancel', items:[{name:'Coca Cola 1.5L',qty:4,price:28000},{name:'Nước giặt OMO 3kg',qty:2,price:119000}] },
        { id:'DH007', time:'16:10', cust:'Đinh Quốc Hùng', total:65000,   payMethod:'cash',  st:'paid',   items:[{name:'Mì Hảo Hảo tôm chua cay',qty:5,price:4500},{name:'Kẹo Chupa Chups',qty:10,price:5000}] },
        { id:'DH008', time:'17:40', cust:'Khách lẻ',        total:1200000, payMethod:'qr',    st:'paid',   items:[{name:'Dầu ăn Neptune 2L',qty:3,price:120000},{name:'Đường Biên Hòa 1kg',qty:4,price:35000},{name:'Bột giặt Omo 3kg',qty:2,price:119000}] },
      ];

      let products = [
        { id:'SP001', barcode:'8934804011234', name:'Sữa tươi Vinamilk 1L',       unit:'Hộp',  price:35000,  stock:120 },
        { id:'SP002', barcode:'8936086060017', name:'Mì Hảo Hảo tôm chua cay',   unit:'Gói',  price:4500,   stock:500 },
        { id:'SP003', barcode:'8934822400016', name:'Nước giặt OMO 3kg',          unit:'Túi',  price:119000, stock:45  },
        { id:'SP004', barcode:'8934860026018', name:'Coca Cola 1.5L',             unit:'Chai', price:28000,  stock:80  },
        { id:'SP005', barcode:'8936011010013', name:'Trứng gà ta hộp 10',         unit:'Hộp',  price:68000,  stock:60  },
        { id:'SP006', barcode:'8934817010010', name:'Dầu gội Clear 650ml',        unit:'Chai', price:90000,  stock:30  },
        { id:'SP007', barcode:'8935021010101', name:'Bánh mì sandwich',           unit:'Ổ',    price:25000,  stock:40  },
        { id:'SP008', barcode:'8936022010014', name:'Nước ngọt Pepsi 330ml',      unit:'Lon',  price:15000,  stock:200 },
        { id:'SP009', barcode:'8935033010109', name:'Dầu ăn Neptune 2L',          unit:'Chai', price:120000, stock:25  },
        { id:'SP010', barcode:'8936044010112', name:'Đường Biên Hòa 1kg',         unit:'Túi',  price:35000,  stock:90  },
      ];

      // =========================================================
      // DỮ LIỆU NGHIỆP VỤ CA LÀM VIỆC
      // ---------------------------------------------------------
      // managedShifts = "Lịch ca" (schedules): do quản lý tạo
      //   ở mục Lịch ca tuần. Status: pending → approved
      //   Sau khi approved → tự động sinh bản ghi workShifts
      //
      // workShifts = "Ca làm việc": các ca đã approved.
      //   Nhân viên chấm công → status chuyển sang 'checkedin'
      //   Quản lý xem tại màn hình này rồi xác nhận / từ chối.
      //   Sau khi xác nhận → status 'done' → ghi nhận ngày công
      // =========================================================

      // LỊCH CA (schedules) — dùng cho màn hình "Lịch ca tuần"
      let managedShifts = [
        { id:'SC001', staff:'Nguyễn Văn An', code:'E01', date:'15/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC002', staff:'Trần Thị Bình', code:'E02', date:'15/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC003', staff:'Lê Văn Cường',  code:'E03', date:'17/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC004', staff:'Phạm Thị Dung', code:'E04', date:'15/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC005', staff:'Hoàng Văn Em',  code:'E05', date:'20/06/2026', time:'07:00-15:00', counter:'Quầy 05', status:'approved' },
        { id:'SC006', staff:'Nguyễn Văn An', code:'E01', date:'20/06/2026', time:'15:00-22:00', counter:'Quầy 01', status:'approved' },
        { id:'SC007', staff:'Trần Thị Bình', code:'E02', date:'17/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'pending'  },
        { id:'SC008', staff:'Lê Văn Cường',  code:'E03', date:'21/06/2026', time:'15:00-22:00', counter:'Quầy 03', status:'pending'  },
        { id:'SC009', staff:'Phạm Thị Dung', code:'E04', date:'17/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'pending'  },
        { id:'SC010', staff:'Nguyễn Văn An', code:'E01', date:'21/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC011', staff:'Trần Thị Bình', code:'E02', date:'21/06/2026', time:'15:00-22:00', counter:'Quầy 02', status:'approved' },
        { id:'SC012', staff:'Phạm Thị Dung', code:'E04', date:'21/06/2026', time:'07:00-15:00', counter:'Quầy 04', status:'approved' },
        { id:'SC013', staff:'Lê Văn Cường',  code:'E03', date:'22/06/2026', time:'07:00-15:00', counter:'Quầy 03', status:'pending'  },
        { id:'SC014', staff:'Hoàng Văn Em',  code:'E05', date:'23/06/2026', time:'07:00-15:00', counter:'Quầy 05', status:'pending'  },

        // ── TUẦN 3: 22/06 - 28/06/2026 ──
        { id:'SC015', staff:'Nguyễn Văn An', code:'E01', date:'22/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC016', staff:'Trần Thị Bình', code:'E02', date:'22/06/2026', time:'15:00-22:00', counter:'Quầy 02', status:'approved' },
        { id:'SC017', staff:'Lê Văn Cường',  code:'E03', date:'22/06/2026', time:'07:00-15:00', counter:'Quầy 03', status:'approved' },
        { id:'SC018', staff:'Phạm Thị Dung', code:'E04', date:'23/06/2026', time:'15:00-22:00', counter:'Quầy 04', status:'approved' },
        { id:'SC019', staff:'Nguyễn Văn An', code:'E01', date:'24/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC020', staff:'Trần Thị Bình', code:'E02', date:'24/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC021', staff:'Lê Văn Cường',  code:'E03', date:'25/06/2026', time:'15:00-22:00', counter:'Quầy 03', status:'approved' },
        { id:'SC022', staff:'Hoàng Văn Em',  code:'E05', date:'25/06/2026', time:'07:00-15:00', counter:'Quầy 05', status:'approved' },
        { id:'SC023', staff:'Nguyễn Văn An', code:'E01', date:'26/06/2026', time:'15:00-22:00', counter:'Quầy 01', status:'pending'  },
        { id:'SC024', staff:'Phạm Thị Dung', code:'E04', date:'26/06/2026', time:'07:00-15:00', counter:'Quầy 04', status:'pending'  },
        { id:'SC025', staff:'Trần Thị Bình', code:'E02', date:'27/06/2026', time:'15:00-22:00', counter:'Quầy 02', status:'pending'  },
        { id:'SC026', staff:'Lê Văn Cường',  code:'E03', date:'27/06/2026', time:'07:00-15:00', counter:'Quầy 03', status:'pending'  },
        { id:'SC027', staff:'Nguyễn Văn An', code:'E01', date:'28/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'pending'  },
        { id:'SC028', staff:'Hoàng Văn Em',  code:'E05', date:'28/06/2026', time:'15:00-22:00', counter:'Quầy 05', status:'pending'  },

        // ── TUẦN 4: 29/06 - 05/07/2026 ──
        { id:'SC029', staff:'Nguyễn Văn An', code:'E01', date:'29/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'pending'  },
        { id:'SC030', staff:'Trần Thị Bình', code:'E02', date:'29/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'pending'  },
        { id:'SC031', staff:'Lê Văn Cường',  code:'E03', date:'30/06/2026', time:'15:00-22:00', counter:'Quầy 03', status:'pending'  },
        { id:'SC032', staff:'Phạm Thị Dung', code:'E04', date:'30/06/2026', time:'07:00-15:00', counter:'Quầy 04', status:'pending'  },
        { id:'SC033', staff:'Hoàng Văn Em',  code:'E05', date:'01/07/2026', time:'07:00-15:00', counter:'Quầy 05', status:'pending'  },
        { id:'SC034', staff:'Nguyễn Văn An', code:'E01', date:'01/07/2026', time:'15:00-22:00', counter:'Quầy 01', status:'pending'  },
        { id:'SC035', staff:'Trần Thị Bình', code:'E02', date:'02/07/2026', time:'15:00-22:00', counter:'Quầy 02', status:'pending'  },
        { id:'SC036', staff:'Lê Văn Cường',  code:'E03', date:'03/07/2026', time:'07:00-15:00', counter:'Quầy 03', status:'pending'  },
        { id:'SC037', staff:'Phạm Thị Dung', code:'E04', date:'04/07/2026', time:'07:00-15:00', counter:'Quầy 04', status:'pending'  },
        { id:'SC038', staff:'Hoàng Văn Em',  code:'E05', date:'05/07/2026', time:'15:00-22:00', counter:'Quầy 05', status:'pending'  },

        // ── TUẦN TRƯỚC 1: 08/06 - 14/06/2026 ──
        { id:'SC039', staff:'Nguyễn Văn An', code:'E01', date:'08/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC040', staff:'Trần Thị Bình', code:'E02', date:'08/06/2026', time:'15:00-22:00', counter:'Quầy 02', status:'approved' },
        { id:'SC041', staff:'Lê Văn Cường',  code:'E03', date:'09/06/2026', time:'07:00-15:00', counter:'Quầy 03', status:'approved' },
        { id:'SC042', staff:'Phạm Thị Dung', code:'E04', date:'09/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC043', staff:'Hoàng Văn Em',  code:'E05', date:'10/06/2026', time:'07:00-15:00', counter:'Quầy 05', status:'approved' },
        { id:'SC044', staff:'Nguyễn Văn An', code:'E01', date:'11/06/2026', time:'15:00-22:00', counter:'Quầy 01', status:'approved' },
        { id:'SC045', staff:'Trần Thị Bình', code:'E02', date:'12/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC046', staff:'Lê Văn Cường',  code:'E03', date:'13/06/2026', time:'15:00-22:00', counter:'Quầy 03', status:'approved' },
        { id:'SC047', staff:'Phạm Thị Dung', code:'E04', date:'14/06/2026', time:'07:00-15:00', counter:'Quầy 04', status:'approved' },
        { id:'SC048', staff:'Hoàng Văn Em',  code:'E05', date:'14/06/2026', time:'15:00-22:00', counter:'Quầy 05', status:'approved' },

        // ── TUẦN TRƯỚC 2: 01/06 - 07/06/2026 ──
        { id:'SC049', staff:'Nguyễn Văn An', code:'E01', date:'01/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC050', staff:'Trần Thị Bình', code:'E02', date:'02/06/2026', time:'07:00-15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC051', staff:'Lê Văn Cường',  code:'E03', date:'03/06/2026', time:'15:00-22:00', counter:'Quầy 03', status:'approved' },
        { id:'SC052', staff:'Phạm Thị Dung', code:'E04', date:'04/06/2026', time:'07:00-15:00', counter:'Quầy 04', status:'approved' },
        { id:'SC053', staff:'Hoàng Văn Em',  code:'E05', date:'05/06/2026', time:'07:00-15:00', counter:'Quầy 05', status:'approved' },
        { id:'SC054', staff:'Nguyễn Văn An', code:'E01', date:'06/06/2026', time:'15:00-22:00', counter:'Quầy 01', status:'approved' },
        { id:'SC055', staff:'Trần Thị Bình', code:'E02', date:'07/06/2026', time:'15:00-22:00', counter:'Quầy 02', status:'approved' },
      ];

      // CA LÀM VIỆC (workShifts) — dùng cho màn hình "Quản lý ca làm việc"
      // Sinh ra từ các lịch ca đã được duyệt (approved).
      // checkinTime / checkoutTime: giờ nhân viên thực tế chấm công qua app.
      // Khi NV chấm công → status = 'checkedin', chờ quản lý xác nhận.
      let workShifts = [];

      const attData = [
        { id:'E01', name:'Nguyễn Văn An', ca:'CA-001', date:'16/06', schedule:'07:00-15:00', checkin:'07:03',  checkout:'15:02', hours:8.0,  ex:'ok' },
        { id:'E02', name:'Trần Thị Bình', ca:'CA-002', date:'16/06', schedule:'15:00-22:00', checkin:'15:12',  checkout:'22:05', hours:6.9,  ex:'late' },
        { id:'E03', name:'Lê Văn Cường',  ca:'CA-003', date:'16/06', schedule:'07:00-15:00', checkin:'07:00',  checkout:'15:00', hours:8.0,  ex:'ok' },
        { id:'E04', name:'Phạm Thị Dung', ca:'CA-004', date:'17/06', schedule:'14:00-22:00', checkin:'14:05',  checkout:'22:00', hours:7.9,  ex:'ok' },
        { id:'E05', name:'Hoàng Văn Em',  ca:'CA-005', date:'17/06', schedule:'07:00-15:00', checkin:'—',      checkout:'—',     hours:null, ex:'absent' },
        { id:'E01', name:'Nguyễn Văn An', ca:'CA-006', date:'18/06', schedule:'07:00-15:00', checkin:'07:00',  checkout:'15:00', hours:8.0,  ex:'ok' },
        { id:'E02', name:'Trần Thị Bình', ca:'CA-007', date:'18/06', schedule:'15:00-22:00', checkin:'15:08',  checkout:'—',     hours:null, ex:'forgot' },
        { id:'E03', name:'Lê Văn Cường',  ca:'CA-008', date:'19/06', schedule:'07:00-15:00', checkin:'07:02',  checkout:'15:01', hours:8.0,  ex:'ok' },
        { id:'E01', name:'Nguyễn Văn An', ca:'CA-009', date:'20/06', schedule:'15:00-22:00', checkin:'15:00',  checkout:'22:00', hours:7.0,  ex:'ok' },
        { id:'E02', name:'Trần Thị Bình', ca:'CA-010', date:'21/06', schedule:'07:00-15:00', checkin:'06:58',  checkout:'15:00', hours:8.0,  ex:'ok' },
        { id:'E04', name:'Phạm Thị Dung', ca:'CA-011', date:'21/06', schedule:'07:00-15:00', checkin:'07:05',  checkout:'15:00', hours:7.9,  ex:'ok' },
        { id:'E03', name:'Lê Văn Cường',  ca:'CA-012', date:'21/06', schedule:'15:00-22:00', checkin:'—',      checkout:'—',     hours:null, ex:'absent' },
      ];

      const tierRank = { 'Thành viên':0,'Bạc':1,'Vàng':2,'Kim Cương':3 };
      const tierBadge = { 'Kim Cương':'bg-blue-100 text-blue-700','Vàng':'bg-yellow-100 text-yellow-700','Bạc':'bg-slate-200 text-slate-700','Thành viên':'bg-slate-100 text-slate-500' };
      const tierGradient = { 'Kim Cương':'bg-gradient-to-br from-blue-400 to-indigo-600','Vàng':'bg-gradient-to-br from-yellow-400 to-amber-600','Bạc':'bg-gradient-to-br from-gray-300 to-gray-500','Thành viên':'bg-gradient-to-br from-slate-400 to-slate-600' };
      const tierDiscount = { 'Kim Cương':0.05,'Vàng':0.03,'Bạc':0.01,'Thành viên':0 };

      let revDayData = [];
      let revDayLabels = [];

      let revMonth30Data = [];
      let revMonth30Labels = [];

      let revYearData = [];
      let revYearLabels = [];
      let revMode = 'day';

      // ── Chi tiết từng kỳ — dùng cho modal click cột chart ──
      const revDetailDay = [
        { label:'T2 15/6/2026', rev:10800000,  orders:146, refunds:4,  categories:[{name:'Thực phẩm',pct:40},{name:'Đồ uống',pct:24},{name:'Gia dụng',pct:16},{name:'Mỹ phẩm',pct:12},{name:'Khác',pct:8}], topCusts:[{name:'Nguyễn Lan Anh',total:1260000},{name:'Phạm Thu Hà',total:840000}] },
        { label:'T3 16/6/2026', rev:12500000,  orders:169, refunds:5,  categories:[{name:'Thực phẩm',pct:36},{name:'Đồ uống',pct:25},{name:'Gia dụng',pct:20},{name:'Mỹ phẩm',pct:11},{name:'Khác',pct:8}], topCusts:[{name:'Lê Thị Bảo Châu',total:980000},{name:'Trần Minh Khoa',total:720000}] },
        { label:'T4 17/6/2026', rev:9200000,   orders:124, refunds:6,  categories:[{name:'Thực phẩm',pct:42},{name:'Đồ uống',pct:20},{name:'Gia dụng',pct:17},{name:'Mỹ phẩm',pct:13},{name:'Khác',pct:8}], topCusts:[{name:'Phạm Thu Hà',total:650000}] },
        { label:'T5 18/6/2026', rev:11400000,  orders:154, refunds:3,  categories:[{name:'Thực phẩm',pct:38},{name:'Đồ uống',pct:22},{name:'Gia dụng',pct:19},{name:'Mỹ phẩm',pct:14},{name:'Khác',pct:7}], topCusts:[{name:'Hoàng Văn Đức',total:890000},{name:'Nguyễn Lan Anh',total:760000}] },
        { label:'T6 19/6/2026', rev:14100000,  orders:190, refunds:7,  categories:[{name:'Thực phẩm',pct:35},{name:'Đồ uống',pct:28},{name:'Gia dụng',pct:18},{name:'Mỹ phẩm',pct:12},{name:'Khác',pct:7}], topCusts:[{name:'Nguyễn Lan Anh',total:1540000},{name:'Lê Thị Bảo Châu',total:1100000},{name:'Đinh Quốc Hùng',total:780000}] },
        { label:'T7 20/6/2026', rev:10756000,  orders:145, refunds:4,  categories:[{name:'Thực phẩm',pct:39},{name:'Đồ uống',pct:23},{name:'Gia dụng',pct:17},{name:'Mỹ phẩm',pct:14},{name:'Khác',pct:7}], topCusts:[{name:'Trần Minh Khoa',total:820000}] },
        { label:'CN 21/6/2026', rev:13478000,  orders:182, refunds:7,  categories:[{name:'Thực phẩm',pct:38},{name:'Đồ uống',pct:22},{name:'Gia dụng',pct:18},{name:'Mỹ phẩm',pct:14},{name:'Khác',pct:8}], topCusts:[{name:'Nguyễn Lan Anh',total:1350000},{name:'Phạm Thu Hà',total:980000}] },
      ];
      const revDetailWeek = [
        { label:'Tuần 47 (18-24/11/2025)', rev:72400000,  orders:978,  refunds:28, categories:[{name:'Thực phẩm',pct:38},{name:'Đồ uống',pct:22},{name:'Gia dụng',pct:18},{name:'Mỹ phẩm',pct:14},{name:'Khác',pct:8}], topCusts:[{name:'Nguyễn Lan Anh',total:4200000},{name:'Phạm Thu Hà',total:3100000}] },
        { label:'Tuần 48 (25/11-1/12/2025)', rev:81200000, orders:1097, refunds:31, categories:[{name:'Thực phẩm',pct:36},{name:'Đồ uống',pct:24},{name:'Gia dụng',pct:19},{name:'Mỹ phẩm',pct:13},{name:'Khác',pct:8}], topCusts:[{name:'Lê Thị Bảo Châu',total:5600000},{name:'Nguyễn Lan Anh',total:4900000}] },
        { label:'Tuần 49 (2-8/12/2025)',    rev:68900000,  orders:930,  refunds:35, categories:[{name:'Thực phẩm',pct:40},{name:'Đồ uống',pct:21},{name:'Gia dụng',pct:17},{name:'Mỹ phẩm',pct:14},{name:'Khác',pct:8}], topCusts:[{name:'Phạm Thu Hà',total:3800000}] },
        { label:'Tuần 50 (9-15/12/2025)',   rev:79500000,  orders:1073, refunds:29, categories:[{name:'Thực phẩm',pct:37},{name:'Đồ uống',pct:23},{name:'Gia dụng',pct:20},{name:'Mỹ phẩm',pct:12},{name:'Khác',pct:8}], topCusts:[{name:'Nguyễn Lan Anh',total:5100000},{name:'Hoàng Văn Đức',total:3200000}] },
        { label:'Tuần 51 (16-22/12/2025)',  rev:85100000,  orders:1149, refunds:38, categories:[{name:'Thực phẩm',pct:35},{name:'Đồ uống',pct:26},{name:'Gia dụng',pct:18},{name:'Mỹ phẩm',pct:13},{name:'Khác',pct:8}], topCusts:[{name:'Nguyễn Lan Anh',total:6200000},{name:'Lê Thị Bảo Châu',total:4900000},{name:'Trần Minh Khoa',total:3800000}] },
        { label:'Tuần 1 (23-29/5/2026)',    rev:77300000,  orders:1044, refunds:32, categories:[{name:'Thực phẩm',pct:39},{name:'Đồ uống',pct:22},{name:'Gia dụng',pct:18},{name:'Mỹ phẩm',pct:13},{name:'Khác',pct:8}], topCusts:[{name:'Phạm Thu Hà',total:4400000},{name:'Đinh Quốc Hùng',total:3100000}] },
        { label:'Tuần 2 (30/5-6/6/2026)',   rev:82300000,  orders:1111, refunds:36, categories:[{name:'Thực phẩm',pct:38},{name:'Đồ uống',pct:22},{name:'Gia dụng',pct:18},{name:'Mỹ phẩm',pct:14},{name:'Khác',pct:8}], topCusts:[{name:'Nguyễn Lan Anh',total:5800000},{name:'Lê Thị Bảo Châu',total:4100000}] },
      ];
      const revDetailMonth = [
        { label:'Tháng 12/2025', rev:310000000, orders:4185, refunds:128, categories:[{name:'Thực phẩm',pct:37},{name:'Đồ uống',pct:23},{name:'Gia dụng',pct:19},{name:'Mỹ phẩm',pct:13},{name:'Khác',pct:8}], topCusts:[{name:'Nguyễn Lan Anh',total:18500000},{name:'Lê Thị Bảo Châu',total:14200000},{name:'Phạm Thu Hà',total:11800000}] },
        { label:'Tháng 1/2026',  rev:285000000, orders:3851, refunds:112, categories:[{name:'Thực phẩm',pct:40},{name:'Đồ uống',pct:21},{name:'Gia dụng',pct:18},{name:'Mỹ phẩm',pct:13},{name:'Khác',pct:8}], topCusts:[{name:'Nguyễn Lan Anh',total:15200000},{name:'Phạm Thu Hà',total:9800000}] },
        { label:'Tháng 2/2026',  rev:342000000, orders:4622, refunds:145, categories:[{name:'Thực phẩm',pct:36},{name:'Đồ uống',pct:25},{name:'Gia dụng',pct:19},{name:'Mỹ phẩm',pct:12},{name:'Khác',pct:8}], topCusts:[{name:'Lê Thị Bảo Châu',total:21000000},{name:'Nguyễn Lan Anh',total:19500000},{name:'Hoàng Văn Đức',total:12300000}] },
        { label:'Tháng 3/2026',  rev:298000000, orders:4027, refunds:119, categories:[{name:'Thực phẩm',pct:39},{name:'Đồ uống',pct:22},{name:'Gia dụng',pct:18},{name:'Mỹ phẩm',pct:13},{name:'Khác',pct:8}], topCusts:[{name:'Phạm Thu Hà',total:13400000},{name:'Trần Minh Khoa',total:10200000}] },
        { label:'Tháng 4/2026',  rev:365000000, orders:4932, refunds:162, categories:[{name:'Thực phẩm',pct:36},{name:'Đồ uống',pct:24},{name:'Gia dụng',pct:19},{name:'Mỹ phẩm',pct:13},{name:'Khác',pct:8}], topCusts:[{name:'Nguyễn Lan Anh',total:24100000},{name:'Lê Thị Bảo Châu',total:18900000},{name:'Phạm Thu Hà',total:14500000}] },
        { label:'Tháng 5/2026',  rev:321000000, orders:4338, refunds:134, categories:[{name:'Thực phẩm',pct:38},{name:'Đồ uống',pct:22},{name:'Gia dụng',pct:19},{name:'Mỹ phẩm',pct:13},{name:'Khác',pct:8}], topCusts:[{name:'Lê Thị Bảo Châu',total:16800000},{name:'Nguyễn Lan Anh',total:16200000}] },
        { label:'Tháng 6/2026',  rev:388000000, orders:5243, refunds:178, categories:[{name:'Thực phẩm',pct:38},{name:'Đồ uống',pct:22},{name:'Gia dụng',pct:18},{name:'Mỹ phẩm',pct:14},{name:'Khác',pct:8}], topCusts:[{name:'Nguyễn Lan Anh',total:28400000},{name:'Lê Thị Bảo Châu',total:21600000},{name:'Phạm Thu Hà',total:16900000}] },
      ];

      let pendingUpgrades = [];
      let tierHistory = [];
      let currentProfileId = null;
      let cart = [];
      let shiftOpen = false;
      let posOpenShiftCash = 0;
      let shiftSales = [];   // doanh thu các đơn của CA HIỆN TẠI (không lẫn dữ liệu mẫu)
      let csHistData = [];   // lịch sử mua hàng (thật) của KH đang xem hồ sơ
      let payMethod = 'cash';
      let posCustomer = null;
      let punchCheckedIn = false;
      let punchTime = null;
      let currentRole = null;
      let chartInstances = {};

      let staffInfo = {
        id:'—',
        maNV:'—',
        name:'Nhân viên',
        phone:'—',
        email:'—',
        gender:'—',
        age:'—',
        store:'—',
        addr:'—'
      };
      let shiftData = {};
      const TODAY_STR = new Date().toISOString().slice(0,10);
      let selectedDay = TODAY_STR;

      const _todayObj = new Date();
      let monthView = {
        y: _todayObj.getFullYear(),
        m: _todayObj.getMonth()
      };
      let selectedMonthDay = null;
      let returnOrder = null;

      // =========================================================
      // UTILS
      // =========================================================
      function fmt(n){ return Number(n).toLocaleString('vi-VN')+'  đ'; }
      function fmtDate(iso){ if(!iso) return '—'; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }
      function dateKey(y,m,d){ return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

      function toast(msg, type='success'){
        const c = document.getElementById('toastContainer');
        const colors = { success:'bg-green-600', error:'bg-red-600', warning:'bg-amber-500', info:'bg-slate-700' };
        const icons  = { success:'check-circle', error:'x-circle', warning:'alert-triangle', info:'info' };
        const div = document.createElement('div');
        div.className = `toast flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm shadow-lg ${colors[type]||colors.info}`;
        div.innerHTML = `<i data-lucide="${icons[type]||'info'}" class="w-4 h-4 shrink-0"></i><span>${msg}</span>`;
        c.appendChild(div);
        lucide.createIcons({ nodes:[div] });
        setTimeout(()=>{ div.style.opacity='0'; div.style.transition='opacity .3s'; setTimeout(()=>div.remove(),300); },3000);
      }

      function openModal(id){
        if(id==='modalCloseShift'){ try{ renderCloseShiftPreview(); }catch(e){} }
        document.getElementById(id).classList.remove('hidden');
      }
      function closeModal(id){ document.getElementById(id).classList.add('hidden'); }

      function stBadge(st){
        const m = { paid:['Đã thanh toán','bg-green-100 text-green-700'], refund:['Đã hoàn','bg-indigo-100 text-indigo-700'], cancel:['Đã hủy','bg-red-100 text-red-700'] };
        const x = m[st]||m.paid;
        return `<span class="text-xs px-2 py-1 rounded-full font-medium ${x[1]}">${x[0]}</span>`;
      }

      function exBadge(ex){
        const m = {
          confirmed:'<span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Đã xác nhận</span>',
          ok:'<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Đúng giờ</span>',
          late:'<span class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Đi trễ</span>',
          forgot:'<span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Quên check-out</span>',
          absent:'<span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Vắng mặt</span>',
          waiting:'<span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Chờ chấm công</span>'
        };
        return m[ex] || '';
      }

      function shiftStatusBadge(s){
        const m = {
          pending:   '<span class="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">Dự kiến</span>',
          approved:  '<span class="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">Đã duyệt</span>',
          checkedin: '<span class="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">⏳ Chưa xác nhận</span>',
          done:      '<span class="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">Hoàn thành</span>',
          absent:    '<span class="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium">Vắng mặt</span>',
          rejected:  '<span class="text-xs px-2.5 py-1 rounded-full bg-red-200 text-red-800 font-medium">Từ chối</span>',
        };
        return m[s]||'';
      }

      function tierForPoints(p){
        if(p>=10000) return 'Kim Cương';
        if(p>=1000)  return 'Vàng';
        if(p>=100)   return 'Bạc';
        return 'Thành viên';
      }

      function payMethodLabel(pm){
        return { cash:'Tiền mặt', qr:'QR / Chuyển khoản', card:'Thẻ ngân hàng' }[pm]||pm;
      }

      // =========================================================
      // AUTH
      // =========================================================
      function togglePass(){
        const i = document.getElementById('loginPass');
        i.type = i.type==='password'?'text':'password';
      }

      function fillDemo(user, pin){
        document.getElementById('loginUser').value = user;
        document.getElementById('loginPass').value = pin;
      }

      // Chế độ đăng nhập: 'pos' (mã NV + PIN máy) | 'system' (tài khoản + mật khẩu cá nhân)
      window.loginMode = 'pos';
      function setLoginMode(mode){
        window.loginMode = mode;
        const tabPos = document.getElementById('tabPos');
        const tabSys = document.getElementById('tabSystem');
        const uLabel = document.getElementById('loginUserLabel');
        const pLabel = document.getElementById('loginPassLabel');
        const uInput = document.getElementById('loginUser');
        const pInput = document.getElementById('loginPass');
        const btnTxt = document.getElementById('loginBtnText');
        document.getElementById('loginErr').classList.add('hidden');
        const base = 'rounded-lg py-2.5 text-sm font-bold transition-colors ';
        const active = 'bg-white shadow text-slate-900';
        const idle   = 'text-slate-500';
        if(mode==='pos'){
          tabPos.className = base+active; tabSys.className = base+idle;
          uLabel.textContent = 'Mã nhân viên';
          pLabel.textContent = 'Mã PIN máy POS';
          uInput.placeholder = 'Mã nhân viên, vd: thungan01';
          pInput.placeholder = 'PIN máy POS của cửa hàng';
          btnTxt.textContent = 'Vào ca bán hàng';
        } else {
          tabPos.className = base+idle; tabSys.className = base+active;
          uLabel.textContent = 'Tài khoản nhân viên';
          pLabel.textContent = 'Mật khẩu cá nhân';
          uInput.placeholder = 'Tài khoản, vd: quanly01';
          pInput.placeholder = 'Mật khẩu của bạn';
          btnTxt.textContent = 'Đăng nhập hệ thống';
        }
        uInput.value=''; pInput.value='';
      }

      async function doLogin(){
        const user = document.getElementById('loginUser').value.trim();
        const pass = document.getElementById('loginPass').value.trim();
        const err  = document.getElementById('loginErr');
        err.classList.add('hidden');
        if(!user || !pass){
          err.textContent = 'Vui lòng nhập đầy đủ thông tin.';
          err.classList.remove('hidden'); return;
        }
        try {
          if(window.loginMode === 'pos'){
            // --- Vào ca bán hàng: mã NV + PIN máy POS của cửa hàng ---
            const res = await fetch('/api/auth/login-pos', {
              method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ taiKhoan:user, maPIN:pass })
            });
            const data = await res.json().catch(()=>({}));
            if(!res.ok){ err.textContent = data.error||'Đăng nhập POS thất bại.'; err.classList.remove('hidden'); return; }
            window.currentUser = data;
            window.currentQuay = { maQuay:data.maQuay, tenQuay:data.tenQuay };
            currentRole = 'thu_ngan';                 // màn POS dùng workspace thu_ngan
            document.getElementById('login').classList.add('hidden');
            showOpenShiftGate(data);                  // hiện cổng mở ca (nền)
            // Kiểm tra NV có ca chưa đóng không
            let openShift = null;
            try{ openShift = await apiGet('/shifts/sales/open?maNV='+encodeURIComponent(data.maNV)); }catch(e){}
            if(openShift && openShift.maCaBH){
              promptCloseShift(openShift);            // bắt đóng ca trước
            }
            return;
          }
          // --- Chấm công / Hệ thống: tài khoản + mật khẩu cá nhân ---
          const res = await fetch('/api/auth/login', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ taiKhoan:user, matKhau:pass })
          });
          const data = await res.json().catch(()=>({}));
          if(!res.ok){ err.textContent = data.error||'Sai tài khoản hoặc mật khẩu.'; err.classList.remove('hidden'); return; }
          window.currentUser = data;
          currentRole = ({ QuanLy:'quan_ly', NVThuNgan:'cham_cong', NVCSKH:'cskh' })[data.vaiTro];
          if(!currentRole){ err.textContent = 'Vai trò không được hỗ trợ đăng nhập ở đây.'; err.classList.remove('hidden'); return; }
          document.getElementById('login').classList.add('hidden');
          document.getElementById('app-'+currentRole).classList.remove('hidden');
          document.getElementById('app-'+currentRole).classList.add('flex');
          initRole(currentRole);
        } catch(ex){
          err.textContent = 'Không kết nối được máy chủ: ' + ex.message;
          err.classList.remove('hidden');
        }
      }

      function logout(){
        ['quan_ly','thu_ngan','cham_cong','cskh'].forEach(r=>{
          const el = document.getElementById('app-'+r);
          if(el){ el.classList.add('hidden'); el.classList.remove('flex'); }
        });
        const gate = document.getElementById('posOpenShiftGate');
        if(gate){ gate.classList.add('hidden'); gate.classList.remove('flex'); }
        document.getElementById('login').classList.remove('hidden');
        document.getElementById('loginUser').value='';
        document.getElementById('loginPass').value='';
        document.getElementById('loginErr').classList.add('hidden');
        cart=[];
        posCustomer=null;
        currentRole=null;
        shiftOpen=false;
        posOpenShiftCash=0;
      }

      // =========================================================
      // NAVIGATION
      // =========================================================
      function go(role, screen, el){
        const container = document.getElementById('app-'+role);
        container.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
        const target = container.querySelector('[data-screen="'+screen+'"]');
        if(target) { target.classList.add('active'); target.classList.add('fade-in'); }
        // Sidebar active
        if(el){
          const isNavitem = el.classList.contains('navitem');
          const isMbtab   = el.classList.contains('mbtab');
          if(isNavitem){
            container.querySelectorAll('.navitem').forEach(n=>n.classList.remove('active-nav'));
            el.classList.add('active-nav');
          }
          if(isMbtab){
            container.querySelectorAll('.mbtab').forEach(n=>n.classList.remove('active-tab'));
            el.classList.add('active-tab');
          }
        }
        // Crumb update for CSKH
        if(role==='cskh'){
          const crumbMap = { 'cs-list':'Danh sách KH','cs-profile':'Hồ sơ thành viên','cs-tier':'Nâng hạng' };
          const crumb = document.getElementById('csCrumb');
          if(crumb) crumb.textContent = crumbMap[screen]||screen;
        }
        // Init charts/data on demand
        if(screen==='mgr-dashboard') initDashCharts();
        if(screen==='mgr-revenue')   loadRevenue();
        if(screen==='mgr-shifts')    loadWorkShifts();
        if(screen==='mgr-attendance'){ loadWorkShifts(); }
        if(screen==='mgr-orders')    { loadMgrOrders(); loadPendingRefunds(); }
        if(screen==='mgr-customers') renderMgrCustomers(customers);
        if(screen==='mgr-week')      renderWeekGrid();
        if(screen==='cs-list')       renderCsCustomers(customers);
        if(screen==='cs-tier')       renderUpgrades();
        lucide.createIcons();
      }

      // =========================================================
      // CLOCK
      // =========================================================
      function updateClocks(){
        const now = new Date();
        const hms = now.toTimeString().slice(0,8);
        document.querySelectorAll('.clock').forEach(el=>{ el.textContent = hms; });
      }
      setInterval(updateClocks,1000);
      updateClocks();

      // =========================================================
      // INIT per ROLE
      // =========================================================
      function initRole(role){
        refreshUpgrades();
        if(role==='quan_ly'){
          setTimeout(()=>{
            initDashCharts();
            renderRecentOrders();
            renderStaffPerf();
            renderShiftList();
            renderAttendance();
            renderManagerProfile();
            renderTopBranchSelect();
            loadWorkShifts();
            loadMgrOrders();
            loadPendingRefunds();
            renderMgrCustomers(customers);
            renderCSKHProfile();
            loadCustomers().then(()=>renderMgrCustomers(customers));
            renderWeekGrid();
            updateMgrNotifications();
            lucide.createIcons();
          },50);
        }
        if(role==='thu_ngan'){
          renderCartUI();
          renderProductGrid();
          loadPosOrders();
          renderPosCustomerList(customers);
          loadCustomers().then(()=>renderPosCustomerList(customers));
          lucide.createIcons();
        }
        if(role==='cskh'){
          renderCsCustomers(customers);
          renderUpgrades();
          renderTierHistory();
          loadTierHistory();
          loadCustomers().then(()=>{ renderCsCustomers(customers); refreshUpgrades(); renderUpgrades(); });
          lucide.createIcons();
        }
        if(role==='cham_cong'){
          const u = window.currentUser || {};
          staffInfo = {
            id:    u.maNV || u.taiKhoan || '—',
            maNV:  u.maNV || '—',
            name:  u.tenNV || u.taiKhoan || '—',
            phone: u.soDienThoai || '—',
            email: u.email || '—',
            gender:'—',
            age:'—',
            store: u.tenChiNhanh || u.maChiNhanh || '—',
            addr:  '—'
          };

          renderStaffProfile();
          loadMyWorkShifts();
          lucide.createIcons();
        }
      }

      function getInitials(name){
        if(!name) return 'QL';

        const parts = name.trim().split(/\s+/);
        if(parts.length === 1){
          return parts[0].slice(0,2).toUpperCase();
        }

        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
      }

      function renderManagerProfile(){
        const u = window.currentUser || {};

        const name = u.tenNV || u.name || u.taiKhoan || 'Quản lý';
        const role = u.vaiTro === 'QuanLy' ? 'Quản lý cửa hàng' : (u.vaiTro || 'Nhân viên');
        const branch = u.tenChiNhanh || branchNameFromCode(u.maChiNhanh) || 'Chi nhánh';

        const setText = (id, value) => {
          const el = document.getElementById(id);
          if(el) el.textContent = value;
        };

        setText('mgrSidebarName', name);
        setText('mgrSidebarRole', role);
        setText('mgrSidebarBranch', branch);
        setText('mgrAvatar', getInitials(name));
      }

      function branchNameFromCode(maChiNhanh){
        const map = {
          CN001: 'Chi nhánh Cầu Giấy',
          CN002: 'Chi nhánh Đống Đa',
          CN003: 'Chi nhánh Hoàn Kiếm'
        };

        return map[maChiNhanh] || maChiNhanh || '';
      }

      function renderTopBranchSelect(){
        const u = window.currentUser || {};
        const sel = document.getElementById('branchSelect') 
                || document.getElementById('mgrBranch');

        if(!sel) return;

        if(u.maChiNhanh){
          sel.value = u.maChiNhanh;
        }

        // Nếu value HTML của bạn là q1/q7 thì dùng đoạn này thay cho dòng trên:
        // if(u.maChiNhanh === 'CN001') sel.value = 'q1';
        // if(u.maChiNhanh === 'CN002') sel.value = 'q7';
      }

      // ===== Quản lý cũng là nhân viên: mở màn CHẤM CÔNG bằng chính tài khoản QL =====
      let attendanceFromManager = false;
      function openMyAttendance(){
        const u = window.currentUser || {};
        if(!u.maNV){ toast('Không xác định được tài khoản đang đăng nhập','error'); return; }
        attendanceFromManager = true;
        staffInfo = {
          id:    u.maNV || '—',
          maNV:  u.maNV || '—',
          name:  u.tenNV || u.taiKhoan || '—',
          phone: u.soDienThoai || '—',
          email: u.email || '—',
          gender:'—', age:'—',
          store: u.tenChiNhanh || u.maChiNhanh || '—',
          addr:'—'
        };
        const mg = document.getElementById('app-quan_ly');
        mg.classList.add('hidden'); mg.classList.remove('flex');
        const cc = document.getElementById('app-cham_cong');
        cc.classList.remove('hidden'); cc.classList.add('flex');
        const back = document.getElementById('ccBackMgr'); if(back) back.classList.remove('hidden');
        renderStaffProfile();
        loadMyWorkShifts();
        // về tab Chấm công cho tiện
        const cont = cc;
        cont.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
        const punch = cont.querySelector('[data-screen="mb-punch"]');
        if(punch) punch.classList.add('active');
        cont.querySelectorAll('.mbtab').forEach(n=>n.classList.remove('active-tab'));
        lucide.createIcons();
      }
      function backToManager(){
        attendanceFromManager = false;
        const cc = document.getElementById('app-cham_cong');
        cc.classList.add('hidden'); cc.classList.remove('flex');
        const back = document.getElementById('ccBackMgr'); if(back) back.classList.add('hidden');
        const mg = document.getElementById('app-quan_ly');
        mg.classList.remove('hidden'); mg.classList.add('flex');
        lucide.createIcons();
      }

      // =========================================================
      // CHARTS
      // =========================================================
      function destroyChart(id){
        if(chartInstances[id]){ chartInstances[id].destroy(); delete chartInstances[id]; }
      }

      function initDashCharts(){
        destroyChart('dashChart');

        const ctx = document.getElementById('dashChart');
        if(!ctx) return;

        const labels = revDayLabels || [];
        const data = revDayData || [];

        const total = data.reduce((s,v)=>s + Number(v || 0), 0);

        const totalEl = document.getElementById('dashChartTotal');
        if(totalEl) totalEl.textContent = fmt(total);

        const rangeEl = document.getElementById('dashChartRange');
        if(rangeEl){
          rangeEl.textContent = labels.length
            ? labels[0] + ' – ' + labels[labels.length - 1]
            : 'Chưa có dữ liệu';
        }

        chartInstances['dashChart'] = new Chart(ctx,{
          type:'bar',
          data:{
            labels,
            datasets:[{
              label:'Doanh thu',
              data,
              backgroundColor:'rgba(16,185,129,0.7)',
              borderRadius:6,
              hoverBackgroundColor:'#059669'
            }]
          },
          options:{
            responsive:true,
            plugins:{
              legend:{ display:false },
              tooltip:{
                callbacks:{
                  label:(i)=>'Doanh thu: '+fmt(i.raw)
                }
              }
            },
            scales:{
              y:{
                ticks:{
                  callback:(v)=>(v/1000000).toFixed(1)+'M'
                },
                grid:{ color:'#f1f5f9' }
              },
              x:{ grid:{ display:false } }
            }
          }
        });
      }

      // Click cột biểu đồ Dashboard → mở modal chi tiết ngày
      // Tái sử dụng modal #modalRevDetail (cùng cấu trúc với báo cáo doanh thu)
      function showDashDetail(index){
        const details = window.dashDayDetails;
        if(!details || !details[index]) return;
        const d = details[index];

        // Set mode label
        const modeEl = document.getElementById('rdMode');
        if(modeEl) modeEl.textContent = 'CHI TIẾT NGÀY — DASHBOARD';

        document.getElementById('rdLabel').textContent    = d.label;
        document.getElementById('rdRev').textContent      = fmt(d.rev);
        document.getElementById('rdOrders').textContent   = d.orders + ' đơn';
        document.getElementById('rdAvg').textContent      = fmt(Math.round(d.rev / d.orders));
        document.getElementById('rdRefund').textContent   = d.refundPct + '%';
        const refundCountEl = document.getElementById('rdRefundCount');
        if(refundCountEl){
          const refundCount = Math.round(d.orders * d.refundPct / 100);
          refundCountEl.textContent = `~${refundCount} đơn hoàn`;
        }

        // Thêm info KH mới + NV vào phần KPI (nếu slot trống)
        // Cập nhật tooltip phụ bên cạnh rdOrders nếu có element
        const extraEl = document.getElementById('rdDashExtra');
        if(extraEl){
          extraEl.classList.remove('hidden');
          extraEl.innerHTML = `
            <div class="flex gap-4 text-sm mt-1">
              <span class="flex items-center gap-1 text-slate-500"><i data-lucide="user-plus" class="w-3.5 h-3.5 text-amber-500"></i> ${d.newCust} KH mới</span>
              <span class="flex items-center gap-1 text-slate-500"><i data-lucide="users" class="w-3.5 h-3.5 text-indigo-500"></i> ${d.staff} NV làm việc</span>
            </div>`;
          lucide.createIcons();
        }

        // Cơ cấu danh mục
        const catEl = document.getElementById('rdCats');
        if(catEl){
          catEl.innerHTML = d.cats.map(cat=>`
            <div class="flex items-center gap-2 text-sm">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${cat.col}"></span>
              <span class="flex-1 text-slate-600">${cat.cat}</span>
              <span class="font-semibold text-slate-800 w-8 text-right">${cat.pct}%</span>
              <div class="w-24 bg-slate-100 rounded-full h-1.5">
                <div class="h-1.5 rounded-full transition-all" style="width:${cat.pct}%;background:${cat.col}"></div>
              </div>
            </div>`).join('');
        }

        // Khách hàng nổi bật
        const starEl = document.getElementById('rdStars');
        if(starEl){
          const tierBadge = {'Kim Cương':'bg-blue-100 text-blue-700','Vàng':'bg-amber-100 text-amber-700','Bạc':'bg-slate-200 text-slate-600'};
          if(!d.topCust || d.topCust.length===0){
            starEl.innerHTML = '<p class="text-sm text-slate-400 italic">Không có khách hàng nổi bật trong ngày này</p>';
          } else {
            starEl.innerHTML = d.topCust.map(c=>`
              <div class="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                    ${c.name.split(' ').pop()[0]}
                  </div>
                  <div>
                    <p class="text-sm font-semibold">${c.name}</p>
                    <span class="text-xs px-1.5 py-0.5 rounded-full ${tierBadge[c.tier]||'bg-slate-100 text-slate-600'}">${c.tier}</span>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-bold text-emerald-600">${fmt(c.total)}</p>
                  <p class="text-xs text-slate-400">${c.pct}% doanh thu ngày</p>
                </div>
              </div>`).join('');
          }
        }

        openModal('modalRevDetail');
        lucide.createIcons();
      }

      // Click cột biểu đồ Báo cáo doanh thu → mở modal chi tiết kỳ
      // Dùng chung modal #modalRevDetail với showDashDetail()
      function showRevDetail(index){
        const arr = revMode==='week' ? revDetailWeek : revMode==='month' ? revDetailMonth : revDetailDay;
        const d = arr && arr[index];
        if(!d) return;
        const palette = ['#10b981','#4f46e5','#f59e0b','#db2777','#94a3b8'];
        const modeLabel = { day:'CHI TIẾT NGÀY', week:'CHI TIẾT TUẦN', month:'CHI TIẾT THÁNG' }[revMode] || 'CHI TIẾT KỲ';

        const modeEl = document.getElementById('rdMode');
        if(modeEl) modeEl.textContent = modeLabel + ' — BÁO CÁO DOANH THU';
        document.getElementById('rdLabel').textContent  = d.label;
        document.getElementById('rdRev').textContent     = fmt(d.rev);
        document.getElementById('rdOrders').textContent  = d.orders + ' đơn';
        document.getElementById('rdAvg').textContent     = fmt(Math.round(d.rev / d.orders));
        const refundPct = (d.refunds / d.orders * 100).toFixed(1);
        document.getElementById('rdRefund').textContent  = refundPct + '%';
        const rc = document.getElementById('rdRefundCount');
        if(rc) rc.textContent = d.refunds + ' đơn hoàn';

        // Báo cáo doanh thu không có ô KH mới / NV → ẩn phần phụ của dashboard
        const extraEl = document.getElementById('rdDashExtra');
        if(extraEl){ extraEl.classList.add('hidden'); extraEl.innerHTML = ''; }

        // Cơ cấu danh mục
        const catEl = document.getElementById('rdCats');
        if(catEl){
          catEl.innerHTML = d.categories.map((c,i)=>{
            const col = palette[i % palette.length];
            return `
            <div class="flex items-center gap-2 text-sm">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${col}"></span>
              <span class="flex-1 text-slate-600">${c.name}</span>
              <span class="font-semibold text-slate-800 w-8 text-right">${c.pct}%</span>
              <div class="w-24 bg-slate-100 rounded-full h-1.5">
                <div class="h-1.5 rounded-full transition-all" style="width:${c.pct}%;background:${col}"></div>
              </div>
            </div>`;
          }).join('');
        }

        // Khách hàng nổi bật (chi tiêu > 5% tổng kỳ)
        const starEl = document.getElementById('rdStars');
        if(starEl){
          const tierBadgeMap = { 'Kim Cương':'bg-blue-100 text-blue-700','Vàng':'bg-amber-100 text-amber-700','Bạc':'bg-slate-200 text-slate-600' };
          const stars = (d.topCusts||[]).filter(c=>c.total/d.rev > 0.05);
          if(stars.length===0){
            starEl.innerHTML = '<p class="text-sm text-slate-400 italic">Không có khách hàng nổi bật trong kỳ này</p>';
          } else {
            starEl.innerHTML = stars.map(c=>{
              const pct = (c.total/d.rev*100).toFixed(1);
              const cust = customers.find(x=>x.name===c.name);
              const tier = cust ? cust.tier : '';
              const badge = tierBadgeMap[tier] || 'bg-slate-100 text-slate-600';
              return `
              <div class="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                    ${c.name.split(' ').pop()[0]}
                  </div>
                  <div>
                    <p class="text-sm font-semibold">${c.name}</p>
                    ${tier?`<span class="text-xs px-1.5 py-0.5 rounded-full ${badge}">${tier}</span>`:''}
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-bold text-emerald-600">${fmt(c.total)}</p>
                  <p class="text-xs text-slate-400">${pct}% doanh thu kỳ</p>
                </div>
              </div>`;
            }).join('');
          }
        }

        openModal('modalRevDetail');
        lucide.createIcons();
      }

      // Alias: màn "Lịch ca tuần" hiển thị bằng renderWeekGrid().
      // Giữ tên cũ để các lời gọi sẵn có không lỗi.
      function renderShiftList(){ renderWeekGrid(); }

      async function setRevMode(mode){
        console.log('REV MODE:', mode);
        revMode = mode;

        document.querySelectorAll('.revtab').forEach(btn=>{
          btn.className = btn.className
            .replace(' bg-white text-slate-800 shadow-sm','')
            .replace(' text-slate-500 hover:text-slate-700','');

          btn.className += ' text-slate-500 hover:text-slate-700';
        });

        let activeId = 'revTabDay';

        if(mode === 'month30'){
          activeId = 'revTabWeek';
          await loadRevenueMonth30();
        }

        if(mode === 'year'){
          activeId = 'revTabMonth';
          await loadRevenueYear();
        }

        const active = document.getElementById(activeId);

        if(active){
          active.className = active.className
            .replace(' text-slate-500 hover:text-slate-700','');

          active.className += ' bg-white text-slate-800 shadow-sm';
        }

        initRevCharts();
      }

      function renderPayMethodReal(){
        const box = document.getElementById('payMethodBox');
        const totalEl = document.getElementById('payMethodTotal');

        if(!box) return;

        const paidOrders = mgrOrders.filter(o => o.st === 'paid' || o.st === 'refund');
        console.log(paidOrders);
        const total = paidOrders.reduce((sum, o) => {
          return sum + Number(o.total || 0);
        }, 0);

        const methods = [
          { key: 'cash', label: 'Tiền mặt', icon: 'banknote' },
          { key: 'qr', label: 'QR / Chuyển khoản', icon: 'qr-code' },
          { key: 'card', label: 'Thẻ ngân hàng', icon: 'credit-card' }
        ];

        box.innerHTML = methods.map(m => {
          const amount = paidOrders
            .filter(o => o.payMethod === m.key)
            .reduce((sum, o) => sum + Number(o.total || 0), 0);

          const percent = total > 0 ? Math.round(amount / total * 100) : 0;

          return `
            <div>
              <div class="flex justify-between text-sm mb-1.5">
                <span class="flex items-center gap-2">
                  <i data-lucide="${m.icon}" class="w-4 h-4 text-emerald-600"></i>
                  ${m.label}
                </span>
                <span class="font-semibold">
                  ${fmt(amount)}
                  <span class="text-slate-400 font-normal">${percent}%</span>
                </span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-emerald-500 h-2 rounded-full" style="width:${percent}%"></div>
              </div>
            </div>
          `;
        }).join('');

        if(totalEl){
          totalEl.textContent = fmt(total);
        }

        lucide.createIcons();
      }

      async function renderTopProductsReal(){
        const tbody = document.getElementById('topProductRows');
        if(!tbody) return;

        const paidOrders = mgrOrders
          .filter(o => o.st === 'paid' || o.st === 'refund')
          .slice(0, 30);

        const map = {};

        for(const o of paidOrders){
          try{
            const d = await apiGet('/orders/' + o.id);

            (d.chiTiet || []).forEach(x=>{
              const id = x.maSanPham;

              if(!map[id]){
                map[id] = {
                  name: x.tenSanPham,
                  qty: 0,
                  revenue: 0
                };
              }

              map[id].qty += Number(x.soLuong || 0);
              map[id].revenue += Number(x.thanhTien || 0);
            });
          }catch(e){
            console.log('Lỗi tải chi tiết đơn', o.id, e.message);
          }
        }

        const top = Object.values(map)
          .sort((a,b)=>b.revenue - a.revenue)
          .slice(0,5);

        if(top.length === 0){
          tbody.innerHTML = `
            <tr>
              <td colspan="4" class="py-6 text-center text-slate-400">
                Chưa có dữ liệu sản phẩm bán chạy.
              </td>
            </tr>`;
          return;
        }

        tbody.innerHTML = top.map((p,i)=>`
          <tr class="hover:bg-slate-50">
            <td class="py-3 text-slate-400 font-bold">${i+1}</td>
            <td class="py-3 font-medium">${p.name}</td>
            <td class="py-3 text-right text-slate-500">${p.qty}</td>
            <td class="py-3 text-right font-semibold text-emerald-600">${fmt(p.revenue)}</td>
          </tr>
        `).join('');
      }

      function guessCategory(name){
        name = (name || '').toLowerCase();

        if(name.includes('mì') || name.includes('sữa') || name.includes('trứng') || name.includes('bánh') || name.includes('dầu ăn')){
          return 'Thực phẩm';
        }

        if(name.includes('coca') || name.includes('pepsi') || name.includes('nước') || name.includes('trà') || name.includes('cà phê')){
          return 'Đồ uống';
        }

        if(name.includes('giặt') || name.includes('nồi') || name.includes('máy') || name.includes('chảo')){
          return 'Gia dụng';
        }

        if(name.includes('dầu gội') || name.includes('sữa tắm') || name.includes('kem') || name.includes('mỹ phẩm')){
          return 'Mỹ phẩm';
        }

        return 'Khác';
      }

      async function renderCategoryRevenueReal(){
        const list = document.getElementById('categoryRevenueList');
        if(!list) return;

        const paidOrders = mgrOrders
          .filter(o => o.st === 'paid' || o.st === 'refund')
          .slice(0, 30);

        const map = {};

        for(const o of paidOrders){
          try{
            const d = await apiGet('/orders/' + o.id);

            (d.chiTiet || []).forEach(x=>{
              const cat = guessCategory(x.tenSanPham);

              if(!map[cat]){
                map[cat] = 0;
              }

              map[cat] += Number(x.thanhTien || 0);
            });
          }catch(e){
            console.log('Lỗi tải chi tiết đơn', o.id, e.message);
          }
        }

        const total = Object.values(map).reduce((s,v)=>s+v,0);

        const rows = Object.entries(map)
          .map(([name, amount])=>({
            name,
            amount,
            pct: total > 0 ? Math.round(amount / total * 100) : 0
          }))
          .sort((a,b)=>b.amount-a.amount)
          .slice(0,5);

        if(rows.length === 0){
          list.innerHTML = `<li class="text-slate-400 text-sm">Chưa có dữ liệu danh mục.</li>`;
          return;
        }

        const colorMap = {
          'Thực phẩm': 'bg-emerald-500',
          'Đồ uống': 'bg-indigo-600',
          'Gia dụng': 'bg-amber-500',
          'Mỹ phẩm': 'bg-pink-600',
          'Khác': 'bg-slate-400'
        };

        list.innerHTML = rows.map(r=>`
          <li class="flex justify-between items-center">
            <span class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full ${colorMap[r.name] || 'bg-slate-400'} shrink-0"></span>
              ${r.name}
            </span>
            <div class="text-right">
              <b>${r.pct}%</b>
              <p class="text-xs text-slate-400">${fmt(r.amount)}</p>
            </div>
          </li>
        `).join('');

        updateDonutChartReal(rows);
      }

      function renderDashboardKPI(){
        const paid = mgrOrders.filter(o => o.st === 'paid' || o.st === 'refund');

        const revenue = paid.reduce((sum, o) => sum + Number(o.total || 0), 0);

        const revEl = document.getElementById('dashRevenueToday');
        const orderEl = document.getElementById('dashOrderCount');
        const customerEl = document.getElementById('dashCustomerCount');
        const staffEl = document.getElementById('dashWorkingStaff');

        if(revEl) revEl.textContent = fmt(revenue);
        if(orderEl) orderEl.textContent = paid.length;
        if(customerEl) customerEl.textContent = customers.length;

        const staffCodes = [...new Set(workShifts.map(s => s.code).filter(Boolean))];
        const working = workShifts.filter(s => s.status === 'checkedin').length;
        const totalStaff = staffCodes.length;

        if(staffEl) staffEl.textContent = `${working} / ${totalStaff}`;
        
        const sub = document.getElementById('dashSubTitle');
        if(sub){
          const now = new Date();
          sub.textContent =
            'Số liệu kinh doanh hôm nay · ' +
            now.toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) +
            ' · Chi nhánh Quận 1';
        }

        const revCompare = document.getElementById('dashRevenueCompare');
        if(revCompare) revCompare.textContent = 'Tổng doanh thu đơn đã thanh toán';

        const cusCompare = document.getElementById('dashCustomerCompare');
        if(cusCompare) cusCompare.textContent = 'Tổng khách hàng trong hệ thống';

        const absentEl = document.getElementById('dashAbsentStaff');
        if(absentEl){
          const absent = workShifts.filter(s => s.status === 'absent').length;
          absentEl.textContent = absent + ' ca vắng mặt';
        }
        const avgEl = document.getElementById('dashAvgOrder');
        if(avgEl){
          const avg = paid.length ? Math.round(revenue / paid.length) : 0;
          avgEl.textContent = 'TB: ' + fmt(avg) + '/đơn thanh toán';
        }
     }

     function renderSystemAlerts(){
        const box = document.getElementById('systemAlerts');
        if(!box) return;

        const alerts = [];

        const pendingRefundsCount = Array.isArray(returnRequests)
          ? returnRequests.filter(r => r.status === 'pending').length
          : 0;

        const pendingShifts = workShifts.filter(s => s.status === 'checkedin').length;
        const absentShifts = workShifts.filter(s => s.status === 'absent').length;
        const pendingOrders = mgrOrders.filter(o => o.st === 'pending').length;
        const canceledOrders = mgrOrders.filter(o => o.st === 'cancel').length;

        if(pendingRefundsCount > 0){
          alerts.push({
            color: 'indigo',
            icon: 'rotate-ccw',
            title: pendingRefundsCount + ' yêu cầu hoàn hàng chờ duyệt',
            sub: 'Cần quản lý xác nhận'
          });
        }

        if(pendingShifts > 0){
          alerts.push({
            color: 'amber',
            icon: 'clock',
            title: pendingShifts + ' ca làm việc chờ xác nhận',
            sub: 'Vào mục Quản lý lịch ca để xử lý'
          });
        }

        if(absentShifts > 0){
          alerts.push({
            color: 'red',
            icon: 'user-x',
            title: absentShifts + ' ca vắng mặt',
            sub: 'Theo dữ liệu chấm công'
          });
        }

        if(pendingOrders > 0){
          alerts.push({
            color: 'slate',
            icon: 'shopping-cart',
            title: pendingOrders + ' đơn chờ thanh toán',
            sub: 'Theo danh sách đơn hàng'
          });
        }

        if(canceledOrders > 0){
          alerts.push({
            color: 'red',
            icon: 'ban',
            title: canceledOrders + ' đơn đã hủy',
            sub: 'Cần theo dõi lý do hủy'
          });
        }

        if(alerts.length === 0){
          box.innerHTML = `
            <div class="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 mt-0.5 shrink-0"></i>
              <div>
                <p class="text-sm font-semibold text-emerald-800">Không có cảnh báo quan trọng</p>
                <p class="text-xs text-emerald-500 mt-0.5">Hệ thống đang hoạt động ổn định</p>
              </div>
            </div>`;
          lucide.createIcons();
          return;
        }

        const cls = {
          amber: ['bg-amber-50','border-amber-200','text-amber-600','text-amber-800','text-amber-600'],
          red: ['bg-red-50','border-red-200','text-red-600','text-red-800','text-red-500'],
          indigo: ['bg-indigo-50','border-indigo-200','text-indigo-600','text-indigo-800','text-indigo-500'],
          slate: ['bg-slate-50','border-slate-200','text-slate-600','text-slate-800','text-slate-500']
        };

        box.innerHTML = alerts.slice(0,4).map(a=>{
          const c = cls[a.color] || cls.slate;
          return `
            <div class="flex items-start gap-3 ${c[0]} border ${c[1]} rounded-lg p-3">
              <i data-lucide="${a.icon}" class="w-4 h-4 ${c[2]} mt-0.5 shrink-0"></i>
              <div>
                <p class="text-sm font-semibold ${c[3]}">${a.title}</p>
                <p class="text-xs ${c[4]} mt-0.5">${a.sub}</p>
              </div>
            </div>`;
        }).join('');

        lucide.createIcons();
      }

      function updateDonutChartReal(rows){
        if(!rows || rows.length === 0) return;

        const ctx = document.getElementById('donutChart');
        if(!ctx) return;

        destroyChart('donutChart');

        chartInstances['donutChart'] = new Chart(ctx,{
          type:'doughnut',
          data:{
            labels: rows.map(r=>r.name),
            datasets:[{
              data: rows.map(r=>r.pct),
              backgroundColor:['#10b981','#4f46e5','#f59e0b','#db2777','#94a3b8'],
              borderWidth:2,
              borderColor:'#fff'
            }]
          },
          options:{
            responsive:false,
            plugins:{
              legend:{display:false},
              tooltip:{
                callbacks:{
                  label:(i)=>i.label + ': ' + i.raw + '%'
                }
              }
            }
          }
        });
      }
          
      // Tải doanh thu thật 7 ngày gần nhất -> đổ vào biểu đồ chế độ "Ngày"
      async function loadRevenue(){
        const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const end = new Date(); const start = new Date(); start.setDate(end.getDate()-6);
        let rows = [];
        try{ const res = await apiGet('/reports/revenue?from='+ymd(start)+'&to='+ymd(end)); rows = res.rows||[]; }
        catch(e){ toast('Lỗi tải báo cáo doanh thu: '+e.message,'error'); return; }
        const map = {}; rows.forEach(r=>{ map[String(r.ngay).slice(0,10)] = Number(r.doanhThuThuc||0); });
        const dow = ['CN','T2','T3','T4','T5','T6','T7'];
        revDayData.length=0; revDayLabels.length=0;
        for(let i=6;i>=0;i--){
          const d=new Date(end); d.setDate(end.getDate()-i); const key=ymd(d);
          revDayData.push(map[key]||0);
          revDayLabels.push(dow[d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1));
        }
        if(revMode==='day') initRevCharts();
          initDashCharts();
      }

      function updateRevenueKpiFromChart(){
        const from = document.getElementById('revFrom')?.value || '';
        const to   = document.getElementById('revTo')?.value || '';

        const inRange = o => {
          const d = String(o.rawDate || '').slice(0,10);
          if(from && d < from) return false;
          if(to && d > to) return false;
          return true;
        };

        const rangeOrders = mgrOrders.filter(inRange);

        const paidOrders = rangeOrders.filter(o => o.st === 'paid');
        const refundCancelOrders = rangeOrders.filter(o =>
          o.st === 'refund' || o.st === 'cancel'
        );

        const total = paidOrders.reduce((s,o)=>s + Number(o.total || 0), 0);
        const orderCount = paidOrders.length;
        const refundCount = refundCancelOrders.length;
        const allCount = orderCount + refundCount;

        const refundRate = allCount ? refundCount * 100 / allCount : 0;
        const avg = orderCount ? total / orderCount : 0;
        const profit = Math.round(total * 0.25);

        document.getElementById('revKpiRevenue').textContent = fmt(total);
        document.getElementById('revKpiOrders').textContent = orderCount + ' đơn';
        document.getElementById('revKpiRefundRate').textContent = refundRate.toFixed(1) + '%';
        document.getElementById('revKpiProfit').textContent = fmt(profit);

        document.getElementById('revKpiCompare').textContent = 'Dữ liệu từ đơn hàng đã thanh toán';
        document.getElementById('revKpiAvgOrder').textContent = 'TB: ' + fmt(avg) + '/đơn';
        document.getElementById('revKpiRefundCount').textContent = refundCount + ' đơn hoàn / hủy';
        document.getElementById('revKpiProfitNote').textContent = 'Lợi nhuận ước tính 25%';
      }
      
      async function loadRevenueCustom(){
        const from = document.getElementById('revFrom')?.value;
        const to   = document.getElementById('revTo')?.value;

        if(!from || !to){
          toast('Vui lòng chọn từ ngày và đến ngày', 'warning');
          return;
        }

        if(from > to){
          toast('Từ ngày không được lớn hơn đến ngày', 'error');
          return;
        }

        let rows = [];
        try{
          const res = await apiGet('/reports/revenue?from=' + from + '&to=' + to);
          rows = res.rows || [];
        }catch(e){
          toast('Lỗi tải báo cáo doanh thu: ' + e.message, 'error');
          return;
        }

        const map = {};
        rows.forEach(r => {
          map[String(r.ngay).slice(0,10)] = Number(r.doanhThuThuc || 0);
        });

        const start = new Date(from);
        const end   = new Date(to);
        const dow = ['CN','T2','T3','T4','T5','T6','T7'];

        revDayData.length = 0;
        revDayLabels.length = 0;

        for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)){
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          revDayData.push(map[key] || 0);
          revDayLabels.push(dow[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth()+1));
        }

        revMode = 'day';
        setRevMode('day');
        updateRevenueKpiFromChart();

        const ctx = document.getElementById('revChart');
        const titleEl = ctx?.closest('.bg-white')?.querySelector('h2');

        if(titleEl){
          titleEl.textContent =
            'Doanh thu từ ' +
            from.split('-').reverse().join('/') +
            ' đến ' +
            to.split('-').reverse().join('/');
        }

        toast('Đã tải báo cáo doanh thu theo khoảng ngày chọn', 'success');
      }
      
      async function loadRevenueMonth30(){
        const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);

        let rows = [];

        try{
          const res = await apiGet('/reports/revenue?from=' + ymd(start) + '&to=' + ymd(end));
          rows = res.rows || [];
        }catch(e){
          toast('Lỗi tải doanh thu 1 tháng: ' + e.message, 'error');
          return;
        }

        const map = {};
        rows.forEach(r=>{
          map[String(r.ngay).slice(0,10)] = Number(r.doanhThuThuc || 0);
        });

        const dow = ['CN','T2','T3','T4','T5','T6','T7'];

        revMonth30Data = [];
        revMonth30Labels = [];

        for(let d = new Date(start); d <= end; d.setDate(d.getDate()+1)){
          const key = ymd(d);
          revMonth30Data.push(map[key] || 0);
          revMonth30Labels.push(dow[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth()+1));
        }
      }

      async function loadRevenueYear(){
        const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 11);
        start.setDate(1);

        let rows = [];

        try{
          const res = await apiGet('/reports/revenue?from=' + ymd(start) + '&to=' + ymd(end));
          rows = res.rows || [];
        }catch(e){
          toast('Lỗi tải doanh thu 1 năm: ' + e.message, 'error');
          return;
        }

        const monthMap = {};

        for(let i = 0; i < 12; i++){
          const d = new Date(start);
          d.setMonth(start.getMonth() + i);

          const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
          monthMap[key] = 0;
        }

        rows.forEach(r=>{
          const key = String(r.ngay).slice(0,7);
          if(monthMap[key] != null){
            monthMap[key] += Number(r.doanhThuThuc || 0);
          }
        });

        revYearLabels = Object.keys(monthMap).map(k=>{
          const [y,m] = k.split('-');
          return 'T' + Number(m) + '/' + y;
        });

        revYearData = Object.values(monthMap);
      }

      function initRevCharts(){
        destroyChart('revChart');
        const ctx = document.getElementById('revChart');
        if(ctx){
          let labels, data, targetData, titleEl;
          if(revMode === 'month30'){
            labels = revMonth30Labels;
            data = revMonth30Data;
            targetData = Array(data.length).fill(12000000);
          } else if(revMode === 'year'){
            labels = revYearLabels;
            data = revYearData;
            targetData = Array(data.length).fill(320000000);
          } else {
            labels = revDayLabels;
            data = revDayData;
            targetData = Array(data.length).fill(12000000);
          }
          const titleMap = {
            day: 'Doanh thu theo ngày',
            month30: 'Doanh thu 1 tháng gần nhất',
            year: 'Doanh thu 1 năm gần nhất'
          };
          const titleEl2 = ctx.closest('.bg-white')?.querySelector('h2');
          if(titleEl2) titleEl2.textContent = titleMap[revMode] || titleMap.day;

          chartInstances['revChart'] = new Chart(ctx,{
            type:'bar',
            data:{ labels, datasets:[
              { label:'Doanh thu', data, backgroundColor:'rgba(16,185,129,0.7)', borderRadius:6, hoverBackgroundColor:'#059669' },
              { label:'Mục tiêu', data:targetData, type:'line', borderColor:'#94a3b8', borderDash:[4,4], pointRadius:0, fill:false }
            ]},
            options:{ responsive:true,
              onClick:(evt,elements)=>{ if(elements.length) showRevDetail(elements[0].index); },
              plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:(i)=>i.dataset.label+': '+fmt(i.raw) }}},
              scales:{ y:{ ticks:{ callback:(v)=>revMode==='month'?(v/1000000000).toFixed(2)+'B':(v/1000000).toFixed(1)+'M' }, grid:{ color:'#f1f5f9' } }, x:{ grid:{display:false} } } }
          });
          // Gợi ý click
          const chartWrap = ctx.closest('.bg-white');
          if(chartWrap && !chartWrap.querySelector('.rev-click-hint')){
            const hint = document.createElement('p');
            hint.className='rev-click-hint text-xs text-slate-400 text-center mt-1 flex items-center justify-center gap-1';
            hint.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>Click vào cột để xem chi tiết kỳ';
            chartWrap.appendChild(hint);
          }
        }
        destroyChart('donutChart');
        const ctx2 = document.getElementById('donutChart');
        if(ctx2){
          chartInstances['donutChart'] = new Chart(ctx2,{
            type:'doughnut',
            data:{ labels:['Thực phẩm','Đồ uống','Gia dụng','Mỹ phẩm','Khác'], datasets:[{ data:[38,22,18,14,8], backgroundColor:['#10b981','#4f46e5','#f59e0b','#db2777','#94a3b8'], borderWidth:2, borderColor:'#fff' }] },
            options:{ responsive:false, plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:(i)=>i.label+': '+i.raw+'%' }}}}
          });
        }
        if(revMode === 'day'){
          updateRevenueKpiFromChart();
        }
      }

      // =========================================================
      // MANAGER: DASHBOARD
      // =========================================================
      function renderRecentOrders(){
        const t = document.getElementById('recentOrders'); if(!t) return;
        const src = (typeof mgrOrders!=='undefined' && mgrOrders.length) ? mgrOrders : [];
        if(!src.length){ t.innerHTML = `<tr><td colspan="5" class="px-5 py-6 text-center text-slate-400 text-sm">Chưa có đơn hàng.</td></tr>`; return; }
        t.innerHTML = src.slice(0,6).map(o=>`
          <tr class="hover:bg-slate-50 cursor-pointer" onclick="showOrderDetail('${o.id}')">
            <td class="px-5 py-3 font-mono font-semibold text-sm">${o.id}</td>
            <td class="px-5 py-3 text-slate-500 text-sm">${o.time}</td>
            <td class="px-5 py-3 text-slate-500 text-sm">${o.cust}</td>
            <td class="px-5 py-3 text-right font-semibold text-sm">${fmt(o.total)}</td>
            <td class="px-5 py-3 text-center">${stBadge(o.st)}</td>
          </tr>`).join('');
      }

      function renderStaffPerf(){
        const box = document.getElementById('staffPerf');
        if(!box) return;

        const today = new Date().toISOString().slice(0,10);

        const paid = mgrOrders.filter(o => {
          const orderDate = o.rawDate ? String(o.rawDate).slice(0,10) : '';
          return (o.st === 'paid' || o.st === 'refund') && orderDate === today;
        });

        const staffMap = {};

        paid.forEach(o=>{
          const staffCode = o.maNV || o.staffCode || 'NV';
          const staffName = o.staffName || staffCode;

          if(!staffMap[staffCode]){
            staffMap[staffCode] = {
              name: staffName,
              orders: 0,
              revenue: 0
            };
          }

          staffMap[staffCode].orders += 1;
          staffMap[staffCode].revenue += Number(o.total || 0);
        });

        const rows = Object.values(staffMap)
          .sort((a,b)=>b.revenue-a.revenue)
          .slice(0,5);

        const maxRevenue = Math.max(...rows.map(r=>r.revenue), 1);

        if(rows.length === 0){
          box.innerHTML = `<p class="text-sm text-slate-400">Chưa có dữ liệu hiệu suất.</p>`;
          return;
        }

        box.innerHTML = rows.map(r=>{
          const pct = Math.round(r.revenue / maxRevenue * 100);

          return `
            <div>
              <div class="flex justify-between mb-1 text-sm">
                <span class="font-medium">${r.name}</span>
                <span class="text-slate-500">${r.orders} đơn · ${fmt(r.revenue)}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-emerald-500 h-2 rounded-full" style="width:${pct}%"></div>
              </div>
            </div>
          `;
        }).join('');
      }

      // =========================================================
      // MANAGER: CA LÀM VIỆC — QUẢN LÝ XÁC NHẬN CHẤM CÔNG
      // ---------------------------------------------------------
      // Màn hình này KHÔNG dùng để tạo/sửa lịch ca.
      // Chỉ hiển thị các ca đã approved (workShifts) và cho phép
      // quản lý xác nhận hoặc từ chối chấm công của nhân viên.
      // =========================================================

      function wsStatusBadge(s){
        const m = {
          approved:  '<span class="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-200">Chờ chấm công</span>',
          checkedin: '<span class="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">⏳ Chờ xác nhận</span>',
          done:      '<span class="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">✓ Đã xác nhận</span>',
          absent:    '<span class="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium">Vắng mặt</span>',
          rejected:  '<span class="text-xs px-2.5 py-1 rounded-full bg-red-200 text-red-800 font-medium">Từ chối</span>',
        };
        return m[s]||'';
      }

      function renderWorkShiftList(){
        const t = document.getElementById('wsRows'); if(!t) return;
        const staffQ  = (document.getElementById('wfStaff')||{}).value?.toLowerCase().trim()||'';
        const statusQ = (document.getElementById('wfStatus')||{}).value||'';
        const fromQ   = (document.getElementById('wfFrom')||{}).value||'';
        const toQ     = (document.getElementById('wfTo')||{}).value||'';

        const filtered = workShifts.filter(s=>{
          if(staffQ && !s.staff.toLowerCase().includes(staffQ) && !s.code.toLowerCase().includes(staffQ)) return false;
          if(statusQ && s.status!==statusQ) return false;
          if(fromQ && s.date < fromQ) return false;
          if(toQ   && s.date > toQ)   return false;
          return true;
        }).sort((a,b)=>b.date.localeCompare(a.date));

        // Update badge count
        const pendingCount = workShifts.filter(s=>s.status==='checkedin').length;
        const badgeBar = document.getElementById('wsBadgeBar');
        const badgeNum = document.getElementById('wsPendingCount');
        if(badgeBar){ badgeBar.classList.toggle('hidden', pendingCount===0); }
        if(badgeNum){ badgeNum.textContent = pendingCount; }

        if(filtered.length===0){
          t.innerHTML=`<tr><td colspan="9" class="p-8 text-center text-slate-400">Không tìm thấy ca làm việc nào.</td></tr>`;
          document.getElementById('wsCount').textContent='0';
          document.getElementById('wsTotalHours').textContent='0 giờ';
          return;
        }

        const totalH = filtered.reduce((s,w)=>s+(w.hours||0),0);
        document.getElementById('wsCount').textContent = filtered.length;
        document.getElementById('wsTotalHours').textContent = totalH.toFixed(1)+' giờ';

        t.innerHTML = filtered.map(s=>{
          const dateDisplay = s.date.split('-').reverse().join('/');
          const isLate = s.note && s.note.includes('trễ');
          const checkinColor = s.status==='absent' ? 'text-slate-300' : (isLate ? 'text-amber-600 font-semibold' : 'text-slate-700');
          const checkinDisplay = s.checkinTime==='—'
            ? '<span class="text-slate-300">—</span>'
            : `<span class="${checkinColor} font-mono">${s.checkinTime}${isLate?` <span class="text-[10px] text-amber-500 font-normal">(trễ)</span>`:''}</span>`;
          const checkoutDisplay = s.checkoutTime==='—'
            ? '<span class="text-slate-300">—</span>'
            : `<span class="text-slate-700 font-mono">${s.checkoutTime}</span>`;
          return `
          <tr class="hover:bg-slate-50 ${s.status==='checkedin'?'bg-orange-50/40':''}">
            <td class="p-4">
              <button onclick="showStaffDetail('${s.code}')" class="text-left hover:underline">
                <p class="font-semibold text-slate-900">${s.staff}</p>
                <p class="text-xs text-slate-400">${s.code}</p>
              </button>
            </td>
            <td class="p-4 text-slate-600 text-sm">${dateDisplay}</td>
            <td class="p-4 font-mono text-slate-600 text-sm">${s.time}</td>
            <td class="p-4 text-slate-500 text-sm">${s.counter}</td>
            <td class="p-4">${checkinDisplay}</td>
            <td class="p-4">${checkoutDisplay}</td>
            <td class="p-4 text-right font-semibold text-sm">${s.hours!=null && s.hours>0 ? s.hours.toFixed(1)+' h' : '<span class="text-slate-300">—</span>'}</td>
            <td class="p-4">${wsStatusBadge(s.status)}</td>
            <td class="p-4">
              <div class="flex gap-1.5 flex-wrap items-center">
                ${s.status==='checkedin'?`
                  <button onclick="wsConfirm('${s.id}')" class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors" title="Xác nhận chấm công">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Xác nhận
                  </button>
                  <button onclick="wsReject('${s.id}')" class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-red-50 text-red-600 text-xs font-medium border border-red-200 transition-colors" title="Từ chối xác nhận">
                    <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Từ chối
                  </button>
                `:''}
                ${s.status==='done'?'<span class="text-xs text-slate-400 italic">Đã xong</span>':''}
                ${s.status==='approved'?`<span class="text-xs text-slate-400 italic">Chờ NV chấm công</span>
                  <button onclick="openManualConfirm('${s.id}')" class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 transition-colors" title="NV quên chấm — xác nhận thủ công">
                    <i data-lucide="pencil" class="w-3.5 h-3.5"></i> Nhập tay
                  </button>`:''}
                ${s.status==='absent'||s.status==='rejected'?`<span class="text-xs text-slate-400 italic">${s.note||'—'}</span>`:''}
              </div>
            </td>
          </tr>`;
        }).join('');
        lucide.createIcons();
      }

      // Quản lý xác nhận chấm công của NV
      async function wsConfirm(id){
        const s = workShifts.find(x => x.id === id);
        if(!s) return;

        // Thiếu giờ vào hoặc giờ ra (NV quên chấm) -> xác nhận THỦ CÔNG (nhập tay)
        if(s.checkinTime==='—' || s.checkoutTime==='—'){
          openManualConfirm(id);
          return;
        }

        if(!confirm(`Xác nhận ghi nhận ngày công cho ${s.staff}?`)) return;

        try{
          await apiPost('/shifts/work/' + id + '/confirm', {
            maQuanLy: (window.currentUser || {}).maNV
          });
        }catch(e){ toast('Xác nhận thất bại: ' + e.message, 'error'); return; }
        await loadWorkShifts();   // nạp lại từ DB để trạng thái + báo cáo cập nhật chuẩn
        toast(`✅ Đã xác nhận ca làm việc của ${s.staff}`, 'success');
      }

      // ===== Xác nhận THỦ CÔNG (NV quên chấm công) =====
      let manualConfirmId = null;
      function openManualConfirm(id){
        const s = workShifts.find(x=>x.id===id); if(!s) return;
        manualConfirmId = id;
        const sched = (s.time||'').split('-');           // ['06:00','14:00']
        const ci = s.checkinTime!=='—' ? s.checkinTime : (sched[0]||'');
        const co = s.checkoutTime!=='—' ? s.checkoutTime : (sched[1]||'');
        document.getElementById('mcInfo').textContent = `${s.staff} (${s.code}) · ${s.date.split('-').reverse().join('/')} · Ca dự kiến ${s.time}`;
        document.getElementById('mcCheckin').value  = ci;
        document.getElementById('mcCheckout').value = co;
        document.getElementById('mcErr').classList.add('hidden');
        calcManualHours();
        openModal('modalManualConfirm');
        lucide.createIcons();
      }
      function calcManualHours(){
        const ci = document.getElementById('mcCheckin').value;
        const co = document.getElementById('mcCheckout').value;
        const out = document.getElementById('mcHours');
        const toMin = t => { const m=String(t).match(/(\d{1,2}):(\d{2})/); return m? (+m[1]*60 + +m[2]) : null; };
        const a = toMin(ci), b = toMin(co);
        if(a==null || b==null || b<=a){ out.value=''; return 0; }
        const h = ((b-a)/60);
        out.value = h.toFixed(2);
        return h;
      }
      async function submitManualConfirm(){
        if(!manualConfirmId) return;
        const ci = document.getElementById('mcCheckin').value;
        const co = document.getElementById('mcCheckout').value;
        const hours = parseFloat(document.getElementById('mcHours').value);
        const err = document.getElementById('mcErr');
        err.classList.add('hidden');
        if(!/^\d{1,2}:\d{2}$/.test(ci) || !/^\d{1,2}:\d{2}$/.test(co)){
          err.textContent='Giờ vào/ra phải đúng định dạng HH:MM.'; err.classList.remove('hidden'); return;
        }
        if(!hours || hours<=0){
          err.textContent='Số giờ công không hợp lệ (giờ ra phải sau giờ vào).'; err.classList.remove('hidden'); return;
        }
        try{
          await apiPost('/shifts/work/'+manualConfirmId+'/confirm-manual', {
            maQuanLy: (window.currentUser||{}).maNV,
            gioBatDauThucTe: ci, gioKetThucThucTe: co, soGioCong: hours
          });
        }catch(e){ err.textContent='Xác nhận thủ công thất bại: '+e.message; err.classList.remove('hidden'); return; }
        closeModal('modalManualConfirm');
        manualConfirmId = null;
        await loadWorkShifts();
        toast('✅ Đã xác nhận thủ công ca làm việc','success');
      }

      // Quản lý từ chối xác nhận (không ghi nhận ngày công)
      async function wsReject(id){
        const s = workShifts.find(x=>x.id===id);
        if(!s) return;
        const reason = prompt(`Lý do từ chối xác nhận ca của ${s.staff}?\n(Ví dụ: Quên check-out, không đủ giờ...)`);
        if(reason===null) return; // user cancelled
        try{
          await apiPost('/shifts/work/'+id+'/reject', { maQuanLy: (window.currentUser||{}).maNV, lyDo: reason||'Từ chối bởi quản lý' });
        }catch(e){ toast('Từ chối thất bại: '+e.message,'error'); return; }
        await loadWorkShifts();
        toast(`❌ Đã từ chối xác nhận ca của ${s.staff}`,'warning');
      }

      // Xác nhận tất cả các ca đang chờ
      async function confirmAllCheckins(){
        const pending = workShifts.filter(s=>s.status==='checkedin');
        if(pending.length===0){ toast('Không có ca nào chờ xác nhận','info'); return; }
        if(!confirm(`Xác nhận tất cả ${pending.length} ca đang chờ?`)) return;
        const maQuanLy = (window.currentUser||{}).maNV;
        try{
          for(const s of pending){ await apiPost('/shifts/work/'+s.id+'/confirm', { maQuanLy }); }
        }catch(e){ toast('Có lỗi khi xác nhận hàng loạt: '+e.message,'error'); }
        await loadWorkShifts();
        toast(`✅ Đã xác nhận ${pending.length} ca làm việc`,'success');
      }

      // Modal xem thông tin nhân viên
      function showStaffDetail(code){
        const staffDB = {
          E01: { name:'Nguyễn Văn An', phone:'0901234567', email:'van.an@emarket.vn', role:'Thu ngân', store:'eMarket Q1', startDate:'01/03/2024', totalShifts:48, totalHours:382 },
          E02: { name:'Trần Thị Bình', phone:'0912345678', email:'thi.binh@emarket.vn', role:'Thu ngân', store:'eMarket Q1', startDate:'15/05/2024', totalShifts:41, totalHours:318 },
          E03: { name:'Lê Văn Cường',  phone:'0923456789', email:'van.cuong@emarket.vn', role:'Thu ngân', store:'eMarket Q1', startDate:'10/01/2025', totalShifts:36, totalHours:280 },
          E04: { name:'Phạm Thị Dung', phone:'0934567890', email:'thi.dung@emarket.vn', role:'Nhân viên kho', store:'eMarket Q1', startDate:'20/02/2025', totalShifts:34, totalHours:265 },
          E05: { name:'Hoàng Văn Em',  phone:'0945678901', email:'van.em@emarket.vn', role:'Nhân viên', store:'eMarket Q1', startDate:'01/06/2025', totalShifts:23, totalHours:178 },
        };
        const info = staffDB[code]; if(!info) return;
        const el = document.getElementById('modalStaffDetail');
        document.getElementById('sdName').textContent    = info.name;
        document.getElementById('sdCode').textContent    = code;
        document.getElementById('sdRole').textContent    = info.role;
        document.getElementById('sdPhone').textContent   = info.phone;
        document.getElementById('sdEmail').textContent   = info.email;
        document.getElementById('sdStore').textContent   = info.store;
        document.getElementById('sdStart').textContent   = info.startDate;
        document.getElementById('sdShifts').textContent  = info.totalShifts + ' ca';
        document.getElementById('sdHours').textContent   = info.totalHours + ' giờ';
        openModal('modalStaffDetail');
      }

      // Xuất Excel ca làm việc
      function exportWorkShiftsExcel(){
        if(typeof XLSX==='undefined'){
          toast('SheetJS chưa tải, vui lòng thử lại','error');
          return;
        }

        const q = document.getElementById('wfStaff')?.value.trim().toLowerCase() || '';
        const from = document.getElementById('wfFrom')?.value || '';
        const to = document.getElementById('wfTo')?.value || '';
        const status = document.getElementById('wfStatus')?.value || '';

        const data = workShifts.filter(s=>{
          const d = String(s.date || '').slice(0,10);

          if(q && !String(s.staff || '').toLowerCase().includes(q) && !String(s.code || '').toLowerCase().includes(q)) return false;
          if(from && d < from) return false;
          if(to && d > to) return false;
          if(status && s.status !== status) return false;

          return true;
        });

        if(data.length === 0){
          toast('Không có dữ liệu để xuất Excel','info');
          return;
        }

        const statusLabel = {
          approved:'Chờ chấm công',
          checkedin:'Chờ xác nhận',
          done:'Đã xác nhận',
          rejected:'Từ chối',
          absent:'Vắng mặt'
        };

        const rows = [
          ['BÁO CÁO CA LÀM VIỆC - EMARKET'],
          [`Từ ngày: ${from || 'Tất cả'}  -  Đến ngày: ${to || 'Tất cả'}`],
          [`Trạng thái: ${status ? statusLabel[status] : 'Tất cả'}`],
          [],
          ['Mã NV','Tên nhân viên','Ngày','Ca dự kiến','Quầy','Check-in','Check-out','Số giờ','Trạng thái','Ghi chú']
        ];

        data.forEach(s=>{
          rows.push([
            s.code,
            s.staff,
            String(s.date || '').slice(0,10).split('-').reverse().join('/'),
            s.time,
            s.counter || '—',
            s.checkinTime || '—',
            s.checkoutTime || '—',
            s.hours!=null ? Number(s.hours).toFixed(1) : '—',
            statusLabel[s.status] || s.status,
            s.note || ''
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [10,22,14,16,12,12,12,10,18,30].map(w=>({wch:w}));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ca làm việc');

        XLSX.writeFile(wb, `emarket_ca_lam_viec_${new Date().toISOString().slice(0,10)}.xlsx`);
        toast('✅ Đã xuất Excel ca làm việc theo bộ lọc','success');
      }

      // Hàm giữ lại cho backward-compat (dùng trong notifications panel)
      function confirmCheckin(id){ wsConfirm(id); }
      function rejectCheckin(id){ wsReject(id); }
      async function approveShift(id){
        const s = managedShifts.find(x => x.id === id);
        if(!s) return;

        if(s.status !== 'pending'){
          toast('Ca này không ở trạng thái chờ duyệt lịch', 'info');
          return;
        }

        if(!confirm(`Duyệt lịch ca cho ${s.staff}?`)) return;

        try{
          await apiPost('/shifts/work/' + id + '/approve-schedule', {
            maQuanLy: (window.currentUser || {}).maNV
          });

          await loadWorkShifts();
          toast('Đã duyệt lịch ca', 'success');
        }catch(e){
          toast('Duyệt lịch thất bại: ' + e.message, 'error');
        }
      }

      // =========================================================
      // MANAGER: NOTIFICATIONS
      // =========================================================
      function updateMgrNotifications(){
        // Thông báo dựa trên workShifts (ca làm việc), không phải lịch ca
        const pending = workShifts.filter(s=>s.status==='checkedin');
        const badge = document.getElementById('mgrBellBadge');
        const list  = document.getElementById('mgrNotifList');
        if(!badge) return;
        if(pending.length===0){
          badge.classList.add('hidden');
          if(list) list.innerHTML='<p class="text-slate-400 text-sm text-center py-6">Không có thông báo mới</p>';
        } else {
          badge.classList.remove('hidden');
          badge.textContent = pending.length;
          if(list){
            list.innerHTML = pending.map(s=>`
              <div class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                <div class="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                  <i data-lucide="clock" class="w-4 h-4 text-orange-600"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-800 truncate">${s.staff} đã check-in</p>
                  <p class="text-xs text-slate-500 mt-0.5">${s.date} · ${s.time} · ${s.counter}</p>
                  <div class="flex gap-2 mt-2">
                    <button onclick="wsConfirm('${s.id}');toggleNotifPanel()" class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-medium">✓ Xác nhận</button>
                    <button onclick="wsReject('${s.id}');toggleNotifPanel()" class="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg font-medium border border-red-200">✗ Từ chối</button>
                  </div>
                </div>
              </div>`).join('');
            lucide.createIcons({ nodes:[list] });
          }
        }
      }

      function toggleNotifPanel(){
        const panel = document.getElementById('mgrNotifPanel');
        if(!panel) return;
        panel.classList.toggle('hidden');
      }

      // Đóng panel khi click ngoài
      document.addEventListener('click', function(e){
        const panel = document.getElementById('mgrNotifPanel');
        const wrapper = panel?.closest('.relative');
        if(panel && !panel.classList.contains('hidden') && wrapper && !wrapper.contains(e.target)){
          panel.classList.add('hidden');
        }
        // Close week picker when clicking outside
        const picker = document.getElementById('weekPickerDropdown');
        const pickerBtn = document.getElementById('weekPickerBtn');
        if(picker && !picker.classList.contains('hidden') && pickerBtn && !pickerBtn.contains(e.target) && !picker.contains(e.target)){
          picker.classList.add('hidden');
        }
      });

      async function deleteShift(id){

        const shift = managedShifts.find(x=>x.id===id);

        if(!shift) return;

        if(!confirm(`Xóa ca của ${shift.staff}?`)){
            return;
        }

        try{

            await apiDelete('/shifts/work/' + id);

            await loadWorkShifts();

            toast('Đã xóa ca làm việc','success');

        }catch(e){

            toast('Xóa thất bại: ' + e.message,'error');

        }

      }

      async function approveAllShifts(){
        const pending = managedShifts.filter(s => s.status === 'pending');

        if(pending.length === 0){
          toast('Không có lịch ca nào cần duyệt', 'info');
          return;
        }

        if(!confirm(`Duyệt lịch tất cả ${pending.length} ca?`)) return;

        try{
          for(const s of pending){
            await apiPost('/shifts/work/' + s.id + '/approve-schedule', {
              maQuanLy: (window.currentUser || {}).maNV
            });
          }

          await loadWorkShifts();
          toast(`Đã duyệt lịch ${pending.length} ca`, 'success');
        }catch(e){
          toast('Duyệt lịch tất cả thất bại: ' + e.message, 'error');
        }
      }

      function openAddShiftModal(){
        document.getElementById('asConflictErr').classList.add('hidden');
        openModal('modalAddShift');
      }

      async function saveNewShift(){
        const staff   = document.getElementById('asStaff').value;
        const type    = document.getElementById('asType').value;
        const date    = document.getElementById('asDate').value;
        const counter = document.getElementById('asCounter').value;

        const errEl = document.getElementById('asConflictErr');
        errEl.classList.add('hidden');

        if(!staff || !type || !date){
          errEl.textContent = 'Vui lòng nhập đầy đủ nhân viên, loại ca và ngày làm việc.';
          errEl.classList.remove('hidden');
          return;
        }

        const today = new Date();
        today.setHours(0,0,0,0);

        const inputDate = new Date(date);
        inputDate.setHours(0,0,0,0);

        const diff = (inputDate - today) / (1000*60*60*24);

        if(diff > 30){
          errEl.textContent = 'Lịch ca chỉ được tạo trước tối đa 30 ngày.';
          errEl.classList.remove('hidden');
          return;
        }

        if(diff < 0){
          errEl.textContent = 'Không thể tạo ca cho ngày đã qua.';
          errEl.classList.remove('hidden');
          return;
        }

        const timeMap = {
          'Ca sáng':  { loaiCa:'sang',  start:'06:00', end:'14:00' },
          'Ca chiều': { loaiCa:'chieu', start:'14:00', end:'22:00' },
          'Ca tối':   { loaiCa:'toi',   start:'17:00', end:'22:00' }
        };

        const cfg = timeMap[type];
        if(!cfg){
          errEl.textContent = 'Loại ca không hợp lệ.';
          errEl.classList.remove('hidden');
          return;
        }

        // Nếu select đang trả tên nhân viên, tìm mã NV từ dữ liệu thật
        const found =
          workShifts.find(s => s.staff === staff) ||
          managedShifts.find(s => s.staff === staff);

        const maNV = found ? found.code : staff;

        try{
          await apiPost('/shifts/work', {
            maNV,
            loaiCa: cfg.loaiCa,
            ngayLamViec: date,
            gioBatDauDuKien: cfg.start,
            gioKetThucDuKien: cfg.end,
            counter
          });
        }catch(e){
          errEl.textContent = 'Tạo ca thất bại: ' + e.message;
          errEl.classList.remove('hidden');
          return;
        }

        closeModal('modalAddShift');

        await loadWorkShifts();

        toast('Đã tạo ca mới và lưu vào SQL Server', 'success');
      }

      // =========================================================
      // MANAGER: WEEK GRID
      // =========================================================
      // ── Week navigation state ──
      let weekOffset = 0; // 0 = tuần chứa 15/06/2026 (tuần cơ sở)
      const WEEK_BASE_MON = (() => {

      const today = new Date();

      today.setHours(0,0,0,0);

      const day = today.getDay();

      const diff = day === 0 ? -6 : 1 - day;

      today.setDate(today.getDate() + diff);

      return today;

    })();

      function getWeekDates(offset){
        // Returns array of 7 Date objects (Mon-Sun) for given offset
        return Array.from({length:7},(_,i)=>{
          const d = new Date(WEEK_BASE_MON);
          d.setDate(d.getDate() + offset*7 + i);
          return d;
        });
      }

      function dateToDDMMYYYY(d){
        return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
      }

      function shiftWeek(delta){
        weekOffset += delta;
        closeWeekPicker();
        renderWeekGrid();
      }

      function jumpToToday(){
        weekOffset = 0;
        closeWeekPicker();
        renderWeekGrid();
      }

      // ── Mini date picker ──
      let pickerYear = 2026, pickerMonth = 5; // month 0-indexed, 5=June

      function toggleWeekPicker(){
        const dd = document.getElementById('weekPickerDropdown');
        if(dd.classList.contains('hidden')){
          // Sync picker to current week
          const dates = getWeekDates(weekOffset);
          pickerYear  = dates[0].getFullYear();
          pickerMonth = dates[0].getMonth();
          renderPickerDays();
          dd.classList.remove('hidden');
          lucide.createIcons();
        } else {
          dd.classList.add('hidden');
        }
      }

      function closeWeekPicker(){
        document.getElementById('weekPickerDropdown').classList.add('hidden');
      }

      function pickerPrevMonth(){ pickerMonth--; if(pickerMonth<0){pickerMonth=11;pickerYear--;} renderPickerDays(); lucide.createIcons(); }
      function pickerNextMonth(){ pickerMonth++; if(pickerMonth>11){pickerMonth=0;pickerYear++;} renderPickerDays(); lucide.createIcons(); }

      function renderPickerDays(){
        const months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
        document.getElementById('pickerMonthLabel').textContent = months[pickerMonth]+' '+pickerYear;
        const firstDay = new Date(pickerYear, pickerMonth, 1);
        // JS: 0=Sun,1=Mon... Convert to Mon-first: 0=Mon..6=Sun
        let startDow = (firstDay.getDay()+6)%7; // offset blanks
        const daysInMonth = new Date(pickerYear, pickerMonth+1, 0).getDate();
        // Get current week's dates to highlight
        const curWeekDates = getWeekDates(weekOffset).map(d=>d.toDateString());
        let html = '';
        for(let b=0;b<startDow;b++) html += '<div></div>';
        for(let d=1;d<=daysInMonth;d++){
          const dt = new Date(pickerYear, pickerMonth, d);
          const isInCurWeek = curWeekDates.includes(dt.toDateString());
          const isToday = dt.toDateString() === new Date().toDateString();
          html += `<button onclick="jumpToDateInPicker(${pickerYear},${pickerMonth},${d})"
            class="w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors
              ${isInCurWeek?'bg-emerald-500 text-white':'hover:bg-slate-100 text-slate-700'}
              ${isToday&&!isInCurWeek?'ring-2 ring-emerald-400 ring-offset-1':''}
            ">${d}</button>`;
        }
        document.getElementById('pickerDays').innerHTML = html;
      }

      function jumpToDateInPicker(y,m,d){
        const clicked = new Date(y,m,d);
        // Find Monday of that week
        const dow = (clicked.getDay()+6)%7; // 0=Mon
        const monday = new Date(clicked);
        monday.setDate(clicked.getDate()-dow);
        const base = new Date(WEEK_BASE_MON);
        weekOffset = Math.round((monday-base)/(7*24*60*60*1000));
        closeWeekPicker();
        renderWeekGrid();
      }

      function syncManagedShiftsFromWorkShifts(){

        managedShifts = workShifts.map(s => {

            let status = s.status;

            switch(s.status){

                // Chưa duyệt lịch
                case 'pending':
                    status = 'pending';
                    break;

                // Đã duyệt lịch
                case 'approved':
                    status = 'approved';
                    break;

                // Đã chấm công nhưng chờ quản lý xác nhận
                case 'checkedin':
                    status = 'checkedin';
                    break;

                // Đã xác nhận công
                case 'done':
                    status = 'done';
                    break;

                case 'absent':
                    status = 'absent';
                    break;

                case 'rejected':
                    status = 'rejected';
                    break;
            }

            return {
                id: s.id,
                staff: s.staff,
                code: s.code,
                date: s.date.split('-').reverse().join('/'),
                time: s.time,
                counter: s.counter || '—',
                status
            };
        });

    }

      function renderWeekGrid(){
        const t = document.getElementById('weekGrid');
        const h = document.getElementById('weekGridHead');
        if(!t||!h) return;

        const dates = getWeekDates(weekOffset);
        const dayNames = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','CN'];
        const staffList = [
          {name:'Nguyễn Văn An',code:'E01'},
          {name:'Trần Thị Bình',code:'E02'},
          {name:'Lê Văn Cường', code:'E03'},
          {name:'Phạm Thị Dung',code:'E04'},
          {name:'Hoàng Văn Em', code:'E05'},
        ];

        // Update header
        const todayStr = new Date().toDateString();
        h.innerHTML = `<th class="p-4 font-semibold w-36 text-slate-700">Nhân viên</th>`
          + dates.map((d,i)=>{
              const isSun = i===6;
              const isToday = d.toDateString()===todayStr;
              const label = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
              return `<th class="p-4 font-semibold text-center ${isSun?'bg-emerald-50/50':''}">
                ${dayNames[i]}<br/>
                <span class="font-normal text-xs ${isToday?'text-emerald-600 font-semibold':isSun?'text-emerald-500':'text-slate-400'}">(${label})</span>
              </th>`;
            }).join('');

        // Update week label button
        const d0 = dates[0], d6 = dates[6];
        const lbl0 = `${String(d0.getDate()).padStart(2,'0')}/${String(d0.getMonth()+1).padStart(2,'0')}`;
        const lbl6 = `${String(d6.getDate()).padStart(2,'0')}/${String(d6.getMonth()+1).padStart(2,'0')}/${d6.getFullYear()}`;
        const labelEl = document.getElementById('weekLabel');
        if(labelEl) labelEl.textContent = lbl0+' - '+lbl6;

        // Build rows
        t.innerHTML = staffList.map((st)=>{
          const cells = dates.map(d=>{
            const dateStr = dateToDDMMYYYY(d);
            const s = managedShifts.find(x=>x.staff===st.name && x.date===dateStr);
            if(!s) return `<td class="p-2 align-top text-center"><button onclick="openAddShiftModal()" class="text-slate-200 hover:text-emerald-500 transition-colors mt-2"><i data-lucide="plus" class="w-4 h-4"></i></button></td>`;
            const isPending  = s.status==='pending';
            const isApproved = s.status==='approved';
            const isDone     = s.status==='done';
            const isAbsent   = s.status==='absent';
            const isChecked = s.status === 'checkedin';
            return `<td class="p-2 align-top">
              <div class="rounded-xl p-2.5 text-xs cursor-pointer transition-all hover:shadow-md border-2
                ${isPending ? 'bg-amber-50 border-amber-300' : ''}
                ${isApproved ? 'bg-emerald-50 border-emerald-300' : ''}
                ${isChecked ? 'bg-blue-50 border-blue-300' : ''}
                ${isDone ? 'bg-slate-50 border-slate-300' : ''}
                ${isAbsent ? 'bg-red-50 border-red-300' : ''}
              " onclick="approveShiftDialog('${s.id}')">
                <div class="flex items-start justify-between gap-1 mb-1">
                  <span class="font-bold text-slate-800">${s.time}</span>
                  ${isPending?`<button onclick="event.stopPropagation();approveShift('${s.id}')" class="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700">Duyệt lịch</button>`:''}
                  ${isApproved?`<span class="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">✓</span>`:''}
                </div>
                <p class="text-slate-500">${s.counter}</p>
                <div class="mt-1.5 flex items-center justify-between">
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full
                    ${isPending?'bg-amber-200 text-amber-800':''}
                    ${isApproved?'bg-emerald-100 text-emerald-700':''}
                    ${isDone?'bg-slate-200 text-slate-600':''}
                    ${isAbsent?'bg-red-100 text-red-700':''}
                  ">${
                      isPending ? 'Chưa duyệt lịch' :
                      isApproved ? 'Đã duyệt lịch' :
                      isChecked ? 'Chờ xác nhận công' :
                      isDone ? 'Đã xác nhận công' :
                      isAbsent ? 'Vắng mặt' :
                      ''
                      }</span>
                  <button onclick="event.stopPropagation();deleteShift('${s.id}')" class="text-slate-300 hover:text-red-500 transition-colors" title="Xóa lịch ca">
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>
                </div>
              </div>
            </td>`;
          }).join('');
          return `<tr class="border-b border-slate-100"><td class="p-3 min-w-[130px]"><p class="font-semibold text-sm">${st.name}</p><p class="text-xs text-slate-400">${st.code}</p></td>${cells}</tr>`;
        }).join('');
        lucide.createIcons();
      }

      function approveShiftDialog(id){
        const s = managedShifts.find(x => x.id === id);
        if(!s) return;

        // ============================
        // Chưa duyệt lịch
        // ============================
        if(s.status === 'pending'){

          if(confirm(
      `DUYỆT LỊCH CA

      Nhân viên : ${s.staff} (${s.code})
      Ngày      : ${s.date}
      Ca        : ${s.time}
      ${s.counter && s.counter !== '—' ? 'Quầy     : '+s.counter : ''}

      Sau khi duyệt:
      ✓ Nhân viên sẽ nhìn thấy ca này trên màn hình chấm công.
      ✓ Nhân viên có thể check-in/check-out khi đến ca.

      Lưu ý:
      Đây KHÔNG phải xác nhận chấm công.`
          )){
            approveShift(id);
          }

          return;
        }

        // ============================
        // Đã duyệt lịch
        // ============================
        if(s.status === 'approved'){

          alert(
      `ĐÃ DUYỆT LỊCH

      Nhân viên: ${s.staff}
      Ngày: ${s.date}
      Ca: ${s.time}

      Nhân viên đã nhìn thấy lịch.

      Hiện đang chờ nhân viên check-in/check-out.`
          );

          return;
        }

        // ============================
        // Đang chấm công
        // ============================
        if(s.status === 'checkedin'){

          alert(
      `ĐANG CHỜ XÁC NHẬN CÔNG

      Nhân viên đã chấm công.

      Vui lòng sang màn "Quản lý lịch ca"
      để xác nhận công.`
          );

          return;
        }

        // ============================
        // Đã xác nhận công
        // ============================
        if(s.status === 'done'){

          alert(
      `CA ĐÃ ĐƯỢC XÁC NHẬN CÔNG.

      Ca này sẽ được tính vào
      Báo cáo chấm công.`
          );

          return;
        }

        // ============================
        // Vắng mặt
        // ============================
        if(s.status === 'absent'){

          alert(
      `Nhân viên vắng mặt.

      Nếu cần vẫn có thể sang
      "Quản lý lịch ca"
      để xác nhận công thủ công.`
          );

        }
      }

      // =========================================================
      // MANAGER: ATTENDANCE
      // =========================================================
      // Suy bảng chấm công chi tiết từ ca làm việc thật (workShifts)
      
      function attendanceRows(){
        return workShifts
          .filter(s => s.status === 'done') // chỉ ca đã quản lý xác nhận mới vào báo cáo
          .map(s => {
            let ex = 'confirmed';

            const dateDDMM = s.date
              ? String(s.date).slice(5).split('-').reverse().join('/')
              : '';

            return {
              id: s.code,
              name: s.staff,
              ca: s.id,
              rawDate: String(s.date || '').slice(0, 10),
              date: dateDDMM,
              schedule: s.time,
              checkin: s.checkinTime && s.checkinTime !== '—' ? s.checkinTime : '—',
              checkout: s.checkoutTime && s.checkoutTime !== '—' ? s.checkoutTime : '—',
              hours: Number(s.hours || 0),
              ex
            };
          });
      }

      function renderAttendance(data){
        if(!data) data = attendanceRows();

        const t = document.getElementById('attRows');
        if(!t) return;

        // ===== TÍNH KPI THẬT TỪ data =====
        const total = data.length;
        const onTime = data.filter(d => d.ex === 'ok').length;
        const late = data.filter(d => d.ex === 'late').length;
        const absent = data.filter(d => d.ex === 'absent' || d.ex === 'forgot').length;

        const pct = n => total ? ((n / total) * 100).toFixed(1) + '%' : '0%';

        const setText = (id, value) => {
          const el = document.getElementById(id);
          if(el) el.textContent = value;
        };

        setText('attTotal', total);
        setText('attOnTime', onTime);
        setText('attLate', late);
        setText('attAbsent', absent);

        setText('attOnTimePct', pct(onTime));
        setText('attLatePct', pct(late));
        setText('attAbsentPct', pct(absent));

        // ===== BẢNG CHI TIẾT =====
        if(data.length === 0){
          t.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400">Không có dữ liệu.</td></tr>`;
          return;
        }

        t.innerHTML = data.map(d=>`
          <tr class="hover:bg-slate-50">
            <td class="p-4"><p class="font-semibold">${d.name}</p><p class="text-xs text-slate-400">${d.id}</p></td>
            <td class="p-4 font-mono text-slate-500 text-xs">${d.ca}</td>
            <td class="p-4 text-slate-500 text-sm">${d.date}/2026</td>
            <td class="p-4 font-mono text-slate-600 text-sm">${d.schedule}</td>
            <td class="p-4 font-mono text-sm ${d.ex==='late'?'text-amber-600 font-semibold':d.ex==='absent'?'text-slate-300':''}">${d.checkin}</td>
            <td class="p-4 font-mono text-sm ${d.ex==='forgot'?'text-orange-500':''}">${d.checkout}</td>
            <td class="p-4 text-right font-semibold text-sm">${d.hours!=null?d.hours.toFixed(1)+' h':'<span class="text-slate-300">—</span>'}</td>
            <td class="p-4">${exBadge(d.ex)}</td>
            <td class="p-4"></td>
          </tr>`).join('');

        const cnt = document.getElementById('attCount');
        if(cnt) cnt.textContent = data.length;

        const totalH = data.reduce((s,d)=>s+(d.hours||0),0);
        const th = document.getElementById('attTotalHours');
        if(th) th.textContent = totalH.toFixed(1)+' giờ';

        lucide.createIcons();
      }

      function filterAttendance(){
        const staff = document.getElementById('attFilterStaff')?.value || '';
        const ex    = document.getElementById('attFilterEx')?.value || '';
        const from  = document.getElementById('attFrom')?.value || '';
        const to    = document.getElementById('attTo')?.value || '';

        const rows = attendanceRows().filter(d=>{
          if(staff && d.name !== staff) return false;
          if(ex && d.ex !== ex) return false;
          if(from && d.rawDate < from) return false;
          if(to && d.rawDate > to) return false;
          return true;
        });

        const title = document.querySelector('[data-screen="mgr-attendance"] h1 + p');
        if(title){
          const fmtDate = v => v ? v.split('-').reverse().join('/') : '';
          title.textContent = `Từ ${fmtDate(from)} – ${fmtDate(to)} · Chi nhánh Quận 1`;
        }

        renderAttendance(rows);
      }
      
      function resetAttendance(){
        const today = new Date();
        today.setHours(0,0,0,0);

        const day = today.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;

        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const ymd = d => d.toISOString().slice(0,10);

        document.getElementById('attFilterStaff').value = '';
        document.getElementById('attFilterEx').value = '';
        document.getElementById('attFrom').value = ymd(monday);
        document.getElementById('attTo').value = ymd(sunday);

        filterAttendance();
      }

      // =========================================================
      // MANAGER: ORDERS
      // =========================================================
      function renderReturnRequestPanel(){
        const panel  = document.getElementById('returnRequestPanel');
        const list   = document.getElementById('returnReqList');
        const badge  = document.getElementById('returnReqBadge');
        if(!panel||!list) return;
        const pending = returnRequests.filter(r=>r.status==='pending');
        if(pending.length===0){ panel.classList.add('hidden'); return; }
        panel.classList.remove('hidden');
        if(badge) badge.textContent = pending.length;
        list.innerHTML = pending.map(r=>`
          <div class="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-amber-50/80">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono font-semibold text-sm text-slate-800">${r.orderId}</span>
                <span class="text-xs text-slate-500">${r.cust}</span>
                <span class="text-xs bg-red-50 border border-red-200 text-red-600 rounded px-1.5 py-0.5 font-medium">Đơn gốc: ${fmt(r.orderTotal)}</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5 truncate">
                <span class="font-medium text-slate-700">Hoàn:</span> ${fmt(r.returnAmount)} &nbsp;·&nbsp;
                <span class="font-medium text-slate-700">Lý do:</span> ${r.reason} &nbsp;·&nbsp;
                <span class="text-slate-400">${r.requestedAt}</span>
              </p>
            </div>
            <div class="flex gap-2 shrink-0">
              <button onclick="approveReturnRequest('${r.id}')"
                class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1">
                <i data-lucide="check" class="w-3 h-3"></i> Duyệt hoàn
              </button>
              <button onclick="rejectReturnRequest('${r.id}')"
                class="bg-white hover:bg-red-50 border border-red-300 text-red-600 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1">
                <i data-lucide="x" class="w-3 h-3"></i> Từ chối
              </button>
            </div>
          </div>`).join('');
        lucide.createIcons();
      }

      function renderMgrOrders(data){
        const t = document.getElementById('mgrOrderRows'); if(!t) return;
        renderReturnRequestPanel();
        if(data.length===0){ t.innerHTML=`<tr><td colspan="7" class="p-8 text-center text-slate-400">Không có đơn hàng nào.</td></tr>`; return; }
        t.innerHTML = data.map(o=>`
          <tr class="hover:bg-slate-50 cursor-pointer" onclick="showOrderDetail('${o.id}')">
            <td class="p-4 font-mono font-semibold">${o.id}</td>
            <td class="p-4 text-slate-500">${o.time}</td>
            <td class="p-4 text-slate-500">Quận 1</td>
            <td class="p-4 text-slate-500">${o.cust}</td>
            <td class="p-4 text-right font-semibold">${fmt(o.total)}</td>
            <td class="p-4"><span class="text-xs text-slate-500">${payMethodLabel(o.payMethod)}</span></td>
            <td class="p-4">${stBadge(o.st)}${o.returnRequest==='pending'?'<span class="ml-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Chờ duyệt hoàn</span>':''}</td>
          </tr>`).join('');
      }

      function filterMgrOrders(){
        const id     = document.getElementById('mgrOrdId').value.trim().toLowerCase();
        const phone  = document.getElementById('mgrOrdPhone').value.trim();
        const status = document.getElementById('mgrOrdStatus').value;

        const filtered = mgrOrders.filter(o=>{
          if(id && !o.id.toLowerCase().includes(id)) return false;
          if(phone && !String(o.phone || '').includes(phone)) return false;
          if(status && o.st !== status) return false;
          return true;
        });

        renderMgrOrders(filtered);
      }

      // =========================================================
      // MANAGER: CUSTOMERS
      // =========================================================
      function renderMgrCustomers(data){
        const t = document.getElementById('mgrCustRows'); if(!t) return;
        t.innerHTML = data.map(c=>`
          <tr class="hover:bg-slate-50 cursor-pointer transition-colors" onclick="openMgrCustDetail('${c.id}')">
            <td class="p-4 font-mono text-slate-500">${c.id}</td>
            <td class="p-4 font-semibold">${c.name}</td>
            <td class="p-4 text-slate-500">${c.phone}</td>
            <td class="p-4 text-right font-semibold text-emerald-600">${c.points.toLocaleString('vi-VN')}</td>
            <td class="p-4"><span class="text-xs px-2 py-1 rounded-full font-medium ${tierBadge[c.tier]}">${c.tier}</span></td>
            <td class="p-4 text-slate-400">${fmtDate(c.regDate)}</td>
            <td class="p-4"><button onclick="event.stopPropagation();openMgrCustDetail('${c.id}')" class="p-1.5 rounded-lg hover:bg-slate-100"><i data-lucide="eye" class="w-4 h-4 text-slate-400"></i></button></td>
          </tr>`).join('');
        lucide.createIcons();
      }

      async function openMgrCustDetail(id){
        const c = customers.find(x=>x.id===id); if(!c) return;
        const cardEl = document.getElementById('mgrCustCard');
        cardEl.className = 'rounded-2xl p-5 text-white w-full sm:w-52 shrink-0 flex flex-col justify-between min-h-[160px] ' + (tierGradient[c.tier]||'bg-gradient-to-br from-slate-400 to-slate-600');
        document.getElementById('mgrCustCardId').textContent   = c.id;
        document.getElementById('mgrCustCardName').textContent = c.name;
        document.getElementById('mgrCustCardTier').textContent = c.tier;
        document.getElementById('mgrCustName').textContent   = c.name;
        document.getElementById('mgrCustPhone').textContent  = c.phone;
        document.getElementById('mgrCustEmail').textContent  = c.email||'—';
        document.getElementById('mgrCustDob').textContent    = c.dob ? c.dob.split('-').reverse().join('/') : '—';
        document.getElementById('mgrCustReg').textContent    = fmtDate(c.regDate);
        document.getElementById('mgrCustPoints').textContent = c.points.toLocaleString('vi-VN') + ' điểm';
        const tierNames      = ['Thành viên','Bạc','Vàng','Kim Cương'];
        const tierThresholds = [0,500,2000,10000];
        const curIdx = tierNames.indexOf(c.tier);
        if(curIdx===3){
          document.getElementById('mgrCustProgressLabel').textContent = '🏆 Đã đạt hạng cao nhất: Kim Cương';
          document.getElementById('mgrCustProgressBar').style.width = '100%';
          document.getElementById('mgrCustProgressTicks').innerHTML = '<span>0</span><span>10.000 ✓</span>';
        } else {
          const nextName=tierNames[curIdx+1], nextThres=tierThresholds[curIdx+1], curThres=tierThresholds[curIdx];
          const pct=Math.min(((c.points-curThres)/(nextThres-curThres))*100,100).toFixed(1);
          document.getElementById('mgrCustProgressLabel').textContent=`${(nextThres-c.points).toLocaleString('vi-VN')} điểm nữa để đạt hạng ${nextName}`;
          document.getElementById('mgrCustProgressBar').style.width=pct+'%';
          document.getElementById('mgrCustProgressTicks').innerHTML=`<span>${curThres.toLocaleString('vi-VN')}</span><span>${Math.round((curThres+nextThres)/2).toLocaleString('vi-VN')}</span><span>${nextThres.toLocaleString('vi-VN')}</span>`;
        }
        const tbody = document.getElementById('mgrCustOrders');
        tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400 text-sm italic">Đang tải lịch sử mua hàng...</td></tr>';

        try{
          const history = await apiGet('/customers/' + id + '/history');

          const stLabel = {
            DaThanhToan: 'Đã thanh toán',
            HoanTra: 'Đã hoàn',
            DaHuy: 'Đã hủy',
            ChoThanhToan: 'Chờ thanh toán'
          };

          const stClass = {
            DaThanhToan: 'bg-emerald-100 text-emerald-700',
            HoanTra: 'bg-blue-100 text-blue-700',
            DaHuy: 'bg-red-100 text-red-700',
            ChoThanhToan: 'bg-amber-100 text-amber-700'
          };

          tbody.innerHTML = history.length === 0
            ? '<tr><td colspan="5" class="p-6 text-center text-slate-400 text-sm italic">Chưa có đơn hàng nào.</td></tr>'
            : history.map(o => `
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-mono text-xs text-slate-500">${o.maHoaDon || o.maDonHang || '—'}</td>
                <td class="p-3 text-slate-600 text-xs">${o.ngayLap ? new Date(o.ngayLap).toLocaleDateString('vi-VN') : '—'}</td>
                <td class="p-3 text-right font-semibold text-sm">${fmt(Number(o.thanhTien || o.tongTien || 0))}</td>
                <td class="p-3 text-right text-emerald-600 font-medium text-sm">${o.diemCong != null ? '+' + o.diemCong : '—'}</td>
                <td class="p-3">
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium ${stClass[o.trangThai] || 'bg-slate-100 text-slate-600'}">
                    ${stLabel[o.trangThai] || o.trangThai || '—'}
                  </span>
                </td>
              </tr>
            `).join('');
        }catch(e){
          tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-red-400 text-sm italic">Lỗi tải lịch sử: ${e.message}</td></tr>`;
        }
        openModal('modalMgrCustDetail');
        lucide.createIcons();
      }

      function filterMgrCustomers(){
        const q    = (document.getElementById('mgrCustSearch')||{}).value?.toLowerCase()||'';
        const tier = (document.getElementById('mgrCustTier')||{}).value||'';
        renderMgrCustomers(customers.filter(c=>{
          if(q    && !c.name.toLowerCase().includes(q) && !c.phone.includes(q) && !c.id.toLowerCase().includes(q)) return false;
          if(tier && c.tier!==tier) return false;
          return true;
        }));
      }

      // =========================================================
      // EXCEL EXPORT (SheetJS via inline base64 fallback)
      // =========================================================
      function exportToCSV(data, filename){
        const keys = Object.keys(data[0]);
        const rows = [keys, ...data.map(row=>keys.map(k=>row[k]))];
        const csv  = rows.map(r=>r.map(x=>`"${String(x||'').replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8;'});
        const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename+'.csv'; a.click();
      }

      // =========================================================
      // XUẤT EXCEL — BÁO CÁO CHẤM CÔNG
      // Dùng SheetJS (XLSX). Cell styles hoạt động nếu dùng xlsx-js-style.
      // Community edition: đúng data, merge cells, col widths.
      // =========================================================
      function exportAttendanceExcel(){
        if(typeof XLSX === 'undefined'){
          toast('SheetJS chưa tải — kiểm tra kết nối mạng','error'); return;
        }
        const today      = new Date();
        const exportDate = today.toLocaleDateString('vi-VN',{weekday:'long',year:'numeric',month:'2-digit',day:'2-digit'});
        const exportTime = today.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
        const statusLabel = { ok:'Đúng giờ', late:'Đi trễ', forgot:'Quên check-out', absent:'Vắng mặt', waiting:'Chờ chấm công' };
        const statusIcon  = { ok:'✓', late:'⚠', forgot:'?', absent:'✗', waiting:'…' };

        const staff = document.getElementById('attFilterStaff')?.value || '';
        const ex    = document.getElementById('attFilterEx')?.value || '';
        const from  = document.getElementById('attFrom')?.value || '';
        const to    = document.getElementById('attTo')?.value || '';

        const exportRows = attendanceRows().filter(d=>{
          if(staff && d.name !== staff) return false;
          if(ex && d.ex !== ex) return false;
          if(from && d.rawDate < from) return false;
          if(to && d.rawDate > to) return false;
          return true;
        });

        if(exportRows.length === 0){
          toast('Không có dữ liệu chấm công để xuất Excel','info');
          return;
        }

        // ── Tổng kết ────────────────────────────────────────────
        const total       = exportRows.length;
        const totalOnTime = exportRows.filter(d=>d.ex==='ok').length;
        const totalLate   = exportRows.filter(d=>d.ex==='late').length;
        const totalForgot = exportRows.filter(d=>d.ex==='forgot').length;
        const totalAbsent = exportRows.filter(d=>d.ex==='absent').length;
        const totalHours  = exportRows.reduce((s,d)=>s+(d.hours||0),0);

        // ── Sheet 1: Chi tiết ───────────────────────────────────
        const NC = 10; // Số cột
        const rows = [];

        // Tiêu đề
        rows.push(['BÁO CÁO CHẤM CÔNG NHÂN VIÊN',...Array(NC-1).fill(null)]);
        rows.push(['Siêu thị eMarket — Chi nhánh Quận 1',...Array(NC-1).fill(null)]);
        
        rows.push([`Xuất lúc: ${exportDate} ${exportTime}`,...Array(NC-1).fill(null)]);
        rows.push(Array(NC).fill(null));
        rows.push([`Kỳ báo cáo: ${from || 'Tất cả'} - ${to || 'Tất cả'}`,...Array(NC-1).fill(null)]);
        // Tổng kết
        rows.push(['TỔNG KẾT TUẦN',...Array(NC-1).fill(null)]);
        rows.push(['Chỉ tiêu','Số lượng','Tỉ lệ (%)','','Chỉ tiêu','Số lượng','Tỉ lệ (%)',...Array(NC-7).fill(null)]);
        rows.push(['Tổng số ca', total, '100%','', 'Đúng giờ', totalOnTime, (totalOnTime/total*100).toFixed(1)+'%', ...Array(NC-7).fill(null)]);
        rows.push(['Đi trễ', totalLate, (totalLate/total*100).toFixed(1)+'%','', 'Quên check-out', totalForgot, (totalForgot/total*100).toFixed(1)+'%', ...Array(NC-7).fill(null)]);
        rows.push(['Vắng mặt', totalAbsent, (totalAbsent/total*100).toFixed(1)+'%','', 'Tổng giờ làm', totalHours.toFixed(1)+' h', '',...Array(NC-7).fill(null)]);
        rows.push(Array(NC).fill(null));

        // Header bảng chi tiết
        rows.push(['CHI TIẾT CHẤM CÔNG',...Array(NC-1).fill(null)]);
        rows.push(Array(NC).fill(null));
        const HDR_IDX = rows.length;
        rows.push(['STT','Mã NV','Họ và tên','Mã ca','Ngày','Ca dự kiến','Check-in TT','Check-out TT','Số giờ','Trạng thái']);

        // Data
        exportRows.forEach((d,i)=>{
          rows.push([
            i+1, d.id, d.name, d.ca, d.date+'/2026', d.schedule,
            d.checkin, d.checkout,
            d.hours!=null ? +d.hours : '—',
            statusIcon[d.ex]+' '+statusLabel[d.ex],
          ]);
        });

        // Dòng tổng cộng
        const TOTAL_IDX = rows.length;
        rows.push(['TỔNG CỘNG',null,null,null,null,null,null,null,+totalHours.toFixed(1),total+' ca']);
        rows.push(Array(NC).fill(null));
        rows.push(Array(NC).fill(null));

        // Chữ ký
        const SIG_IDX = rows.length;
        rows.push(['Người lập báo cáo',null,null,'Quản lý trực tiếp',null,null,'Giám đốc chi nhánh',null,null,null]);
        rows.push(['(Ký, ghi rõ họ tên)',null,null,'(Ký, ghi rõ họ tên)',null,null,'(Ký, ghi rõ họ tên)',null,null,null]);

        const ws1 = XLSX.utils.aoa_to_sheet(rows);

        // Merge cells
        ws1['!merges'] = [
          // Tiêu đề
          {s:{r:0,c:0},e:{r:0,c:NC-1}},
          {s:{r:1,c:0},e:{r:1,c:NC-1}},
          {s:{r:2,c:0},e:{r:2,c:NC-1}},
          {s:{r:3,c:0},e:{r:3,c:NC-1}},
          // Tiêu đề TỔNG KẾT
          {s:{r:5,c:0},e:{r:5,c:NC-1}},
          // Tiêu đề CHI TIẾT
          {s:{r:HDR_IDX-2,c:0},e:{r:HDR_IDX-2,c:NC-1}},
          // Dòng tổng
          {s:{r:TOTAL_IDX,c:0},e:{r:TOTAL_IDX,c:7}},
          // Chữ ký
          {s:{r:SIG_IDX,c:0},e:{r:SIG_IDX,c:2}},
          {s:{r:SIG_IDX,c:3},e:{r:SIG_IDX,c:5}},
          {s:{r:SIG_IDX,c:6},e:{r:SIG_IDX,c:9}},
          {s:{r:SIG_IDX+1,c:0},e:{r:SIG_IDX+1,c:2}},
          {s:{r:SIG_IDX+1,c:3},e:{r:SIG_IDX+1,c:5}},
          {s:{r:SIG_IDX+1,c:6},e:{r:SIG_IDX+1,c:9}},
        ];

        // Column widths
        ws1['!cols'] = [5,9,20,10,12,14,14,14,9,15].map(w=>({wch:w}));

        // Row heights
        ws1['!rows'] = [];
        ws1['!rows'][0]       = {hpt:26};
        ws1['!rows'][HDR_IDX] = {hpt:20};
        ws1['!rows'][TOTAL_IDX] = {hpt:20};

        // Format số giờ
        for(let r=HDR_IDX+1; r<TOTAL_IDX; r++){
          const addr = XLSX.utils.encode_cell({r,c:8});
          if(ws1[addr] && typeof ws1[addr].v === 'number') ws1[addr].z = '0.0';
        }
        const totalHoursAddr = XLSX.utils.encode_cell({r:TOTAL_IDX,c:8});
        if(ws1[totalHoursAddr]) ws1[totalHoursAddr].z = '0.0';

        // ── Sheet 2: Tổng hợp theo nhân viên ──────────────────
        const byStaff = {};
        exportRows.forEach(d=>{
          if(!byStaff[d.id]) byStaff[d.id]={id:d.id,name:d.name,ok:0,late:0,forgot:0,absent:0,hours:0,shifts:0};
          byStaff[d.id].shifts++;
          byStaff[d.id].hours += d.hours||0;
          byStaff[d.id][d.ex] = (byStaff[d.id][d.ex]||0)+1;
        });
        const s2rows = [
          ['TỔNG HỢP CHẤM CÔNG THEO NHÂN VIÊN', null, null, null, null, null, null],
          [`Kỳ báo cáo: ${from || 'Tất cả'} - ${to || 'Tất cả'}`, null, null, null, null, null, null],
          [`Xuất lúc: ${exportDate} ${exportTime}`, null, null, null, null, null, null],
          Array(7).fill(null),
          ['Mã NV','Họ và tên','Tổng ca','✓ Đúng giờ','⚠ Đi trễ','✗ Vắng mặt','Tổng giờ làm'],
          ...Object.values(byStaff).map(s=>[
            s.id, s.name, s.shifts, s.ok, s.late, s.absent, +s.hours.toFixed(1)
          ]),
          Array(7).fill(null),
          [null,'TỔNG',
            Object.values(byStaff).reduce((a,s)=>a+s.shifts,0),
            Object.values(byStaff).reduce((a,s)=>a+s.ok,0),
            Object.values(byStaff).reduce((a,s)=>a+s.late,0),
            Object.values(byStaff).reduce((a,s)=>a+s.absent,0),
            +Object.values(byStaff).reduce((a,s)=>a+s.hours,0).toFixed(1),
          ],
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(s2rows);
        ws2['!merges'] = [
          {s:{r:0,c:0},e:{r:0,c:6}},
          {s:{r:1,c:0},e:{r:1,c:6}},
          {s:{r:2,c:0},e:{r:2,c:6}},
        ];
        ws2['!cols'] = [9,20,9,12,12,13,14].map(w=>({wch:w}));
        // Format giờ
        const staffCount = Object.values(byStaff).length;
        for(let r=5; r<=5+staffCount; r++){
          const addr = XLSX.utils.encode_cell({r,c:6});
          if(ws2[addr] && typeof ws2[addr].v === 'number') ws2[addr].z = '0.0';
        }

        // ── Xuất file ──────────────────────────────────────────
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws1, 'Chi tiết chấm công');
        XLSX.utils.book_append_sheet(wb, ws2, 'Tổng hợp NV');

        const safeFrom = from || 'tat-ca';
        const safeTo = to || 'tat-ca';
        const fname = `ChamCong_${safeFrom}_${safeTo}_${exportTime.replace(':','h')}.xlsx`;
        XLSX.writeFile(wb, fname);
        toast(`✅ Đã xuất báo cáo chấm công (${total} ca, 2 sheet)`, 'success');
      }


      // =========================================================
      // XUẤT EXCEL — BÁO CÁO DOANH THU
      // 2 sheets: Chi tiết kỳ + Tổng hợp tất cả kỳ
      // =========================================================
      function exportRevenueExcel(){
        if(typeof XLSX === 'undefined'){
          toast('SheetJS chưa tải — kiểm tra kết nối mạng','error');
          return;
        }

        const from = document.getElementById('revFrom')?.value || '';
        const to   = document.getElementById('revTo')?.value || '';

        const inRange = o => {
          const d = String(o.rawDate || '').slice(0,10);
          if(from && d < from) return false;
          if(to && d > to) return false;
          return true;
        };

        const rowsInRange = mgrOrders.filter(inRange);

        if(rowsInRange.length === 0){
          toast('Không có dữ liệu doanh thu để xuất Excel','info');
          return;
        }

        const paidOrders = rowsInRange.filter(o => o.st === 'paid');
        const refundCancelOrders = rowsInRange.filter(o => o.st === 'refund' || o.st === 'cancel');

        const totalRevenue = paidOrders.reduce((s,o)=>s + Number(o.total || 0),0);
        const orderCount = paidOrders.length;
        const refundCancelCount = refundCancelOrders.length;
        const avgOrder = orderCount ? totalRevenue / orderCount : 0;
        const refundRate = (orderCount + refundCancelCount)
          ? refundCancelCount * 100 / (orderCount + refundCancelCount)
          : 0;
        const profit = Math.round(totalRevenue * 0.25);

        const today = new Date();
        const exportDate = today.toLocaleDateString('vi-VN');
        const exportTime = today.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});

        const stLabel = {
          paid: 'Đã thanh toán',
          refund: 'Hoàn trả',
          cancel: 'Đã hủy',
          pending: 'Chờ thanh toán'
        };

        const payLabel = {
          cash: 'Tiền mặt',
          qr: 'QR / Chuyển khoản',
          card: 'Thẻ ngân hàng'
        };

        const sheetRows = [
          ['BÁO CÁO DOANH THU - EMARKET'],
          ['Chi nhánh Quận 1'],
          [`Kỳ báo cáo: ${from || 'Tất cả'} - ${to || 'Tất cả'}`],
          [`Xuất lúc: ${exportDate} ${exportTime}`],
          [],
          ['TỔNG QUAN'],
          ['Tổng doanh thu', totalRevenue],
          ['Số đơn đã thanh toán', orderCount],
          ['Trung bình/đơn', Math.round(avgOrder)],
          ['Số đơn hoàn/hủy', refundCancelCount],
          ['Tỉ lệ hoàn/hủy', refundRate.toFixed(1) + '%'],
          ['Lợi nhuận gộp ước tính 25%', profit],
          [],
          ['CHI TIẾT ĐƠN HÀNG'],
          ['Mã đơn', 'Thời gian', 'Khách hàng', 'SĐT', 'Nhân viên', 'PT thanh toán', 'Trạng thái', 'Thành tiền']
        ];

        rowsInRange.forEach(o=>{
          sheetRows.push([
            o.id,
            o.time || '',
            o.cust || 'Khách lẻ',
            o.phone || '',
            o.staffName || o.maNV || '',
            payLabel[o.payMethod] || o.payMethod || '',
            stLabel[o.st] || o.st || '',
            Number(o.total || 0)
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(sheetRows);
        ws['!cols'] = [14,22,22,14,18,18,18,16].map(w=>({wch:w}));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo doanh thu');

        const safeFrom = from || 'tat-ca';
        const safeTo = to || 'tat-ca';
        XLSX.writeFile(wb, `DoanhThu_${safeFrom}_${safeTo}.xlsx`);

        toast(`✅ Đã xuất báo cáo doanh thu (${rowsInRange.length} đơn)`, 'success');
      }

      // =========================================================
      // POS: CART
      // =========================================================
      // ── Product Grid (chọn nhanh) ──
      let gridVisible = true;
      const _gridCatColor = (name)=>{
        const map={'Sữa':'emerald','Mì':'amber','Giặt':'blue','Cola':'red','Trứng':'yellow','Dầu gội':'purple','Bánh':'orange','Ngọt':'sky','Dầu ăn':'lime','Đường':'pink'};
        for(const k in map) if(name.includes(k)) return map[k];
        return 'slate';
      };
      function renderProductGrid(filter=''){
        const grid = document.getElementById('productGrid'); if(!grid) return;
        const q = (filter||'').toLowerCase();
        const list = products.filter(p=>!q||p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q)||(p.barcode&&p.barcode.includes(q)));
        if(!list.length){ grid.innerHTML=`<div class="col-span-4 text-center text-slate-400 text-xs py-4">Không tìm thấy sản phẩm.</div>`; return; }
        grid.innerHTML = list.map(p=>{
          const col = _gridCatColor(p.name);
          const inCart = cart.find(x=>x.id===p.id);
          const badge = inCart?`<span class="absolute top-0.5 right-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">${inCart.qty}</span>`:'';
          return `<button onclick="addToCartFromGrid('${p.id}')" title="${p.name} — ${fmt(p.price)}"
            class="relative text-left rounded-xl p-2 border-2 transition-all ${inCart?'border-emerald-500 bg-emerald-50':'border-slate-200 bg-white hover:border-emerald-300'}">
            ${badge}
            <div class="w-8 h-8 rounded-lg bg-${col}-100 flex items-center justify-center mb-1 mx-auto">
              <span class="text-${col}-600 text-[11px] font-bold">${p.id.replace('SP','')}</span>
            </div>
            <p class="text-[10px] font-medium text-slate-700 leading-tight truncate">${p.name}</p>
            <p class="text-[10px] text-emerald-600 font-semibold mt-0.5">${(p.price/1000).toFixed(0)}k</p>
          </button>`;
        }).join('');
      }
      function filterProductGrid(){
        renderProductGrid(document.getElementById('barcodeInput')?.value||'');
      }
      function addToCartFromGrid(id){
        if(!shiftOpen){ toast('Vui lòng mở ca trước khi bán hàng','warning'); return; }
        const p = products.find(x=>x.id===id); if(!p) return;
        const item = cart.find(x=>x.id===p.id);
        if(item) item.qty++; else cart.push({...p,qty:1});
        renderCartUI();
        renderProductGrid(document.getElementById('barcodeInput')?.value||'');
        toast('Đã thêm: '+p.name,'success');
      }
      function toggleProductGrid(){
        gridVisible=!gridVisible;
        const grid=document.getElementById('productGrid');
        const icon=document.getElementById('gridToggleIcon');
        const label=document.getElementById('gridToggleLabel');
        if(grid) grid.style.display=gridVisible?'grid':'none';
        if(icon){ icon.setAttribute('data-lucide',gridVisible?'chevron-up':'chevron-down'); lucide.createIcons(); }
        if(label) label.textContent=gridVisible?'Thu gọn':'Mở rộng';
      }

      function scanBarcode(){
        if(!shiftOpen){ toast('Vui lòng mở ca trước khi bán hàng','warning'); return; }
        const q = document.getElementById('barcodeInput').value.trim();
        if(!q) return;
        const p = products.find(x=>x.barcode===q || x.name.toLowerCase().includes(q.toLowerCase()) || x.id.toLowerCase()===q.toLowerCase());
        if(!p){ toast('Không tìm thấy sản phẩm: '+q,'error'); document.getElementById('barcodeInput').value=''; return; }
        const item = cart.find(x=>x.id===p.id);
        if(item){ item.qty++; }
        else { cart.push({...p, qty:1}); }
        document.getElementById('barcodeInput').value='';
        renderCartUI();
        toast('Đã thêm: '+p.name,'success');
      }

      function renderCartUI(){
        const body  = document.getElementById('cartBody');
        const empty = document.getElementById('cartEmpty');
        if(!body) return;
        if(cart.length===0){ if(body) body.innerHTML=''; if(empty) empty.classList.remove('hidden'); }
        else {
          if(empty) empty.classList.add('hidden');
          body.innerHTML = cart.map((item,i)=>`
            <tr class="hover:bg-slate-50">
              <td class="px-4 py-3"><p class="font-medium text-sm">${item.name}</p><p class="text-xs text-slate-400">${item.barcode}</p></td>
              <td class="px-4 py-3 text-slate-500 text-sm">${item.unit}</td>
              <td class="px-4 py-3 text-right text-sm">${fmt(item.price)}</td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button onclick="changeQty(${i},-1)" class="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold">−</button>
                  <input type="number" min="1" value="${item.qty}" onchange="setQty(${i},this.value)" class="w-12 text-center border border-slate-200 rounded text-sm py-0.5"/>
                  <button onclick="changeQty(${i},1)" class="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold">+</button>
                </div>
              </td>
              <td class="px-4 py-3 text-right font-semibold text-sm text-emerald-700">${fmt(item.qty*item.price)}</td>
              <td class="px-4 py-3 text-center"><button onclick="removeCartItem(${i})" class="text-slate-300 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
            </tr>`).join('');
        }
        updateBillSummary();
        lucide.createIcons();
      }

      function changeQty(i, delta){
        cart[i].qty = Math.max(1, cart[i].qty + delta);
        renderCartUI(); renderProductGrid(document.getElementById('barcodeInput')?.value||'');
      }

      function setQty(i, val){
        const n = parseInt(val);
        if(n>=1) cart[i].qty=n;
        renderCartUI(); renderProductGrid(document.getElementById('barcodeInput')?.value||'');
      }

      function removeCartItem(i){
        cart.splice(i,1);
        renderCartUI(); renderProductGrid(document.getElementById('barcodeInput')?.value||'');
      }

      function updateBillSummary(){
        const subtotal = cart.reduce((s,x)=>s+x.qty*x.price, 0);
        const disc  = posCustomer ? Math.floor(subtotal * tierDiscount[posCustomer.tier]) : 0;
        const total = subtotal - disc;
        const pts   = Math.floor(total/10000*0.5);
        const sub = document.getElementById('billSubtotal'); if(sub) sub.textContent=fmt(subtotal);
        const dis = document.getElementById('billDiscount'); if(dis) dis.textContent='-'+fmt(disc);
        const tot = document.getElementById('billTotal');    if(tot) tot.textContent=fmt(total);
        const p   = document.getElementById('billPoints');   if(p)   p.textContent='+'+pts+' điểm';
        calcChange();
      }

      function calcChange(){
        const total   = cart.reduce((s,x)=>s+x.qty*x.price, 0) - (posCustomer ? Math.floor(cart.reduce((s,x)=>s+x.qty*x.price,0)*tierDiscount[posCustomer.tier]) : 0);
        const given   = parseFloat((document.getElementById('cashGiven')||{}).value)||0;
        const change  = given - total;
        const el      = document.getElementById('changeAmt');
        if(el){ el.textContent=fmt(Math.max(0,change)); el.className = change<0&&given>0?'font-bold text-lg text-red-600':'font-bold text-lg text-slate-900'; }
      }

      function setPayMethod(pm){
        payMethod = pm;
        document.querySelectorAll('.pmBtn').forEach(b=>b.className='pmBtn border-2 border-slate-200 text-slate-500 rounded-xl p-3 flex flex-col items-center gap-1 text-xs font-medium transition-all hover:border-slate-300');
        const active = document.getElementById('pm-'+pm);
        if(active) active.className='pmBtn border-2 border-emerald-500 bg-emerald-50 text-emerald-700 rounded-xl p-3 flex flex-col items-center gap-1 text-xs font-medium transition-all';
        const cashPanel = document.getElementById('cashPanel');
        if(cashPanel) cashPanel.style.display = pm==='cash' ? 'block' : 'none';
      }

      function applyPosCustomerSelection(c){
        posCustomer = c;
        const found = document.getElementById('custFound');
        const notFound = document.getElementById('custNotFound');
        if(notFound) notFound.classList.add('hidden');
        if(found){
          found.classList.remove('hidden');
          document.getElementById('custAvatarPOS').textContent=c.name.charAt(0);
          document.getElementById('custNamePOS').textContent=c.name;
          document.getElementById('custTierPOS').textContent=c.tier;
          document.getElementById('custTierPOS').className='text-xs px-2 py-0.5 rounded-full '+tierBadge[c.tier];
          document.getElementById('custPointsPOS').textContent=c.points.toLocaleString('vi-VN')+' điểm';
          const disc = tierDiscount[c.tier];
          document.getElementById('custDiscPOS').textContent=disc>0?'Giảm '+Math.round(disc*100)+'%':'Chưa có ưu đãi';
        }
        const inp=document.getElementById('custSearchInput'); if(inp) inp.value=c.phone;
        updateBillSummary();
      }

      function searchPosCustomer(){
        const q = (document.getElementById('custSearchInput')||{}).value?.trim()||'';
        const found = document.getElementById('custFound');
        const notFound = document.getElementById('custNotFound');
        const c = customers.find(x=>x.phone===q);
        if(!c){
          if(found) found.classList.add('hidden');
          if(notFound) notFound.classList.remove('hidden');
          posCustomer=null;
          updateBillSummary();
          return;
        }
        applyPosCustomerSelection(c);
        toast('Đã tìm thấy: '+c.name+' ('+c.tier+')','success');
      }

      function renderPosCustomerList(data){
        const t = document.getElementById('posCustRows'); if(!t) return;
        if(data.length===0){
          t.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">Không tìm thấy khách hàng phù hợp.</td></tr>`;
          return;
        }
        t.innerHTML = data.map(c=>{
          const disc = tierDiscount[c.tier];
          const isSelected = posCustomer && posCustomer.id===c.id;
          return `<tr class="hover:bg-slate-50 ${isSelected?'bg-emerald-50/60':''}">
            <td class="p-4 font-mono text-slate-500">${c.id}</td>
            <td class="p-4 font-semibold">${c.name}</td>
            <td class="p-4 text-slate-500">${c.phone}</td>
            <td class="p-4 text-right font-semibold text-emerald-600">${c.points.toLocaleString('vi-VN')}</td>
            <td class="p-4"><span class="text-xs px-2 py-1 rounded-full font-medium ${tierBadge[c.tier]}">${c.tier}</span></td>
            <td class="p-4 text-slate-500 text-xs">${disc>0?'Giảm '+Math.round(disc*100)+'%':'—'}</td>
            <td class="p-4">${isSelected
              ? `<span class="text-xs font-semibold text-emerald-600 flex items-center gap-1"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Đang chọn</span>`
              : `<button onclick="pickPosCustomerFromList('${c.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">Chọn cho đơn</button>`}</td>
          </tr>`;
        }).join('');
        lucide.createIcons();
      }

      function filterPosCustomerList(){
        const q = (document.getElementById('posCustSearch')||{}).value?.trim().toLowerCase()||'';
        renderPosCustomerList(customers.filter(c=>!q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.id.toLowerCase().includes(q)));
      }

      function pickPosCustomerFromList(id){
        const c = customers.find(x=>x.id===id);
        if(!c) return;
        applyPosCustomerSelection(c);
        setPosTab('pos-sell');
        toast('Đã chọn khách hàng: '+c.name+' — chuyển sang Đơn hàng mới','success');
      }

      function clearPosCustomer(){
        posCustomer=null;
        const found=document.getElementById('custFound');    if(found) found.classList.add('hidden');
        const nf=document.getElementById('custNotFound');    if(nf) nf.classList.add('hidden');
        const inp=document.getElementById('custSearchInput'); if(inp) inp.value='';
        updateBillSummary();
      }

      function cancelOrder(){
        const subtotal = cart.reduce((s,x)=>s+x.qty*x.price,0);
        if(subtotal>=3000000){
          document.getElementById('otpInput').value='';
          document.getElementById('otpErr').classList.add('hidden');
          openModal('modalOtp');
        } else {
          if(cart.length===0){ toast('Giỏ hàng đã trống','info'); return; }
          cart=[]; clearPosCustomer(); renderCartUI(); toast('Đã hủy đơn hàng','warning');
        }
      }

      function confirmOtp(){
        const code = document.getElementById('otpInput').value.trim();
        const err  = document.getElementById('otpErr');
        if(code!=='1234'){ err.classList.remove('hidden'); return; }
        closeModal('modalOtp');
        cart=[]; clearPosCustomer(); renderCartUI(); toast('Đã hủy đơn hàng (đã xác minh OTP)','warning');
      }

      async function checkout(){
        if(window._checkingOut) return;           // chặn bấm trùng -> tránh tạo đơn/trừ kho 2 lần
        if(!shiftOpen){ toast('Vui lòng mở ca trước khi thanh toán','warning'); return; }
        if(cart.length===0){ toast('Giỏ hàng trống','error'); return; }
        const subtotal = cart.reduce((s,x)=>s+x.qty*x.price,0);
        const disc     = posCustomer ? Math.floor(subtotal*tierDiscount[posCustomer.tier]) : 0;
        const total    = subtotal - disc;
        const given    = parseFloat((document.getElementById('cashGiven')||{}).value)||0;
        // Bắt buộc nhập tiền khách đưa khi thanh toán tiền mặt
        if(payMethod==='cash'){
          const errEl = document.getElementById('cashGivenErr');
          if(!given||given<=0){
            errEl.textContent='Vui lòng nhập số tiền khách đưa.';
            errEl.classList.remove('hidden');
            document.getElementById('cashGiven')?.focus();
            return;
          }
          if(given<total){
            errEl.textContent='Tiền khách đưa ('+fmt(given)+') phải ≥ thành tiền ('+fmt(total)+').';
            errEl.classList.remove('hidden');
            document.getElementById('cashGiven')?.focus();
            return;
          }
          errEl.classList.add('hidden');
        }
        // Với QR/thẻ coi như khách đưa đúng số tiền
        const soTienKhachDua = payMethod==='cash' ? given : total;

        let receipt, createdId;
        window._checkingOut = true;
        try{
          // 1) Tạo đơn (trạng thái ChoThanhToan) trên SQL
          const items = cart.map(x=>({ maSanPham:x.id, soLuong:x.qty }));
          const created = await apiPost('/orders', {
            maCaBH: window.maCaBH,
            maNV: (window.currentUser||{}).maNV,
            maKhachHang: posCustomer ? posCustomer.id : null,
            items
          });
          createdId = created.maDonHang;
          // 2) Thanh toán -> server tự tính giảm giá theo hạng + điểm, trả phiếu thu
          const pay = await apiPost('/orders/'+created.maDonHang+'/checkout', {
            hinhThuc: payToHinhThuc[payMethod] || 'TienMat',
            soTienKhachDua
          });
          receipt = pay.phieuThu;        // { tongTienHD, tienGiam, thanhTien, soTienKhachDua, soTienTraLai, diemCong }
        }catch(e){ toast('Thanh toán thất bại: '+e.message,'error'); return; }
        finally{ window._checkingOut = false; }

        // Hiển thị phiếu thu theo số liệu THẬT từ server
        document.getElementById('receiptItems').innerHTML = cart.map(x=>`<div class="flex justify-between"><span>${x.name} x${x.qty}</span><span>${fmt(x.qty*x.price)}</span></div>`).join('');
        document.getElementById('receiptSubtotal').textContent = fmt(Number(receipt.tongTienHD));
        document.getElementById('receiptDisc').textContent     = '-'+fmt(Number(receipt.tienGiam));
        document.getElementById('receiptTotal').textContent    = fmt(Number(receipt.thanhTien));
        document.getElementById('receiptMethod').textContent   = payMethodLabel(payMethod);
        document.getElementById('receiptGiven').textContent    = payMethod==='cash'?fmt(Number(receipt.soTienKhachDua)):'N/A';
        document.getElementById('receiptChange').textContent   = payMethod==='cash'?fmt(Number(receipt.soTienTraLai)):'0 đ';
        document.getElementById('receiptPoints').textContent   = '+'+Number(receipt.diemCong)+' điểm';
        // Thêm vào danh sách đơn gần đây của POS (hiển thị cục bộ)
        const newOrder = { id:createdId, time:new Date().toLocaleString('vi-VN'), cust:posCustomer?posCustomer.name:'Khách lẻ', total:Number(receipt.thanhTien), payMethod, st:'paid', items:cart.map(x=>({name:x.name,qty:x.qty,price:x.price})) };
        orders.unshift(newOrder);
        shiftSales.push({ payMethod, total:Number(receipt.thanhTien) });   // ghi doanh thu ca hiện tại
        cart=[]; clearPosCustomer(); renderCartUI(); await loadProducts();   // refresh tồn kho
        loadPosOrders();
        openModal('modalReceipt');
        toast('Thanh toán thành công!','success');
      }

      function initials(name){
        const parts = String(name||'').trim().split(/\s+/);
        const a = parts[parts.length-2]?.charAt(0)||'';
        const b = parts[parts.length-1]?.charAt(0)||'';
        return (a+b).toUpperCase();
      }

      let gateShiftType = 'morning';

      function selectGateShift(type, btn){
        gateShiftType = type;
        document.querySelectorAll('.gateShiftBtn').forEach(b=>{
          b.classList.remove('border-emerald-500','bg-emerald-50');
          b.classList.add('border-slate-200');
        });
        btn.classList.remove('border-slate-200');
        btn.classList.add('border-emerald-500','bg-emerald-50');
      }

      function setGateCash(v){
        document.getElementById('gateOpenCash').value = v;
        updateGateCashPreview();
      }

      function updateGateCashPreview(){
        const v = parseFloat(document.getElementById('gateOpenCash').value)||0;
        document.getElementById('gateCashPreview').textContent = fmt(v);
        document.querySelectorAll('.gateCashPreset').forEach(b=>{
          const match = parseInt(b.dataset.val)===v;
          b.classList.toggle('border-emerald-500', match);
          b.classList.toggle('bg-emerald-50', match);
          b.classList.toggle('text-emerald-700', match);
          b.classList.toggle('border-slate-200', !match);
          b.classList.toggle('text-slate-600', !match);
        });
      }

      // Hiện cổng mở ca cho NV vừa đăng nhập POS
      function showOpenShiftGate(data){
        document.getElementById('gateStaffName').textContent = data.tenNV;
        document.getElementById('gateStaffRole').textContent =
          (data.vaiTro==='QuanLy'?'Quản lý':'Thu ngân') + ' · ' + data.maNV +
          (data.tenChiNhanh? ' · '+data.tenChiNhanh : '');
        document.getElementById('gateStaffAvatar').textContent = initials(data.tenNV);
        const gate = document.getElementById('posOpenShiftGate');
        gate.classList.remove('hidden'); gate.classList.add('flex');
        document.getElementById('app-thu_ngan').classList.add('hidden');
        document.getElementById('app-thu_ngan').classList.remove('flex');
        updateGateCashPreview();
        lucide.createIcons();
      }

      // Có ca chưa đóng -> bắt đóng ca trước khi mở ca mới
      function promptCloseShift(openShift){
        window.maCaBH = openShift.maCaBH;
        shiftOpen = true;
        posOpenShiftCash = Number(openShift.tienDauCa)||0;
        shiftSales = [];                       // chưa có đơn nào của ca này ở phiên hiện tại
        renderCloseShiftPreview();
        const el=(id,t)=>{ const e=document.getElementById(id); if(e) e.textContent=t; };
        el('closeShiftStamp', '⚠ Ca trước ('+openShift.maCaBH+') chưa được đóng. Vui lòng đóng ca này trước khi mở ca mới.');
        const cnt=document.getElementById('closeShiftCounted'); if(cnt) cnt.value='';
        const diff=document.getElementById('closeShiftDiff'); if(diff) diff.classList.add('hidden');
        openModal('modalCloseShift');
        toast('Ca trước chưa đóng — hãy đóng ca để tiếp tục','warning');
        lucide.createIcons();
      }

      async function confirmOpenShiftGate(){
        if(window._openingShift) return;          // chặn bấm trùng (double-click)
        const cash = parseFloat(document.getElementById('gateOpenCash').value)||0;
        const err = document.getElementById('gateCashErr');
        if(cash<=0){ err.classList.remove('hidden'); toast('Vui lòng nhập số tiền đầu ca hợp lệ','error'); return; }
        err.classList.add('hidden');
        window._openingShift = true;
        // Mở ca thật trên SQL
        try{
          const u = window.currentUser || {};
          const q = window.currentQuay || {};
          const res = await apiPost('/shifts/sales/open', {
            maNV: u.maNV, maQuay: q.maQuay, tienDauCa: cash
          });
          window.maCaBH = res.maCaBH;
        }catch(e){
          // Còn ca chưa đóng -> mở lại modal đóng ca thay vì chỉ báo lỗi
          if(/chưa đóng/i.test(e.message)){
            try{
              const u = window.currentUser || {};
              const openShift = await apiGet('/shifts/sales/open?maNV='+encodeURIComponent(u.maNV));
              if(openShift && openShift.maCaBH){ promptCloseShift(openShift); return; }
            }catch(_){}
          }
          toast('Mở ca thất bại: '+e.message,'error'); return;
        }finally{
          window._openingShift = false;
        }
        shiftOpen=true; posOpenShiftCash=cash; shiftSales=[];
        const gate = document.getElementById('posOpenShiftGate');
        gate.classList.add('hidden'); gate.classList.remove('flex');
        document.getElementById('app-thu_ngan').classList.remove('hidden');
        document.getElementById('app-thu_ngan').classList.add('flex');
        const banner = document.getElementById('posShiftBanner');
        if(banner) banner.classList.add('hidden');
        const badge = document.getElementById('posShiftBadge');
        if(badge){ badge.textContent='● Ca đang mở ('+(gateShiftType==='morning'?'Sáng':'Chiều')+')'; badge.className='text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-medium'; }
        initRole('thu_ngan');
        await loadProducts();          // tải sản phẩm thật từ SQL
        lucide.createIcons();
        toast('Đã mở ca! Mã ca: '+window.maCaBH+' · Đầu ca '+fmt(cash),'success');
      }

      function openShift(){
        const cash = parseFloat(document.getElementById('openShiftCash').value)||0;
        if(cash<0){ toast('Số tiền đầu ca không hợp lệ','error'); return; }
        shiftOpen=true; posOpenShiftCash=cash;
        const banner = document.getElementById('posShiftBanner');
        if(banner) banner.classList.add('hidden');
        const badge = document.getElementById('posShiftBadge');
        if(badge){ badge.textContent='● Ca đang mở'; badge.className='text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-medium'; }
        closeModal('modalOpenShift');
        toast('Đã mở ca thành công! Đầu ca: '+fmt(cash),'success');
      }

      async function confirmCloseShift(){
        const counted = parseFloat(document.getElementById('closeShiftCounted')?.value);
        const diffEl = document.getElementById('closeShiftDiff');
        if(isNaN(counted) || counted < 0){
          if(diffEl){ diffEl.textContent='Vui lòng nhập số tiền mặt kiểm đếm.'; diffEl.className='mt-2 text-sm font-semibold text-center text-red-600'; diffEl.classList.remove('hidden'); }
          return;
        }
        let kq;
        try{
          // Đóng ca thật trên SQL -> trả bảng đối soát
          kq = await apiPost('/shifts/sales/'+window.maCaBH+'/close', { tienMatKiemDem: counted });
        }catch(e){
          if(diffEl){ diffEl.textContent='Đóng ca thất bại: '+e.message; diffEl.className='mt-2 text-sm font-semibold text-center text-red-600'; diffEl.classList.remove('hidden'); }
          return;
        }
        const chenh = Number(kq.chenhLech);
        const tonHat = chenh===0 ? 'Khớp két' : (chenh>0 ? 'Thừa '+fmt(chenh) : 'Thiếu '+fmt(Math.abs(chenh)));

        shiftOpen=false; posOpenShiftCash=0; cart=[]; clearPosCustomer(); renderCartUI();
        window.maCaBH=null;
        closeModal('modalCloseShift');
        if(diffEl) diffEl.classList.add('hidden');
        const cnt=document.getElementById('closeShiftCounted'); if(cnt) cnt.value='';
        const badge = document.getElementById('posShiftBadge');
        if(badge){ badge.textContent='⚠ Chưa mở ca'; badge.className='text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-medium'; }
        const banner = document.getElementById('posShiftBanner');
        if(banner) banner.classList.remove('hidden');
        // Quay về cổng mở ca cho ca kế tiếp
        document.getElementById('app-thu_ngan').classList.add('hidden');
        document.getElementById('app-thu_ngan').classList.remove('flex');
        const gateInp = document.getElementById('gateOpenCash');
        if(gateInp) gateInp.value='2000000';
        updateGateCashPreview();
        const gate = document.getElementById('posOpenShiftGate');
        gate.classList.remove('hidden'); gate.classList.add('flex');
        lucide.createIcons();
        toast('Đã đóng ca. Doanh thu '+fmt(Number(kq.tongDoanhThu))+' · '+tonHat,
              chenh===0?'success':'warning');
      }

      // Pre-fill close shift modal
      // Tính & hiển thị doanh thu ca hiện tại lên modal đóng ca
      function renderCloseShiftPreview(){
        const cashRev  = shiftSales.filter(o=>o.payMethod==='cash').reduce((s,o)=>s+o.total,0);
        const qrRev    = shiftSales.filter(o=>o.payMethod==='qr').reduce((s,o)=>s+o.total,0);
        const cardRev  = shiftSales.filter(o=>o.payMethod==='card').reduce((s,o)=>s+o.total,0);
        const totalRev = cashRev+qrRev+cardRev;
        const el=(id,t)=>{ const e=document.getElementById(id); if(e) e.textContent=t; };
        el('closeShiftOpenCash', fmt(posOpenShiftCash));
        el('closeShiftCashRev',  fmt(cashRev));
        el('closeShiftTotalCash',fmt(posOpenShiftCash+cashRev));
        el('closeShiftOrderCount',`Doanh thu ca (${shiftSales.length} hóa đơn)`);
        el('closeShiftCash2',    fmt(cashRev));
        el('closeShiftQR',       fmt(qrRev));
        el('closeShiftCard',     fmt(cardRev));
        el('closeShiftTotal',    fmt(totalRev));
      }
      // Mở modal đóng ca: tính sẵn doanh thu rồi mới hiện
      function openCloseShift(){
        renderCloseShiftPreview();
        const stamp=document.getElementById('closeShiftStamp'); if(stamp) stamp.textContent=new Date().toLocaleString('vi-VN');
        const cnt=document.getElementById('closeShiftCounted'); if(cnt) cnt.value='';
        const diff=document.getElementById('closeShiftDiff'); if(diff) diff.classList.add('hidden');
        openModal('modalCloseShift');
      }
      document.getElementById('modalCloseShift').addEventListener('click', renderCloseShiftPreview, true);

      // =========================================================
      // POS: ORDER LOOKUP
      // =========================================================
      function setPosTab(tab){
        ['pos-sell','pos-lookup','pos-customer'].forEach(id=>{
          const el = document.getElementById(id);
          if(el){ el.classList.remove('active'); el.style.display='none'; }
        });
        const target = document.getElementById(tab);
        if(target){ target.style.display='flex'; target.classList.add('active'); }
        const tabIds = {'pos-sell':'tab-sell','pos-lookup':'tab-lookup','pos-customer':'tab-customer'};
        Object.values(tabIds).forEach(t=>{ const b=document.getElementById(t); if(b) b.className='postab px-4 py-1.5 rounded-lg text-slate-400 hover:text-white font-medium text-xs transition-colors'; });
        const activeTab = document.getElementById(tabIds[tab]);
        if(activeTab) activeTab.className='postab px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs transition-colors';
        if(tab==='pos-lookup') loadPosOrders();
        if(tab==='pos-customer') renderPosCustomerList(customers);
      }

      function renderPosOrders(data){
        const t = document.getElementById('posLookupRows'); if(!t) return;
        if(!data || data.length===0){ t.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">Không có đơn hàng.</td></tr>`; return; }
        t.innerHTML = data.map(o=>{
          let actionHtml;
          if(o.st==='pending'){
            actionHtml = `<div class="flex gap-1.5 justify-end">
              <button onclick="event.stopPropagation();payParkedOrder('${o.id}')" class="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-1.5 transition-colors">Thanh toán</button>
              <button onclick="event.stopPropagation();cancelLookupOrder('${o.id}')" class="text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-lg px-3 py-1.5 transition-colors">Hủy đơn</button>
            </div>`;
          } else if(o.st==='paid'){
            actionHtml = `<button onclick="event.stopPropagation();openReturnModal('${o.id}')" class="text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-lg px-3 py-1.5 transition-colors">Hoàn hàng</button>`;
          } else {
            actionHtml = `<span class="text-slate-300"><i data-lucide="chevron-right" class="w-4 h-4"></i></span>`;
          }
          return `
          <tr class="hover:bg-emerald-50/50 cursor-pointer" onclick="showOrderDetail('${o.id}')">
            <td class="p-4 font-mono font-semibold text-sm">${o.id}</td>
            <td class="p-4 text-slate-500">${o.time}</td>
            <td class="p-4 text-slate-500">${o.cust}</td>
            <td class="p-4 text-right font-semibold">${fmt(o.total)}</td>
            <td class="p-4"><span class="text-xs text-slate-500">${payMethodLabel(o.payMethod)}</span></td>
            <td class="p-4">${stBadge(o.st)}</td>
            <td class="p-4">${actionHtml}</td>
          </tr>`;
        }).join('');
        lucide.createIcons();
      }

      function filterPosOrders(){
        const id     = document.getElementById('lookupId').value.trim().toLowerCase();
        const phone  = document.getElementById('lookupPhone').value.trim();
        const status = document.getElementById('lookupStatus').value;
        renderPosOrders(posOrders.filter(o=>{
          if(id    && !o.id.toLowerCase().includes(id)) return false;
          if(phone && !(o.phone||'').includes(phone))   return false;   // tìm theo SĐT độc lập
          if(status && o.st!==status) return false;
          return true;
        }));
      }

      // Lưu đơn ở trạng thái CHỜ THANH TOÁN (tạo đơn, chưa thu tiền, chưa trừ kho)
      async function holdOrder(){
        if(window._holdingOrder) return;
        if(!shiftOpen){ toast('Vui lòng mở ca trước','warning'); return; }
        if(cart.length===0){ toast('Giỏ hàng trống','error'); return; }
        window._holdingOrder = true;
        try{
          const items = cart.map(x=>({ maSanPham:x.id, soLuong:x.qty }));
          const created = await apiPost('/orders', {
            maCaBH: window.maCaBH, maNV: (window.currentUser||{}).maNV,
            maKhachHang: posCustomer ? posCustomer.id : null, items
          });
          toast('Đã lưu đơn '+created.maDonHang+' (chờ thanh toán)','success');
        }catch(e){ toast('Lưu đơn thất bại: '+e.message,'error'); return; }
        finally{ window._holdingOrder = false; }
        cart=[]; clearPosCustomer(); renderCartUI();
      }

      // Thanh toán cho một đơn đang chờ (từ màn tra cứu)
      let payParkedId=null, payParkedTotal=0;
      function payParkedOrder(id){
        const o = posOrders.find(x=>x.id===id); if(!o) return;
        if(o.st!=='pending'){ toast('Đơn này không ở trạng thái chờ thanh toán','warning'); return; }
        payParkedId=id; payParkedTotal=o.total;
        document.getElementById('payParkedInfo').textContent = `${o.id} · ${o.cust} · ${fmt(o.total)}`;
        document.getElementById('payParkedTotal').textContent = fmt(o.total);
        document.getElementById('payParkedMethod').value='TienMat';
        document.getElementById('payParkedCash').value='';
        togglePayParkedCash();
        openModal('modalPayParked');
        lucide.createIcons();
      }
      function togglePayParkedCash(){
        const m=document.getElementById('payParkedMethod').value;
        document.getElementById('payParkedCashWrap').classList.toggle('hidden', m!=='TienMat');
      }
      async function confirmPayParked(){
        if(window._payingParked) return;
        const method=document.getElementById('payParkedMethod').value;
        let given=payParkedTotal;
        if(method==='TienMat'){
          given=parseFloat(document.getElementById('payParkedCash').value)||0;
          if(given<payParkedTotal){ toast('Tiền khách đưa phải ≥ '+fmt(payParkedTotal),'error'); return; }
        }
        window._payingParked = true;
        let pay;
        try{ pay = await apiPost('/orders/'+payParkedId+'/checkout', { hinhThuc:method, soTienKhachDua:given }); }
        catch(e){ toast('Thanh toán thất bại: '+e.message,'error'); return; }
        finally{ window._payingParked = false; }
        const r = pay.phieuThu||{};
        const pm = method==='TienMat'?'cash':(method==='ChuyenKhoan'?'qr':'card');
        shiftSales.push({ payMethod:pm, total:Number(r.thanhTien||payParkedTotal) });
        closeModal('modalPayParked');
        await loadPosOrders();
        toast('Đã thanh toán đơn '+payParkedId+(method==='TienMat'?' · thối '+fmt(Number(r.soTienTraLai||0)):''),'success');
        payParkedId=null;
      }

      // Hủy đơn CHƯA thanh toán (sp_HuyDon). Đơn >=3tr cần OTP của Quản lý.
      async function cancelLookupOrder(id){
        const o = posOrders.find(x=>x.id===id); if(!o) return;
        if(o.st!=='pending'){ toast('Chỉ hủy được đơn CHƯA thanh toán','warning'); return; }
        const reason = prompt('Nhập lý do hủy đơn '+o.id+':');
        if(reason===null) return;
        if(!reason.trim()){ toast('Vui lòng nhập lý do hủy','error'); return; }
        let otp = null;
        if(o.total >= 3000000){
          try{
            const r = await apiPost('/orders/'+id+'/cancel-otp', {});
            otp = prompt('Đơn ≥ 3.000.000đ cần OTP xác nhận của Quản lý.\n(OTP demo: '+r.otp+')\nNhập OTP:');
          }catch(e){ toast('Không tạo được OTP: '+e.message,'error'); return; }
          if(otp===null) return;
        } else {
          if(!confirm('Xác nhận hủy đơn '+o.id+' ('+fmt(o.total)+')?')) return;
        }
        try{
          await apiPost('/orders/'+id+'/cancel', { maNV:(window.currentUser||{}).maNV, lyDo:reason, otp });
        }catch(e){ toast('Hủy đơn thất bại: '+e.message,'error'); return; }
        await loadPosOrders();
        toast('Đã hủy đơn '+o.id,'success');
      }

      // =========================================================
      // POS: RETURN (hoàn hàng)
      // Đơn hàng < 3.000.000đ: thu ngân tự xử lý hoàn hàng ngay.
      // Đơn hàng ≥ 3.000.000đ: gửi yêu cầu, cần quản lý xác nhận.
      // =========================================================
      const RETURN_APPROVAL_THRESHOLD = 3000000;
      let returnRequests = [];
      let returnReqSeq = 1;

      async function openReturnModal(orderId){
        const o = posOrders.find(x=>x.id===orderId);
        if(!o){ toast('Không tìm thấy đơn hàng','error'); return; }
        if(o.st!=='paid'){ toast('Chỉ có thể hoàn đơn hàng đã thanh toán','warning'); return; }
        let items;
        try{
          const d = await apiGet('/orders/'+orderId);   // { donHang, chiTiet }
          items = (d.chiTiet||[]).map(x=>({ maSanPham:x.maSanPham, name:x.tenSanPham, qty:Number(x.soLuong), price:Number(x.donGia) }));
        }catch(e){ toast('Lỗi tải chi tiết đơn: '+e.message,'error'); return; }
        if(!items.length){ toast('Đơn không có sản phẩm để hoàn','warning'); return; }
        returnOrder = { id:o.id, cust:o.cust, total:o.total, time:o.time, items };
        document.getElementById('returnOrderInfo').textContent = `${o.id} · ${o.cust} · ${fmt(o.total)} · ${o.time}`;
        document.getElementById('returnReason').value = '';
        document.getElementById('returnItemRows').innerHTML = items.map(item=>`
          <tr>
            <td class="p-3 font-medium">${item.name}</td>
            <td class="p-3 text-right text-slate-500">${item.qty}</td>
            <td class="p-3 text-center"><input type="number" min="0" max="${item.qty}" value="0" class="w-16 text-center border border-slate-300 rounded-lg py-1 text-sm" oninput="calcReturnTotal()"/></td>
            <td class="p-3 text-right text-slate-500">${fmt(item.price)}</td>
            <td class="p-3 text-right font-semibold returnAmt" data-price="${item.price}">0  đ</td>
          </tr>`).join('');
        const note = document.getElementById('returnLimitNote');
        const submitBtn = document.getElementById('returnSubmitBtn');
        if(o.total >= RETURN_APPROVAL_THRESHOLD){
          note.textContent = 'Đơn hàng có giá trị '+fmt(o.total)+' (≥ 3.000.000  đ) — yêu cầu hoàn hàng sẽ được gửi đến quản lý để xác nhận trước khi xử lý.';
          note.classList.remove('hidden');
          submitBtn.textContent = 'Gửi yêu cầu hoàn hàng';
        } else {
          note.classList.add('hidden');
          submitBtn.textContent = 'Xác nhận hoàn hàng';
        }
        calcReturnTotal();
        openModal('modalReturn');
      }

      function calcReturnTotal(){
        let total = 0;
        let hasError = false;
        document.querySelectorAll('#returnItemRows tr').forEach(tr=>{
          const inp = tr.querySelector('input[type="number"]');
          const amtEl = tr.querySelector('.returnAmt');
          if(!inp || !amtEl) return;
          const maxQty = parseInt(inp.max)||0;
          let qty = parseInt(inp.value)||0;
          // Clamp: số lượng hoàn không được vượt quá số đã mua
          if(qty < 0){ qty = 0; inp.value = 0; }
          if(qty > maxQty){
            qty = maxQty;
            inp.value = maxQty;
            inp.classList.add('border-red-400','bg-red-50');
            hasError = true;
          } else {
            inp.classList.remove('border-red-400','bg-red-50');
          }
          const price = parseInt(amtEl.dataset.price)||0;
          const amt = qty * price;
          total += amt;
          amtEl.textContent = fmt(amt);
        });
        document.getElementById('returnTotal').textContent = fmt(total);
        // Show/hide warning
        const warn = document.getElementById('returnQtyWarn');
        if(warn) warn.classList.toggle('hidden', !hasError);
        return total;
      }

      async function submitReturn(){
        if(!returnOrder) return;
        const reason = document.getElementById('returnReason').value.trim();
        if(!reason){ toast('Vui lòng nhập lý do hoàn hàng','error'); return; }
        const total = calcReturnTotal();
        if(total<=0){ toast('Vui lòng nhập số lượng sản phẩm cần hoàn','error'); return; }

        const items = [];
        let qtyError = false;
        document.querySelectorAll('#returnItemRows tr').forEach((tr,i)=>{
          const inp = tr.querySelector('input[type="number"]');
          const qty = parseInt(inp?.value)||0;
          const maxQty = parseInt(inp?.max)||0;
          if(qty > maxQty){ qtyError = true; return; }
          if(qty > 0) items.push({ maSanPham: returnOrder.items[i].maSanPham, soLuong: qty });
        });
        if(qtyError){ toast('Số lượng hoàn không được vượt quá số lượng đã mua','error'); return; }
        if(!items.length){ toast('Vui lòng chọn số lượng cần hoàn','error'); return; }

        const big = returnOrder.total >= RETURN_APPROVAL_THRESHOLD;
        try{
          await apiPost('/orders/'+returnOrder.id+'/refund', {
            maNVXuLy: (window.currentUser||{}).maNV, lyDo: reason, items
          });
        }catch(e){ toast('Hoàn hàng thất bại: '+e.message,'error'); return; }
        closeModal('modalReturn');
        await loadPosOrders();
        if(big) toast('Đơn ≥ 3.000.000đ — đã gửi yêu cầu hoàn, chờ Quản lý duyệt','warning');
        else    toast('Đã hoàn hàng thành công: '+fmt(total),'success');
        returnOrder = null;
      }

      async function approveReturnRequest(id){
        const req = returnRequests.find(x=>x.id===id);
        if(!req || req.status!=='pending') return;
        try{
          await apiPost('/orders/refunds/'+id+'/approve', { maQuanLy: (window.currentUser||{}).maNV });
        }catch(e){ toast('Duyệt hoàn thất bại: '+e.message,'error'); return; }
        await loadPendingRefunds();
        await loadMgrOrders();
        updateMgrNotifications();
        toast('Đã duyệt hoàn hàng cho đơn '+req.orderId+' ('+fmt(req.returnAmount)+')','success');
      }

      async function rejectReturnRequest(id){
        const req = returnRequests.find(x=>x.id===id);
        if(!req || req.status!=='pending') return;
        const reason = prompt('Lý do từ chối yêu cầu hoàn đơn '+req.orderId+'?');
        if(reason===null) return;
        try{
          await apiPost('/orders/refunds/'+id+'/reject', { maQuanLy: (window.currentUser||{}).maNV, lyDo: reason||'Từ chối bởi quản lý' });
        }catch(e){ toast('Từ chối hoàn thất bại: '+e.message,'error'); return; }
        await loadPendingRefunds();
        await loadMgrOrders();
        updateMgrNotifications();
        toast('Đã từ chối yêu cầu hoàn hàng đơn '+req.orderId,'warning');
      }


      // =========================================================
      // SLIDE-OVER: ORDER DETAIL
      // =========================================================
      async function showOrderDetail(id){
        const panel = document.getElementById('slideOverPanel');
        const content = document.getElementById('slideOverContent');
        let head, items;
        try{
          const d = await apiGet('/orders/'+id);   // { donHang, chiTiet }
          head = d.donHang; items = d.chiTiet || [];
        }catch(e){ toast('Lỗi tải chi tiết đơn: '+e.message,'error'); return; }
        const stMap  = { DaThanhToan:'paid', HoanTra:'refund', DaHuy:'cancel', ChoThanhToan:'pending' };
        const payMap = { TienMat:'Tiền mặt', ChuyenKhoan:'QR / Chuyển khoản', QuetThe:'Thẻ ngân hàng' };
        const tong     = Number(head.tongTien||0);
        const giam     = Number(head.tienGiam||0);
        const thanhTien= Number(head.thanhTien!=null ? head.thanhTien : tong-giam);
        content.innerHTML = `
          <div class="mb-4 pb-4 border-b border-slate-100">
            <p class="text-slate-400 text-xs mb-1">Mã đơn hàng</p>
            <p class="text-2xl font-bold font-mono">${head.maDonHang}</p>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm mb-6">
            <div><p class="text-slate-400 text-xs">Thời gian</p><p class="font-medium">${head.ngayLap?new Date(head.ngayLap).toLocaleString('vi-VN'):'—'}</p></div>
            <div><p class="text-slate-400 text-xs">Khách hàng</p><p class="font-medium">${head.tenKhachHang||'Khách lẻ'}</p></div>
            <div><p class="text-slate-400 text-xs">PT thanh toán</p><p class="font-medium">${payMap[head.hinhThuc]||'—'}</p></div>
            <div><p class="text-slate-400 text-xs">Trạng thái</p>${stBadge(stMap[head.trangThai]||'paid')}</div>
          </div>
          <h3 class="font-semibold mb-3">Danh sách sản phẩm</h3>
          <table class="w-full text-sm mb-6">
            <thead class="bg-slate-50"><tr class="text-xs text-slate-400 uppercase tracking-wider"><th class="p-3 text-left">Sản phẩm</th><th class="p-3 text-right">SL</th><th class="p-3 text-right">Đơn giá</th><th class="p-3 text-right">Thành tiền</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              ${items.map(x=>`<tr><td class="p-3">${x.tenSanPham}</td><td class="p-3 text-right">${x.soLuong}</td><td class="p-3 text-right">${fmt(Number(x.donGia))}</td><td class="p-3 text-right font-semibold">${fmt(Number(x.thanhTien))}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-slate-500">Tổng cộng</span><span>${fmt(tong)}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Giảm giá</span><span class="text-rose-600">-${fmt(giam)}</span></div>
            <div class="flex justify-between font-bold text-base border-t border-slate-200 pt-2"><span>Thành tiền</span><span class="text-emerald-700">${fmt(thanhTien)}</span></div>
          </div>`;
        document.getElementById('slideOverOrder').classList.remove('hidden');
        setTimeout(()=>panel.classList.add('open'),10);
        lucide.createIcons();
      }

      function closeSlideOver(){
        const panel = document.getElementById('slideOverPanel');
        panel.classList.remove('open');
        setTimeout(()=>document.getElementById('slideOverOrder').classList.add('hidden'),300);
      }

      // =========================================================
      // CSKH: CUSTOMERS
      // =========================================================
      function renderCsCustomers(data){
        renderCSKHProfile();
        const t = document.getElementById('csCustRows'); if(!t) return;
        t.innerHTML = data.map(c=>`
          <tr class="hover:bg-slate-50">
            <td class="p-4 font-mono text-slate-500">${c.id}</td>
            <td class="p-4 font-semibold">${c.name}</td>
            <td class="p-4 text-slate-500">${c.phone}</td>
            <td class="p-4 text-right font-semibold text-emerald-600">${c.points.toLocaleString('vi-VN')}</td>
            <td class="p-4"><span class="text-xs px-2 py-1 rounded-full font-medium ${tierBadge[c.tier]}">${c.tier}</span></td>
            <td class="p-4 text-slate-400">${fmtDate(c.regDate)}</td>
            <td class="p-4">
              <div class="flex gap-2">
                <button onclick="viewProfile('${c.id}')" class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-1"><i data-lucide="eye" class="w-3 h-3"></i>Xem hồ sơ</button>
                <button onclick="editCustById('${c.id}')" class="p-1.5 rounded-lg hover:bg-slate-100"><i data-lucide="pencil" class="w-4 h-4 text-slate-400"></i></button>
              </div>
            </td>
          </tr>`).join('');
        lucide.createIcons();
      }

      function filterCsCustomers(){
        const q    = (document.getElementById('csCustSearch')||{}).value?.toLowerCase()||'';
        const tier = (document.getElementById('csCustTier')||{}).value||'';
        renderCsCustomers(customers.filter(c=>{
          if(q    && !c.name.toLowerCase().includes(q) && !c.phone.includes(q) && !c.id.toLowerCase().includes(q)) return false;
          if(tier && c.tier!==tier) return false;
          return true;
        }));
      }

      function viewProfile(id){
        const c = customers.find(x=>x.id===id); if(!c) return;
        document.getElementById('profSearch').value=c.phone;
        renderProfile(id);
        go('cskh','cs-profile',null);
      }

      function openNewCustModal(){
        document.getElementById('ncName').value='';
        document.getElementById('ncPhone').value='';
        document.getElementById('ncEmail').value='';
        document.getElementById('ncDob').value='';
        document.getElementById('ncPhoneErr').classList.add('hidden');
        openModal('modalNewCust');
      }

      function validatePhone(p){ return /^0\d{9}$/.test(p); }
      function validateEmail(e){ return !e || e.includes('@'); }

      async function saveNewCust(){
        const name  = document.getElementById('ncName').value.trim();
        const phone = document.getElementById('ncPhone').value.trim();
        const email = document.getElementById('ncEmail').value.trim();
        const dob   = document.getElementById('ncDob').value;
        const errEl = document.getElementById('ncPhoneErr');
        errEl.classList.add('hidden');
        if(!name){ toast('Vui lòng nhập họ tên','error'); return; }
        if(!phone){ errEl.textContent='Số điện thoại không được để trống.'; errEl.classList.remove('hidden'); return; }
        if(!validatePhone(phone)){ errEl.textContent='Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0 (VD: 0912345678).'; errEl.classList.remove('hidden'); return; }
        if(customers.find(c=>c.phone===phone)){ errEl.textContent='Số điện thoại này đã tồn tại trong hệ thống.'; errEl.classList.remove('hidden'); return; }
        if(!validateEmail(email)){ toast('Email không hợp lệ — phải chứa ký tự @','error'); return; }
        // Lưu thật vào SQL (tạo KH + thẻ thành viên + sổ điểm)
        let created;
        try{
          created = await apiPost('/customers', {
            tenKhachHang: name, soDienThoai: phone,
            email: email||null, ngaySinh: dob||null, diaChi: null
          });
        }catch(e){
          errEl.textContent = 'Tạo khách hàng thất bại: '+e.message;
          errEl.classList.remove('hidden');
          return;
        }
        closeModal('modalNewCust');
        renderCSKHCustomers()
        await loadCustomers();                 // nạp lại danh sách thật
        if(typeof filterCsCustomers==='function') filterCsCustomers();
        renderPosCustomerList(customers);
        toast('Đã tạo thẻ thành viên ('+(created.maKhachHang||'')+') cho '+name,'success');
      }

      // =========================================================
      // CSKH: PROFILE
      // =========================================================
      function searchProfile(){
        const q    = (document.getElementById('profSearch')||{}).value?.trim()||'';
        const hint = document.getElementById('profSearchHint');
        if(!q){ hint.textContent='Vui lòng nhập số điện thoại.'; hint.className='text-xs text-rose-500 mt-2'; return; }
        const c = customers.find(x=>x.phone===q);
        if(!c){ hint.textContent='Không tìm thấy khách hàng với số điện thoại này.'; hint.className='text-xs text-rose-500 mt-2';
          document.getElementById('profCard').classList.add('hidden');
          document.getElementById('profEmpty').classList.remove('hidden');
          return;
        }
        hint.textContent='Đã tìm thấy khách hàng.'; hint.className='text-xs text-emerald-600 mt-2';
        renderProfile(c.id);
      }

      function renderProfile(id){
        renderCSKHProfile();
        const c = customers.find(x=>x.id===id); if(!c) return;
        currentProfileId = id;
        document.getElementById('profEmpty').classList.add('hidden');
        document.getElementById('profCard').classList.remove('hidden');
        const card = document.getElementById('membershipCard');
        if(card) card.className = `rounded-2xl p-6 text-white ${tierGradient[c.tier]||tierGradient['Thành viên']}`;
        document.getElementById('pfId').textContent     = c.id;
        document.getElementById('pfHolder').textContent = c.name;
        document.getElementById('pfTier').textContent   = c.tier;
        document.getElementById('pfName').textContent   = c.name;
        document.getElementById('pfPhone').textContent  = c.phone;
        document.getElementById('pfEmail').textContent  = c.email||'—';
        document.getElementById('pfDob').textContent    = fmtDate(c.dob);
        document.getElementById('pfReg').textContent    = fmtDate(c.regDate);
        document.getElementById('pfPoints').textContent = c.points.toLocaleString('vi-VN')+' điểm';
        // Progress bar
        const milestones = [0,100,1000,10000];
        const tierNames  = ['Thành viên','Bạc','Vàng','Kim Cương'];
        const tierIdx    = tierNames.indexOf(c.tier);
        let pct=100, label='Hạng tối đa — Kim Cương';
        if(tierIdx<3){
          const nextMile = milestones[tierIdx+1];
          const prevMile = milestones[tierIdx];
          pct = Math.min(100, Math.round((c.points-prevMile)/(nextMile-prevMile)*100));
          label = `${(nextMile-c.points).toLocaleString('vi-VN')} điểm nữa để đạt hạng ${tierNames[tierIdx+1]}`;
        }
        document.getElementById('tierProgressFill').style.width = pct+'%';
        document.getElementById('tierProgressLabel').textContent = label;
        // Upgrade prompt
        const shouldBe = tierForPoints(c.points);
        const upgradeBox = document.getElementById('upgradePromptBox');
        if(tierRank[shouldBe]>tierRank[c.tier]){
          upgradeBox.classList.remove('hidden');
          document.getElementById('upgradePromptText').textContent=`Khách hàng đủ điều kiện lên hạng ${shouldBe}!`;
        } else { upgradeBox.classList.add('hidden'); }
        renderCsHist(c.id);
        lucide.createIcons();
      }

      function quickUpgrade(){
        const c = customers.find(x=>x.id===currentProfileId); if(!c) return;
        const oldTier = c.tier;
        c.tier = tierForPoints(c.points);
        tierHistory.unshift({ date:new Date().toLocaleDateString('vi-VN'), cust:c.name, action:`${oldTier} → ${c.tier}`, by:'Lê Minh Châu' });
        renderProfile(currentProfileId);
        filterCsCustomers();
        renderUpgrades();
        renderTierHistory();
        toast(`Đã nâng hạng ${c.name}: ${oldTier} → ${c.tier}`,'success');
      }

      // Dữ liệu lịch sử mua hàng mở rộng — map orderId → ngày ISO + items
      const orderDateMap = {
        'DH001':'2026-06-21','DH002':'2026-06-21','DH003':'2026-06-20',
        'DH004':'2026-06-19','DH005':'2026-06-18','DH006':'2026-06-17',
        'DH007':'2026-06-16','DH008':'2026-06-15','DH009':'2026-06-14',
        'DH010':'2026-06-13','DH011':'2026-06-12','DH012':'2026-06-10',
      };

      async function renderCsHist(id){
        currentProfileId = id || currentProfileId;
        const t = document.getElementById('csHistRows'); if(!t) return;

        // Reset filter fields
        const fromEl   = document.getElementById('csHistFrom');
        const toEl     = document.getElementById('csHistTo');
        const statusEl = document.getElementById('csHistStatus');
        if(fromEl)   fromEl.value   = '';
        if(toEl)     toEl.value     = '';
        if(statusEl) statusEl.value = '';

        // Tải lịch sử mua hàng thật từ SQL
        const stMap = { DaThanhToan:'paid', HoanTra:'refund', DaHuy:'cancel', ChoThanhToan:'pending' };
        try{
          const rows = await apiGet('/customers/'+currentProfileId+'/history');
          csHistData = rows.map(r=>({
            id: r.maDonHang,
            dateISO: r.ngayLap ? String(r.ngayLap).slice(0,10) : '',
            total: Number(r.thanhTien!=null ? r.thanhTien : r.tongTien)||0,
            points: Number(r.diemCong||0),
            st: stMap[r.trangThai] || 'paid'
          }));
        }catch(e){ csHistData = []; toast('Lỗi tải lịch sử mua hàng: '+e.message,'error'); }

        _renderCsHistRows();
      }

      function filterCsHist(){
        _renderCsHistRows();
      }

      function resetCsHistFilter(){
        const fromEl   = document.getElementById('csHistFrom');
        const toEl     = document.getElementById('csHistTo');
        const statusEl = document.getElementById('csHistStatus');
        if(fromEl)   fromEl.value   = '';
        if(toEl)     toEl.value     = '';
        if(statusEl) statusEl.value = '';
        _renderCsHistRows();
      }

      function _renderCsHistRows(){
        const t = document.getElementById('csHistRows'); if(!t) return;

        const fromVal   = document.getElementById('csHistFrom')?.value   || '';
        const toVal     = document.getElementById('csHistTo')?.value     || '';
        const statusVal = document.getElementById('csHistStatus')?.value || '';

        // Lọc trên lịch sử THẬT của KH này
        let custOrders = csHistData.slice();
        if(fromVal || toVal || statusVal){
          custOrders = custOrders.filter(o => {
            if(fromVal && o.dateISO < fromVal) return false;
            if(toVal   && o.dateISO > toVal)   return false;
            if(statusVal && o.st !== statusVal) return false;
            return true;
          });
        }

        // Tổng kết
        const summaryEl = document.getElementById('csHistSummary');
        const countEl   = document.getElementById('csHistCount');
        const emptyRow  = document.getElementById('csHistEmptyRow');

        const paidOrders  = custOrders.filter(o=>o.st==='paid');
        const totalSpend  = paidOrders.reduce((s,o)=>s+o.total, 0);
        const totalPoints = paidOrders.reduce((s,o)=>s+o.points, 0);

        if(countEl) countEl.textContent = custOrders.length + ' đơn';
        if(summaryEl){
          summaryEl.classList.toggle('hidden', custOrders.length === 0);
          const sp = document.getElementById('csHistTotalSpend');
          const pt = document.getElementById('csHistTotalPoints');
          const od = document.getElementById('csHistTotalOrders');
          if(sp) sp.textContent = fmt(totalSpend);
          if(pt) pt.textContent = '+' + totalPoints + ' điểm';
          if(od) od.textContent = custOrders.length + ' đơn';
        }

        if(custOrders.length === 0){
          t.innerHTML = '';
          if(emptyRow) emptyRow.classList.remove('hidden');
          return;
        }
        if(emptyRow) emptyRow.classList.add('hidden');

        t.innerHTML = custOrders.map(o => {
          const dateDisp = o.dateISO ? o.dateISO.split('-').reverse().join('/') : '—';
          return `<tr class="hover:bg-slate-50">
            <td class="p-4 font-mono text-slate-500 text-xs">${o.id}</td>
            <td class="p-4 text-slate-500 text-sm">${dateDisp}</td>
            <td class="p-4 text-slate-500 text-xs max-w-[200px] truncate">—</td>
            <td class="p-4 text-right font-semibold">${fmt(o.total)}</td>
            <td class="p-4 text-right text-emerald-600 font-medium">${o.st==='paid'?'+'+o.points+' đ.':'—'}</td>
            <td class="p-4">${stBadge(o.st)}</td>
          </tr>`;
        }).join('');
      }

      function editCustById(id){
        const c = customers.find(x=>x.id===id); if(!c) return;
        currentProfileId=id;
        openEditCust();
      }

      function openEditCust(){
        const c = customers.find(x=>x.id===currentProfileId); if(!c) return;
        document.getElementById('ecId').value    = c.id;
        document.getElementById('ecName').value  = c.name;
        document.getElementById('ecPhone').value = c.phone;
        document.getElementById('ecEmail').value = c.email||'';
        document.getElementById('ecDob').value   = c.dob||'';
        document.getElementById('ecPhoneErr').classList.add('hidden');
        openModal('modalEditCust');
      }

      async function saveEditCust(){
        const id    = document.getElementById('ecId').value;
        const c     = customers.find(x=>x.id===id); if(!c) return;
        const name  = document.getElementById('ecName').value.trim();
        const phone = document.getElementById('ecPhone').value.trim();
        const email = document.getElementById('ecEmail').value.trim();
        const dob   = document.getElementById('ecDob').value;
        const errEl = document.getElementById('ecPhoneErr');
        errEl.classList.add('hidden');
        if(!name){ toast('Vui lòng nhập họ tên','error'); return; }
        if(!phone||!validatePhone(phone)){ errEl.textContent='Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0 (VD: 0912345678).'; errEl.classList.remove('hidden'); return; }
        if(customers.find(x=>x.phone===phone&&x.id!==id)){ errEl.textContent='Số điện thoại này đã tồn tại.'; errEl.classList.remove('hidden'); return; }
        if(!validateEmail(email)){ toast('Email không hợp lệ — phải chứa ký tự @','error'); return; }
        // Lưu thật xuống SQL
        try{
          await apiPut('/customers/'+id, {
            tenKhachHang: name, soDienThoai: phone,
            email: email||null, ngaySinh: dob||null, diaChi: c.diaChi||null
          });
        }catch(e){ errEl.textContent='Cập nhật thất bại: '+e.message; errEl.classList.remove('hidden'); return; }
        closeModal('modalEditCust');
        await loadCustomers();                 // nạp lại danh sách thật
        filterCsCustomers();
        renderMgrCustomers(customers);
        toast('Đã cập nhật thông tin khách hàng','success');
      }

      function getInitials(name){
        if(!name) return 'CS';

        const parts = name.trim().split(/\s+/);

        if(parts.length === 1){
          return parts[0].slice(0,2).toUpperCase();
        }

        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
      }

      function renderCSKHProfile(){
        const u = window.currentUser || {};

        const name = u.tenNV || u.name || u.taiKhoan || 'Nhân viên CSKH';

        let role = 'Nhân viên CSKH';
        if(u.vaiTro === 'NVCSKH'){
          role = 'Nhân viên CSKH';
        }else if(u.vaiTro){
          role = u.vaiTro;
        }

        const setText = (id, value) => {
          const el = document.getElementById(id);
          if(el) el.textContent = value;
        };

        setText('cskhSidebarName', name);
        setText('cskhSidebarRole', role);
        setText('cskhAvatar', getInitials(name));
      }

      // =========================================================
      // CSKH: TIER UPGRADE
      // =========================================================
      function refreshUpgrades(){
        customers.forEach(c=>{
          const should = tierForPoints(c.points);
          if(tierRank[should]>tierRank[c.tier]){
            if(!pendingUpgrades.find(u=>u.id===c.id)){
              pendingUpgrades.push({ id:c.id, name:c.name, phone:c.phone, oldTier:c.tier, newTier:should, points:c.points });
            }
          }
        });
        // Remove already-upgraded
        pendingUpgrades = pendingUpgrades.filter(u=>{
          const c=customers.find(x=>x.id===u.id);
          return c && tierRank[tierForPoints(c.points)]>tierRank[c.tier];
        });
      }

      function renderUpgrades(){
        renderCSKHProfile();
        refreshUpgrades();
        const t = document.getElementById('upgradeRows');
        const cnt = document.getElementById('upgradeCount');
        const empty = document.getElementById('upgradeEmpty');
        const q = (document.getElementById('tierSearch')||{}).value?.toLowerCase()||'';
        const filtered = pendingUpgrades.filter(u=>!q||u.name.toLowerCase().includes(q)||u.phone.includes(q));
        if(cnt) cnt.textContent = filtered.length+' khách';
        if(!t) return;
        if(filtered.length===0){
          t.innerHTML='';
          if(empty) empty.classList.remove('hidden');
          return;
        }
        if(empty) empty.classList.add('hidden');
        t.innerHTML = filtered.map(u=>`
          <tr class="hover:bg-slate-50">
            <td class="p-4 font-mono text-slate-500">${u.id}</td>
            <td class="p-4 font-semibold">${u.name}</td>
            <td class="p-4 text-slate-500">${u.phone}</td>
            <td class="p-4 text-right font-semibold text-emerald-600">${u.points.toLocaleString('vi-VN')}</td>
            <td class="p-4"><span class="text-xs px-2 py-1 rounded-full ${tierBadge[u.oldTier]}">${u.oldTier}</span></td>
            <td class="p-4"><span class="text-xs px-2 py-1 rounded-full ${tierBadge[u.newTier]}">${u.newTier}</span></td>
            <td class="p-4">
              <button onclick="confirmUpgrade('${u.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1">
                <i data-lucide="arrow-up-circle" class="w-3.5 h-3.5"></i>Xác nhận nâng hạng
              </button>
            </td>
          </tr>`).join('');
        lucide.createIcons();
      }

      async function confirmUpgrade(id){
        const c = customers.find(x => x.id === id);
        if(!c) return;

        const oldTier = c.tier;
        const newTier = tierForPoints(c.points);

        if(!confirm(`Xác nhận nâng hạng khách hàng ${c.name}: ${oldTier} → ${newTier}?`)){
          return;
        }

        try{
          const u = window.currentUser || {};

          await apiPost('/customers/' + id + '/upgrade', {
            maNV: u.maNV
          });

          // Cập nhật lại dữ liệu trên giao diện
          c.tier = newTier;
          pendingUpgrades = pendingUpgrades.filter(u => u.id !== id);

          renderUpgrades();
          filterCsCustomers();

          if(currentProfileId === id){
            renderProfile(id);
          }

          // Quan trọng: tải lại lịch sử từ SQL
          await loadTierHistory();

          toast(`Đã nâng hạng ${c.name}: ${oldTier} → ${newTier}`, 'success');

        }catch(e){
          toast('Nâng hạng thất bại: ' + e.message, 'error');
        }
      }

      function renderTierHistory(){
        const t = document.getElementById('tierHistRows');
        if(!t) return;

        if(!tierHistory || tierHistory.length === 0){
          t.innerHTML = `
            <tr>
              <td colspan="4" class="p-6 text-center text-slate-400">
                Chưa có lịch sử điều chỉnh.
              </td>
            </tr>
          `;
          return;
        }

        t.innerHTML = tierHistory.map(h => {
          const date = h.ngayDieuChinh
            ? new Date(h.ngayDieuChinh).toLocaleDateString('vi-VN')
            : '—';

          const cust = h.tenKhachHang || h.maKhachHang || '—';
          const action = `${h.tenHangCu || '—'} → ${h.tenHangMoi || '—'}`;
          const by = h.tenNV || h.maNV || '—';

          return `
            <tr class="hover:bg-slate-50">
              <td class="p-3 text-slate-500 text-sm">${date}</td>
              <td class="p-3 font-medium">${cust}</td>
              <td class="p-3">
                <span class="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                  ${action}
                </span>
              </td>
              <td class="p-3 text-slate-500 text-sm">${by}</td>
            </tr>
          `;
        }).join('');
      }
      
      async function loadTierHistory(){
        try{
          tierHistory = await apiGet('/customers/upgrade-history/list');
          renderTierHistory();
        }catch(e){
          console.error(e);
          toast('Lỗi tải lịch sử điều chỉnh hạng: ' + e.message, 'error');
        }
      }

      // =========================================================
      // MOBILE: SCHEDULE
      // =========================================================
      function renderCurrentShiftCard(){
        const title = document.getElementById('currentShiftTitle');
        const sub = document.getElementById('currentShiftSub');

        if(!title || !sub) return;

        const todayKey = TODAY_STR;
        const todayShifts = shiftData[todayKey] || [];

        if(todayShifts.length === 0){
          title.textContent = 'Không có ca hiện tại';
          sub.textContent = staffInfo.store || '—';
          window.currentWorkShiftId = null;
          return;
        }

        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();

        const current = todayShifts.find(s => {
          const parts = String(s.time || '').split(' - ');
          if(parts.length !== 2) return false;

          const [sh, sm] = parts[0].split(':').map(Number);
          const [eh, em] = parts[1].split(':').map(Number);

          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;

          return nowMin >= startMin && nowMin <= endMin;
        }) || todayShifts[0];

        title.textContent = `${current.type} · ${current.time}`;

        if(current.counter && current.counter !== '—'){
          sub.textContent = `${current.counter} · ${staffInfo.store || '—'}`;
        }else{
          sub.textContent = staffInfo.store || '—';
        }

        window.currentWorkShiftId = current.id;
      }

      async function loadMyWorkShifts(){
        const u = window.currentUser || {};
        if(!u.maNV) return;

        try{
          const rows = await apiGet('/shifts/work?maNV=' + encodeURIComponent(u.maNV));

          shiftData = {};
          let _activeRaw = null;   // ca ĐANG LÀM (đã check-in, chưa check-out) — bất kỳ ngày
          let _todayDone = null;   // ca HÔM NAY đã check-out / đã xác nhận

          rows.forEach(r => {
            const ngayChk = String(r.ngayLamViec || '').slice(0,10);
            if(r.trangThai === 'dang_lam' && !_activeRaw) _activeRaw = r;
            if(ngayChk === TODAY_STR && (r.trangThai === 'da_lam' ||
                 r.daXacNhan === true || r.daXacNhan === 1 || r.daXacNhan === '1') && !_todayDone) _todayDone = r;
            // Chỉ cho nhân viên nhìn thấy ca đã duyệt lịch hoặc đã bắt đầu chấm công
            if(
              r.trangThai !== 'cho_lam' &&
              r.trangThai !== 'dang_lam' &&
              r.trangThai !== 'da_lam'
            ){
              return;
            }

            const ngay = String(r.ngayLamViec || '').slice(0,10);
            if(!ngay) return;

            const start = _hhmm(r.gioBatDauDuKien);
            const end = _hhmm(r.gioKetThucDuKien);

            let status = 'Đã duyệt lịch';

            if(r.trangThai === 'dang_lam'){
              status = 'Đang làm';
            }

            if(r.trangThai === 'da_lam'){
              status = 'Chờ quản lý xác nhận';
            }

            if(
              r.daXacNhan === true ||
              r.daXacNhan === 1 ||
              r.daXacNhan === '1'
            ){
              status = 'Đã xác nhận công';
            }

            if(r.trangThai === 'vang_mat'){
              status = 'Vắng mặt';
            }

            if(r.trangThai === 'tu_choi'){
              status = 'Từ chối';
            }

            if(!shiftData[ngay]) shiftData[ngay] = [];

            shiftData[ngay].push({
              id: r.maCaLV,
              type:
                r.loaiCa === 'sang'  ? 'Ca sáng' :
                r.loaiCa === 'chieu' ? 'Ca chiều' :
                r.loaiCa === 'toi'   ? 'Ca tối' : 'Ca làm việc',
              time: start + ' - ' + end,
              counter: r.tenQuay || r.maQuay || '—',
              status
            });
          });

          renderWeek();
          renderMonth();

          // ===== Khôi phục trạng thái nút chấm công sau khi reload =====
          const _pInfo  = document.getElementById('punchInfo');
          const _pLabel = document.getElementById('punchTimeLabel');
          const _pBtn   = document.getElementById('punchBtn');
          if(_activeRaw){
            // Có ca đang làm (đã check-in, chưa check-out) -> nút "Check-out"
            punchCheckedIn = true;
            punchTime = _hhmm(_activeRaw.gioBatDauThucTe);
            if(_pInfo)  _pInfo.classList.remove('hidden');
            if(_pLabel) _pLabel.textContent = `✅ Đã check-in lúc ${punchTime}`;
            updatePunchBtnState();
          } else if(_todayDone){
            // Ca hôm nay đã hoàn tất -> khoá nút
            punchCheckedIn = false;
            if(_pInfo) _pInfo.classList.add('hidden');
            if(_pBtn){ _pBtn.disabled = true; _pBtn.textContent = 'Đã hoàn thành ca hôm nay';
              _pBtn.className = 'w-full bg-slate-300 text-slate-500 rounded-2xl py-5 text-xl font-bold cursor-not-allowed'; }
          } else {
            // Chưa chấm công
            punchCheckedIn = false;
            if(_pInfo) _pInfo.classList.add('hidden');
            updatePunchBtnState();
          }

          if(typeof renderCurrentShiftCard === 'function'){
            renderCurrentShiftCard();
          }

        }catch(e){
          toast('Lỗi tải lịch cá nhân: ' + e.message, 'error');
        }
      }

      const dowVN = ['CN','T2','T3','T4','T5','T6','T7'];

      function setSchView(v){
        const w=document.getElementById('schWeek'), m=document.getElementById('schMonth');
        const tw=document.getElementById('schTabWeek'), tm=document.getElementById('schTabMonth');
        if(v==='week'){
          w.classList.remove('hidden'); m.classList.add('hidden');
          tw.className='px-3 py-1 bg-white text-slate-900 rounded-full font-semibold transition-all';
          tm.className='px-3 py-1 text-slate-300 transition-all';
          renderWeek();
        } else {
          m.classList.remove('hidden'); w.classList.add('hidden');
          tm.className='px-3 py-1 bg-white text-slate-900 rounded-full font-semibold transition-all';
          tw.className='px-3 py-1 text-slate-300 transition-all';
          renderMonth();
        }
        lucide.createIcons();
      }

      function renderWeek(){
        const strip=document.getElementById('weekStrip'); if(!strip) return;
        const selected = new Date(selectedDay + 'T00:00:00');
        const day = selected.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;

        const base = new Date(selected);
        base.setDate(selected.getDate() + diffToMonday);
        let html='';
        for(let i=0;i<7;i++){
          const d=new Date(base); d.setDate(base.getDate()+i);
          const k=dateKey(d.getFullYear(),d.getMonth(),d.getDate());
          const isSel=k===selectedDay;
          const hasShift=!!shiftData[k];
          html+=`<div onclick="pickDay('${k}')" class="cursor-pointer text-center">
            <p class="text-[10px] ${isSel?'text-emerald-600':'text-slate-400'}">${dowVN[d.getDay()]}</p>
            <div class="w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 ${isSel?'bg-slate-900 text-white':'hover:bg-slate-100'}">
              <span class="text-sm font-bold">${d.getDate()}</span>
            </div>
            <span class="block w-1.5 h-1.5 rounded-full ${hasShift&&!isSel?'bg-emerald-500':'bg-transparent'} mx-auto mt-0.5"></span>
          </div>`;
        }
        strip.innerHTML=html;
        const [y,m,dd]=selectedDay.split('-');
        const dl=document.getElementById('dayLabel'); if(dl) dl.textContent=`Lịch ca ngày ${dd}/${m}`;
        const list=shiftData[selectedDay];
        const ds=document.getElementById('dayShifts'); if(ds) ds.innerHTML=list?list.map(shiftCardMobile).join(''):emptyShiftMobile('Không có ca làm trong ngày này');
      }

      function pickDay(k){ selectedDay=k; renderWeek(); }

      function changeMonth(delta){
        monthView.m+=delta;
        if(monthView.m<0){ monthView.m=11; monthView.y--; }
        if(monthView.m>11){ monthView.m=0; monthView.y++; }
        selectedMonthDay=null;
        renderMonth();
      }

      function renderMonth(){
        const {y,m}=monthView;
        const monthNames=['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
        const ml=document.getElementById('monthLabel'); if(ml) ml.textContent=`${monthNames[m]} ${y}`;
        const first=new Date(y,m,1);
        let startOffset=(first.getDay()+6)%7;
        const daysInMonth=new Date(y,m+1,0).getDate();
        let html='';
        for(let i=0;i<startOffset;i++) html+='<div></div>';
        for(let d=1;d<=daysInMonth;d++){
          const k=dateKey(y,m,d);
          const hasShift=!!shiftData[k];
          const isToday=k===TODAY_STR;
          const isSel=k===selectedMonthDay;
          html+=`<div onclick="pickMonthDay('${k}')" class="aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer ${isSel?'bg-slate-900 text-white':isToday?'ring-1 ring-emerald-500':''} hover:bg-slate-100 transition-colors">
            <span class="text-sm font-semibold">${d}</span>
            <span class="w-1.5 h-1.5 rounded-full mt-0.5 ${hasShift?(isSel?'bg-white':'bg-emerald-500'):'bg-transparent'}"></span>
          </div>`;
        }
        const mg=document.getElementById('monthGrid'); if(mg) mg.innerHTML=html;
        if(selectedMonthDay){
          const [yy,mm,dd]=selectedMonthDay.split('-');
          const dl=document.getElementById('monthDayLabel'); if(dl) dl.textContent=`Lịch ca ngày ${dd}/${mm}`;
          const list=shiftData[selectedMonthDay];
          const ds=document.getElementById('monthDayShifts'); if(ds) ds.innerHTML=list?list.map(shiftCardMobile).join(''):emptyShiftMobile('Không có ca làm trong ngày này');
        }
      }

      function pickMonthDay(k){ selectedMonthDay=k; renderMonth(); }

      function shiftCardMobile(sh){
        const statusColor={'Hoàn thành':'bg-emerald-100 text-emerald-700','Dự kiến':'bg-slate-100 text-slate-600'};
        return `<div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div class="flex justify-between items-center">
            <span class="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">${sh.type}</span>
            <span class="${statusColor[sh.status]||'bg-amber-100 text-amber-700'} text-xs px-2 py-0.5 rounded-full">${sh.status}</span>
          </div>
          <p class="font-bold mt-2">${sh.time}</p>
          <p class="text-slate-400 text-sm">${sh.counter} · ${staffInfo.store}</p>
        </div>`;
      }

      function emptyShiftMobile(msg){ return `<div class="border border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 text-sm bg-white">${msg}</div>`; }

      // =========================================================
      // MOBILE: CHECK-IN/OUT
      // =========================================================
      // =========================================================
      // GPS ATTENDANCE CONFIG
      // =========================================================
      const STORE_GPS = {
        lat: 21.036700,   // Tọa độ cửa hàng eMarket Cầu Giấy
        lng: 105.782500,  // 120 Xuân Thủy, Cầu Giấy, Hà Nội
        radius: 50000,    // [Demo] 50km — phủ toàn Hà Nội để test; đổi về 50 khi nộp
        name: 'eMarket — Chi nhánh Cầu Giấy'
      };

      let gpsStatus = 'idle'; // idle | loading | ok | far | denied | error
      let gpsDistance = null;

      // Haversine formula — khoảng cách giữa 2 toạ độ (mét)
      function haversineDistance(lat1, lng1, lat2, lng2){
        const R = 6371000;
        const phi1 = lat1 * Math.PI/180, phi2 = lat2 * Math.PI/180;
        const dPhi = (lat2-lat1) * Math.PI/180;
        const dLam = (lng2-lng1) * Math.PI/180;
        const a = Math.sin(dPhi/2)**2 + Math.cos(phi1)*Math.cos(phi2)*Math.sin(dLam/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      }

      function setGpsPanel(state, data={}){
        gpsStatus = state;
        ['gpsIdle','gpsLoading','gpsOk','gpsFar','gpsDenied','gpsError'].forEach(id=>{
          document.getElementById(id)?.classList.add('hidden');
        });
        const show = id => document.getElementById(id)?.classList.remove('hidden');

        if(state==='idle')    { show('gpsIdle'); }
        if(state==='loading') { show('gpsLoading'); }
        if(state==='ok') {
          show('gpsOk');
          const dist = Math.round(data.dist);
          gpsDistance = dist;
          // Bar: 0m=full green, 50m=thin (invert so closer=fuller)
          const pct = Math.max(5, Math.round((1 - dist/STORE_GPS.radius)*100));
          document.getElementById('gpsDistBar').style.width = pct+'%';
          document.getElementById('gpsDistLabel').textContent = dist+'m / 50m';
          document.getElementById('gpsCoordLabel').textContent =
            `📍 ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`;
        }
        if(state==='far') {
          show('gpsFar');
          gpsDistance = Math.round(data.dist);
          document.getElementById('gpsDistLabelFar').textContent = Math.round(data.dist)+'m';
          document.getElementById('gpsCoordLabelFar').textContent =
            `📍 ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`;
        }
        if(state==='denied') { show('gpsDenied'); }
        if(state==='error')  {
          show('gpsError');
          document.getElementById('gpsErrorMsg').textContent = data.msg||'Vui lòng thử lại.';
        }
        // Update punch button state
        updatePunchBtnState();
        lucide.createIcons();
      }

      function requestGPS(){
        if(!navigator.geolocation){
          setGpsPanel('error', {msg:'Trình duyệt không hỗ trợ định vị GPS.'});
          return;
        }
        setGpsPanel('loading');
        navigator.geolocation.getCurrentPosition(
          (pos)=>{
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const dist = haversineDistance(lat, lng, STORE_GPS.lat, STORE_GPS.lng);
            if(dist <= STORE_GPS.radius){
              setGpsPanel('ok', {dist, lat, lng});
            } else {
              setGpsPanel('far', {dist, lat, lng});
            }
          },
          (err)=>{
            if(err.code===1) setGpsPanel('denied');
            else if(err.code===2) setGpsPanel('error', {msg:'Không xác định được vị trí. Kiểm tra GPS thiết bị.'});
            else setGpsPanel('error', {msg:'Hết thời gian chờ. Vui lòng thử lại.'});
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
      }

      function updatePunchBtnState(){
        const btn = document.getElementById('punchBtn');
        if(!btn) return;
        if(punchCheckedIn){
          // Already checked in — allow check-out regardless of GPS
          btn.disabled = false;
          btn.className='w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-5 text-xl font-bold shadow-lg shadow-red-200 transition-colors';
          btn.textContent='Check-out';
        } else {
          const canCheckIn = gpsStatus === 'ok';
          btn.disabled = !canCheckIn;
          btn.className = canCheckIn
            ? 'w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-5 text-xl font-bold shadow-lg shadow-emerald-200 transition-colors'
            : 'w-full bg-slate-300 text-slate-500 rounded-2xl py-5 text-xl font-bold cursor-not-allowed';
          btn.textContent = gpsStatus==='loading' ? '⏳ Đang định vị...' : 'Check-in';
        }
      }

      // Tải ca làm việc của chính NV đang đăng nhập (màn chấm công)
      async function loadMyShifts(){
        const maNV = (window.currentUser||{}).maNV;
        if(!maNV) return;
        try{ workShifts = (await apiGet('/shifts/work?maNV='+encodeURIComponent(maNV))).map(mapWorkShift); }
        catch(e){ toast('Lỗi tải ca của bạn: '+e.message,'error'); }
      }

      async function togglePunch(){
        const info  = document.getElementById('punchInfo');
        const label = document.getElementById('punchTimeLabel');
        const now   = new Date().toTimeString().slice(0,5);
        const maNV  = (window.currentUser||{}).maNV || staffInfo.id;

        if(!punchCheckedIn){
          // ── CHECK-IN ──────────────────────────────────────────────
          if(gpsStatus !== 'ok'){
            toast('Cần xác nhận vị trí GPS trước khi check-in','error');
            requestGPS();
            return;
          }
          // Lấy ca thật của NV, chỉ cho check-in ca HÔM NAY (không check-in ca tương lai)
          await loadMyShifts();
          const target = workShifts.find(ws => ws.code===maNV && ws.status==='approved' && ws.date===TODAY_STR);
          if(!target){ toast('Hôm nay không có ca chờ làm để check-in (hoặc Quản lý chưa duyệt lịch).','error'); return; }
          try{
            await apiPost('/shifts/work/'+target.id+'/checkin', {
              viDo: STORE_GPS.lat, kinhDo: STORE_GPS.lng, khoangCach: gpsDistance ?? null
            });
          }catch(e){ toast('Check-in thất bại: '+e.message,'error'); return; }
          punchCheckedIn = true; punchTime = now;
          info.classList.remove('hidden');
          label.textContent = `✅ Đã check-in lúc ${now} · cách cửa hàng ${gpsDistance??''}m`;
          toast('Check-in thành công lúc ' + now, 'success');
          setTimeout(()=>toast('📋 Ca làm việc đang chờ Quản lý xác nhận','info'), 800);
          await loadMyShifts();
          updatePunchBtnState(); updateMgrNotifications();
        } else {
          // ── CHECK-OUT ─────────────────────────────────────────────
          await loadMyShifts();
          const myWS = workShifts.find(ws => ws.code===maNV && ws.status==='checkedin' && ws.checkoutTime==='—');
          if(!myWS){ toast('Không tìm thấy ca đang làm để check-out','error'); return; }
          try{
            await apiPost('/shifts/work/'+myWS.id+'/checkout', {});
          }catch(e){ toast('Check-out thất bại: '+e.message,'error'); return; }
          punchCheckedIn = false;
          info.classList.add('hidden');
          toast('Check-out thành công lúc ' + now, 'success');
          setGpsPanel('idle');
          await loadMyShifts();
          updatePunchBtnState(); updateMgrNotifications();
        }
      }

      // =========================================================
      // MOBILE: PROFILE
      // =========================================================
      function renderStaffProfile(){
        const s = staffInfo;
        const el=(id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
        const store = (s.store||'—');
        el('spHeaderName', s.name);
        el('spHeaderSub',  `${s.id} • ${String(store).toUpperCase()}`);
        el('spNameBig',    s.name);
        el('spPhone',      s.phone);
        el('spStore',      store);
        el('spGenderAge',  (s.gender && s.gender!=='—') ? `${s.gender} • ${s.age} tuổi` : '—');
        el('spEmail',      s.email||'—');
        el('spAddr',       s.addr);
        el('gpsBranchName', 'eMarket — ' + store);
        el('gpsBranchCoord', getBranchCoordText(store));
      }

      function getBranchCoordText(store){
        if(!store) return '—';

        const name = String(store).toLowerCase();

        if(name.includes('cầu giấy')){
          return '20.9875° N, 105.8512° E';
        }

        if(name.includes('quận 1')){
          return '10.7769° N, 106.7009° E';
        }

        if(name.includes('quận 7')){
          return '10.7350° N, 106.7218° E';
        }

        return '—';
      }

      function openEditStaff(){
        document.getElementById('esName').value   = staffInfo.name;
        document.getElementById('esPhone').value  = staffInfo.phone;
        document.getElementById('esEmail').value  = staffInfo.email||'';
        document.getElementById('esGender').value = staffInfo.gender;
        document.getElementById('esAge').value    = staffInfo.age;
        document.getElementById('esAddr').value   = staffInfo.addr;
        document.getElementById('esLocked').textContent = `${staffInfo.id} · ${staffInfo.store}`;
        document.getElementById('esPhoneErr').classList.add('hidden');
        openModal('modalEditStaff');
      }

      async function saveEditStaff(){
        const name  = document.getElementById('esName').value.trim();
        const phone = document.getElementById('esPhone').value.trim();
        const email = document.getElementById('esEmail').value.trim();
        const gender= document.getElementById('esGender').value;
        const age   = parseInt(document.getElementById('esAge').value,10);
        const addr  = document.getElementById('esAddr').value.trim();
        const err   = document.getElementById('esPhoneErr');
        err.classList.add('hidden');
        if(!name){ toast('Vui lòng nhập họ tên','error'); return; }
        if(!/^0\d{8,10}$/.test(phone)){ err.textContent='Số điện thoại không hợp lệ.'; err.classList.remove('hidden'); return; }
        if(!age||age<16||age>80){ toast('Tuổi không hợp lệ (16-80)','error'); return; }

        // Lưu xuống DB: chỉ soDienThoai + email (NHAN_VIEN chỉ có 2 cột này)
        try{
          await apiPut('/shifts/staff/profile', {
            maNV: staffInfo.maNV || (window.currentUser||{}).maNV,
            soDienThoai: phone,
            email: email
          });
        }catch(e){ toast('Lưu thông tin thất bại: '+e.message,'error'); return; }

        // Đồng bộ RAM + currentUser để hiển thị nhất quán sau này
        Object.assign(staffInfo, {name,phone,email,gender,age,addr});
        if(window.currentUser){ window.currentUser.soDienThoai = phone; window.currentUser.email = email; }
        closeModal('modalEditStaff');
        renderStaffProfile();
        toast('Đã cập nhật SĐT & email','success');
      }

      // =========================================================
      // INIT
      // =========================================================
      document.addEventListener('DOMContentLoaded', ()=>{
        lucide.createIcons();
        // Set active nav on manager first load
        const firstNav = document.querySelector('#app-quan_ly .navitem');
        if(firstNav) firstNav.classList.add('active-nav');
      });