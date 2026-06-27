/* =========================================================
   eMarket — Hệ thống quản lý siêu thị (v4.2)
   app.js — toàn bộ logic JS tách riêng khỏi HTML
   ========================================================= */

      // =========================================================
      // MOCK DATA
      // =========================================================
      const ACCOUNTS = {
        'M01':  { pin:'0000', role:'quan_ly',   name:'Quản Lý Minh' },
        'C01':  { pin:'1234', role:'thu_ngan',  name:'Nguyễn Văn An' },
        'E01':  { pin:'1234', role:'cham_cong', name:'Văn C' },
        'CS01': { pin:'1234', role:'cskh',      name:'Lê Minh Châu' },
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

      const products = [
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
        { id:'SC001', staff:'Nguyễn Văn An', code:'E01', date:'15/06/2026', time:'07:00–15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC002', staff:'Trần Thị Bình', code:'E02', date:'15/06/2026', time:'07:00–15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC003', staff:'Lê Văn Cường',  code:'E03', date:'17/06/2026', time:'07:00–15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC004', staff:'Phạm Thị Dung', code:'E04', date:'15/06/2026', time:'07:00–15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC005', staff:'Hoàng Văn Em',  code:'E05', date:'20/06/2026', time:'07:00–15:00', counter:'Quầy 05', status:'approved' },
        { id:'SC006', staff:'Nguyễn Văn An', code:'E01', date:'20/06/2026', time:'15:00–22:00', counter:'Quầy 01', status:'approved' },
        { id:'SC007', staff:'Trần Thị Bình', code:'E02', date:'17/06/2026', time:'07:00–15:00', counter:'Quầy 01', status:'pending'  },
        { id:'SC008', staff:'Lê Văn Cường',  code:'E03', date:'21/06/2026', time:'15:00–22:00', counter:'Quầy 03', status:'pending'  },
        { id:'SC009', staff:'Phạm Thị Dung', code:'E04', date:'17/06/2026', time:'07:00–15:00', counter:'Quầy 01', status:'pending'  },
        { id:'SC010', staff:'Nguyễn Văn An', code:'E01', date:'21/06/2026', time:'07:00–15:00', counter:'Quầy 01', status:'approved' },
        { id:'SC011', staff:'Trần Thị Bình', code:'E02', date:'21/06/2026', time:'15:00–22:00', counter:'Quầy 02', status:'approved' },
        { id:'SC012', staff:'Phạm Thị Dung', code:'E04', date:'21/06/2026', time:'07:00–15:00', counter:'Quầy 04', status:'approved' },
        { id:'SC013', staff:'Lê Văn Cường',  code:'E03', date:'22/06/2026', time:'07:00–15:00', counter:'Quầy 03', status:'pending'  },
        { id:'SC014', staff:'Hoàng Văn Em',  code:'E05', date:'23/06/2026', time:'07:00–15:00', counter:'Quầy 05', status:'pending'  },
      ];

      // CA LÀM VIỆC (workShifts) — dùng cho màn hình "Quản lý ca làm việc"
      // Sinh ra từ các lịch ca đã được duyệt (approved).
      // checkinTime / checkoutTime: giờ nhân viên thực tế chấm công qua app.
      // Khi NV chấm công → status = 'checkedin', chờ quản lý xác nhận.
      let workShifts = [
        // Đã xác nhận (done)
        { id:'WS001', staff:'Nguyễn Văn An', code:'E01', date:'2026-06-15', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'06:57', checkoutTime:'15:04', hours:8.1,  status:'done',      note:'' },
        { id:'WS002', staff:'Trần Thị Bình', code:'E02', date:'2026-06-15', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'07:12', checkoutTime:'15:00', hours:7.8,  status:'done',      note:'Đi trễ 12 phút' },
        { id:'WS003', staff:'Phạm Thị Dung', code:'E04', date:'2026-06-15', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'07:00', checkoutTime:'15:02', hours:8.0,  status:'done',      note:'' },
        { id:'WS004', staff:'Hoàng Văn Em',  code:'E05', date:'2026-06-16', time:'07:00–15:00', counter:'Quầy 05', checkinTime:'07:00', checkoutTime:'15:00', hours:8.0,  status:'done',      note:'' },
        { id:'WS005', staff:'Nguyễn Văn An', code:'E01', date:'2026-06-16', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'07:03', checkoutTime:'15:01', hours:7.97, status:'done',      note:'' },
        { id:'WS006', staff:'Lê Văn Cường',  code:'E03', date:'2026-06-17', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'—',     checkoutTime:'—',     hours:0,    status:'absent',    note:'Không liên lạc được' },
        { id:'WS007', staff:'Nguyễn Văn An', code:'E01', date:'2026-06-17', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'07:02', checkoutTime:'15:00', hours:7.97, status:'done',      note:'' },
        { id:'WS008', staff:'Phạm Thị Dung', code:'E04', date:'2026-06-17', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'07:01', checkoutTime:'15:00', hours:7.98, status:'done',      note:'' },
        { id:'WS009', staff:'Trần Thị Bình', code:'E02', date:'2026-06-18', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'07:18', checkoutTime:'—',     hours:null, status:'rejected',  note:'Quên check-out, từ chối xác nhận' },
        { id:'WS010', staff:'Nguyễn Văn An', code:'E01', date:'2026-06-18', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'07:00', checkoutTime:'15:00', hours:8.0,  status:'done',      note:'' },
        { id:'WS011', staff:'Lê Văn Cường',  code:'E03', date:'2026-06-19', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'06:59', checkoutTime:'15:00', hours:8.02, status:'done',      note:'' },
        { id:'WS012', staff:'Phạm Thị Dung', code:'E04', date:'2026-06-19', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'07:05', checkoutTime:'15:00', hours:7.92, status:'done',      note:'' },
        { id:'WS013', staff:'Hoàng Văn Em',  code:'E05', date:'2026-06-20', time:'07:00–15:00', counter:'Quầy 05', checkinTime:'07:00', checkoutTime:'15:00', hours:8.0,  status:'done',      note:'' },
        { id:'WS014', staff:'Nguyễn Văn An', code:'E01', date:'2026-06-20', time:'15:00–22:00', counter:'Quầy 01', checkinTime:'15:00', checkoutTime:'22:00', hours:7.0,  status:'done',      note:'' },
        // Chờ xác nhận (checkedin) — NV đã bấm chấm công, chờ quản lý duyệt
        { id:'WS015', staff:'Nguyễn Văn An', code:'E01', date:'2026-06-21', time:'07:00–15:00', counter:'Quầy 01', checkinTime:'07:01', checkoutTime:'15:03', hours:8.03, status:'checkedin', note:'' },
        { id:'WS016', staff:'Trần Thị Bình', code:'E02', date:'2026-06-21', time:'15:00–22:00', counter:'Quầy 02', checkinTime:'15:09', checkoutTime:'22:00', hours:6.85, status:'checkedin', note:'Đi trễ 9 phút' },
        { id:'WS017', staff:'Phạm Thị Dung', code:'E04', date:'2026-06-21', time:'07:00–15:00', counter:'Quầy 04', checkinTime:'07:00', checkoutTime:'14:58', hours:7.97, status:'checkedin', note:'' },
        // Đã duyệt, chờ NV chấm công (approved)
        { id:'WS018', staff:'Lê Văn Cường',  code:'E03', date:'2026-06-21', time:'15:00–22:00', counter:'Quầy 03', checkinTime:'—',     checkoutTime:'—',     hours:null, status:'approved',  note:'' },
      ];

      const attData = [
        { id:'E01', name:'Nguyễn Văn An', ca:'CA-001', date:'16/06', schedule:'07:00–15:00', checkin:'07:03',  checkout:'15:02', hours:8.0,  ex:'ok' },
        { id:'E02', name:'Trần Thị Bình', ca:'CA-002', date:'16/06', schedule:'15:00–22:00', checkin:'15:12',  checkout:'22:05', hours:6.9,  ex:'late' },
        { id:'E03', name:'Lê Văn Cường',  ca:'CA-003', date:'16/06', schedule:'07:00–15:00', checkin:'07:00',  checkout:'15:00', hours:8.0,  ex:'ok' },
        { id:'E04', name:'Phạm Thị Dung', ca:'CA-004', date:'17/06', schedule:'14:00–22:00', checkin:'14:05',  checkout:'22:00', hours:7.9,  ex:'ok' },
        { id:'E05', name:'Hoàng Văn Em',  ca:'CA-005', date:'17/06', schedule:'07:00–15:00', checkin:'—',      checkout:'—',     hours:null, ex:'absent' },
        { id:'E01', name:'Nguyễn Văn An', ca:'CA-006', date:'18/06', schedule:'07:00–15:00', checkin:'07:00',  checkout:'15:00', hours:8.0,  ex:'ok' },
        { id:'E02', name:'Trần Thị Bình', ca:'CA-007', date:'18/06', schedule:'15:00–22:00', checkin:'15:08',  checkout:'—',     hours:null, ex:'forgot' },
        { id:'E03', name:'Lê Văn Cường',  ca:'CA-008', date:'19/06', schedule:'07:00–15:00', checkin:'07:02',  checkout:'15:01', hours:8.0,  ex:'ok' },
        { id:'E01', name:'Nguyễn Văn An', ca:'CA-009', date:'20/06', schedule:'15:00–22:00', checkin:'15:00',  checkout:'22:00', hours:7.0,  ex:'ok' },
        { id:'E02', name:'Trần Thị Bình', ca:'CA-010', date:'21/06', schedule:'07:00–15:00', checkin:'06:58',  checkout:'15:00', hours:8.0,  ex:'ok' },
        { id:'E04', name:'Phạm Thị Dung', ca:'CA-011', date:'21/06', schedule:'07:00–15:00', checkin:'07:05',  checkout:'15:00', hours:7.9,  ex:'ok' },
        { id:'E03', name:'Lê Văn Cường',  ca:'CA-012', date:'21/06', schedule:'15:00–22:00', checkin:'—',      checkout:'—',     hours:null, ex:'absent' },
      ];

      const tierRank = { 'Thành viên':0,'Bạc':1,'Vàng':2,'Kim Cương':3 };
      const tierBadge = { 'Kim Cương':'bg-blue-100 text-blue-700','Vàng':'bg-yellow-100 text-yellow-700','Bạc':'bg-slate-200 text-slate-700','Thành viên':'bg-slate-100 text-slate-500' };
      const tierGradient = { 'Kim Cương':'bg-gradient-to-br from-blue-400 to-indigo-600','Vàng':'bg-gradient-to-br from-yellow-400 to-amber-600','Bạc':'bg-gradient-to-br from-gray-300 to-gray-500','Thành viên':'bg-gradient-to-br from-slate-400 to-slate-600' };
      const tierDiscount = { 'Kim Cương':0.05,'Vàng':0.03,'Bạc':0.01,'Thành viên':0 };

      const revDayData = [10800000,12500000,9200000,11400000,14100000,10756000,13478000];
      const revDayLabels = ['T2 15/6','T3 16/6','T4 17/6','T5 18/6','T6 19/6','T7 20/6','CN 21/6'];
      const revWeekData = [72400000,81200000,68900000,79500000,85100000,77300000,82300000];
      const revWeekLabels = ['Tuần 47\n(18-24/11)','Tuần 48\n(25-1/12)','Tuần 49\n(2-8/12)','Tuần 50\n(9-15/12)','Tuần 51\n(16-22/12)','Tuần 1\n(23-29/5)','Tuần 2\n(30-6/6)'];
      const revMonthData = [310000000,285000000,342000000,298000000,365000000,321000000,388000000];
      const revMonthLabels = ['T12/2025','T1/2026','T2/2026','T3/2026','T4/2026','T5/2026','T6/2026'];
      let revMode = 'day';

      let pendingUpgrades = [];
      let tierHistory = [];
      let currentProfileId = null;
      let cart = [];
      let shiftOpen = false;
      let posOpenShiftCash = 0;
      let payMethod = 'cash';
      let posCustomer = null;
      let punchCheckedIn = false;
      let punchTime = null;
      let currentRole = null;
      let chartInstances = {};

      const staffInfo = { id:'E01', name:'Văn C', phone:'0987654323', email:'vanc@emarket.vn', gender:'Nam', age:27, store:'eMarket Q7', addr:'123 Nguyễn Văn Linh, Quận 7, HCM' };
      const shiftData = {
        '2026-06-15':[{type:'Ca sáng',time:'07:00 – 15:00',counter:'Quầy 02',status:'Hoàn thành'}],
        '2026-06-16':[{type:'Ca chiều',time:'15:00 – 23:00',counter:'Quầy 01',status:'Hoàn thành'}],
        '2026-06-17':[{type:'Ca sáng',time:'07:00 – 15:00',counter:'Quầy 02',status:'Hoàn thành'}],
        '2026-06-19':[{type:'Ca sáng',time:'07:00 – 15:00',counter:'Quầy 03',status:'Hoàn thành'}],
        '2026-06-20':[{type:'Ca sáng',time:'07:00 – 15:00',counter:'Quầy 02',status:'Dự kiến'}],
        '2026-06-22':[{type:'Ca chiều',time:'15:00 – 23:00',counter:'Quầy 02',status:'Dự kiến'}],
        '2026-06-24':[{type:'Ca sáng',time:'07:00 – 15:00',counter:'Quầy 01',status:'Dự kiến'}],
        '2026-06-26':[{type:'Ca tối',time:'17:00 – 22:00',counter:'Quầy 04',status:'Dự kiến'}],
        '2026-06-27':[{type:'Ca sáng',time:'07:00 – 15:00',counter:'Quầy 02',status:'Dự kiến'}],
      };
      const TODAY_STR = '2026-06-21';
      let selectedDay = TODAY_STR;
      let monthView = { y:2026, m:5 };
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

      function openModal(id){ document.getElementById(id).classList.remove('hidden'); }
      function closeModal(id){ document.getElementById(id).classList.add('hidden'); }

      function stBadge(st){
        const m = { paid:['Đã thanh toán','bg-green-100 text-green-700'], refund:['Đã hoàn','bg-indigo-100 text-indigo-700'], cancel:['Đã hủy','bg-red-100 text-red-700'] };
        const x = m[st]||m.paid;
        return `<span class="text-xs px-2 py-1 rounded-full font-medium ${x[1]}">${x[0]}</span>`;
      }

      function exBadge(ex){
        const m = { ok:'<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Đúng giờ</span>', late:'<span class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Đi trễ</span>', forgot:'<span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Quên check-out</span>', absent:'<span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Vắng mặt</span>' };
        return m[ex]||'';
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

      function doLogin(){
        const user = document.getElementById('loginUser').value.trim().toUpperCase();
        const pass = document.getElementById('loginPass').value.trim();
        const err  = document.getElementById('loginErr');
        err.classList.add('hidden');
        const acct = ACCOUNTS[user];
        if(!acct || acct.pin !== pass){
          err.textContent = 'Mã tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại.';
          err.classList.remove('hidden');
          return;
        }
        currentRole = acct.role;
        document.getElementById('login').classList.add('hidden');
        if(acct.role==='thu_ngan' && !shiftOpen){
          document.getElementById('gateStaffName').textContent = acct.name;
          document.getElementById('gateStaffRole').textContent = 'Thu ngân · '+user;
          document.getElementById('gateStaffAvatar').textContent = initials(acct.name);
          document.getElementById('posOpenShiftGate').classList.remove('hidden');
          document.getElementById('posOpenShiftGate').classList.add('flex');
          updateGateCashPreview();
          lucide.createIcons();
          return;
        }
        document.getElementById('app-'+acct.role).classList.remove('hidden');
        document.getElementById('app-'+acct.role).classList.add('flex');
        initRole(acct.role);
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
        if(screen==='mgr-revenue')   initRevCharts();
        if(screen==='mgr-shifts')    renderWorkShiftList();
        if(screen==='mgr-attendance') renderAttendance(attData);
        if(screen==='mgr-orders')    renderMgrOrders(orders);
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
            renderAttendance(attData);
            renderMgrOrders(orders);
            renderMgrCustomers(customers);
            renderWeekGrid();
            updateMgrNotifications();
            lucide.createIcons();
          },50);
        }
        if(role==='thu_ngan'){
          renderCartUI();
          renderPosOrders(orders);
          renderPosCustomerList(customers);
          lucide.createIcons();
        }
        if(role==='cskh'){
          renderCsCustomers(customers);
          renderUpgrades();
          renderTierHistory();
          lucide.createIcons();
        }
        if(role==='cham_cong'){
          renderStaffProfile();
          renderWeek();
          lucide.createIcons();
        }
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
        const dayDetails = [
          { rev:10800000,orders:146,newCust:3,staff:6 },
          { rev:12500000,orders:168,newCust:5,staff:7 },
          { rev:9200000, orders:124,newCust:2,staff:5 },
          { rev:11400000,orders:154,newCust:4,staff:6 },
          { rev:14100000,orders:190,newCust:8,staff:8 },
          { rev:10756000,orders:145,newCust:6,staff:7 },
          { rev:13478000,orders:182,newCust:9,staff:5 },
        ];
        chartInstances['dashChart'] = new Chart(ctx, {
          type:'bar',
          data:{ labels:revDayLabels, datasets:[{ data:revDayData, backgroundColor:'rgba(16,185,129,0.7)', borderRadius:6, hoverBackgroundColor:'#059669' }] },
          options:{
            responsive:true, plugins:{ legend:{display:false}, tooltip:{
              callbacks:{ title:(items)=>revDayLabels[items[0].dataIndex].replace('\n',' '), label:(item)=>{
                const d=dayDetails[item.dataIndex];
                return [`Doanh thu: ${fmt(d.rev)}`,`Đơn hàng: ${d.orders}`,`KH mới: ${d.newCust}`,`NV làm: ${d.staff}`];
              }}
            }},
            scales:{ y:{ ticks:{ callback:(v)=>(v/1000000).toFixed(1)+'M' }, grid:{ color:'#f1f5f9' } }, x:{ grid:{display:false} } }
          }
        });
      }

      function setRevMode(mode){
        revMode = mode;
        document.querySelectorAll('.revtab').forEach(btn=>{
          btn.className = btn.className.replace(' bg-white text-slate-800 shadow-sm','').replace(' text-slate-500 hover:text-slate-700','');
          btn.className += ' text-slate-500 hover:text-slate-700';
        });
        const active = document.getElementById('revTab'+mode.charAt(0).toUpperCase()+mode.slice(1));
        if(active){
          active.className = active.className.replace(' text-slate-500 hover:text-slate-700','');
          active.className += ' bg-white text-slate-800 shadow-sm';
        }
        initRevCharts();
      }

      function initRevCharts(){
        destroyChart('revChart');
        const ctx = document.getElementById('revChart');
        if(ctx){
          let labels, data, targetData, titleEl;
          if(revMode==='week'){
            labels = revWeekLabels;
            data   = revWeekData;
            targetData = Array(7).fill(78000000);
          } else if(revMode==='month'){
            labels = revMonthLabels;
            data   = revMonthData;
            targetData = Array(7).fill(320000000);
          } else {
            labels = revDayLabels;
            data   = revDayData;
            targetData = Array(7).fill(12000000);
          }
          const titleMap = { day:'Doanh thu theo ngày (15–21/06/2026)', week:'Doanh thu 7 tuần gần nhất', month:'Doanh thu 7 tháng gần nhất' };
          const titleEl2 = ctx.closest('.bg-white')?.querySelector('h2');
          if(titleEl2) titleEl2.textContent = titleMap[revMode] || titleMap.day;

          chartInstances['revChart'] = new Chart(ctx,{
            type:'bar',
            data:{ labels, datasets:[
              { label:'Doanh thu', data, backgroundColor:'rgba(16,185,129,0.7)', borderRadius:6, hoverBackgroundColor:'#059669' },
              { label:'Mục tiêu', data:targetData, type:'line', borderColor:'#94a3b8', borderDash:[4,4], pointRadius:0, fill:false }
            ]},
            options:{ responsive:true, plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:(i)=>i.dataset.label+': '+fmt(i.raw) }}},
              scales:{ y:{ ticks:{ callback:(v)=>revMode==='month'?(v/1000000000).toFixed(2)+'B':(v/1000000).toFixed(1)+'M' }, grid:{ color:'#f1f5f9' } }, x:{ grid:{display:false} } } }
          });
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
      }

      // =========================================================
      // MANAGER: DASHBOARD
      // =========================================================
      function renderRecentOrders(){
        const t = document.getElementById('recentOrders'); if(!t) return;
        t.innerHTML = orders.slice(0,6).map(o=>`
          <tr class="hover:bg-slate-50 cursor-pointer" onclick="showOrderDetail('${o.id}')">
            <td class="px-5 py-3 font-mono font-semibold text-sm">${o.id}</td>
            <td class="px-5 py-3 text-slate-500 text-sm">${o.time}</td>
            <td class="px-5 py-3 text-slate-500 text-sm">${o.cust}</td>
            <td class="px-5 py-3 text-right font-semibold text-sm">${fmt(o.total)}</td>
            <td class="px-5 py-3 text-center">${stBadge(o.st)}</td>
          </tr>`).join('');
      }

      function renderStaffPerf(){
        const el = document.getElementById('staffPerf'); if(!el) return;
        const staff = [{name:'Nguyễn Văn An',orders:48,rev:3540000},{name:'Trần Thị Bình',orders:41,rev:3021000},{name:'Lê Văn Cường',orders:36,rev:2650000},{name:'Phạm Thị Dung',orders:34,rev:2487000},{name:'Hoàng Văn Em',orders:23,rev:1780000}];
        const cols = ['bg-emerald-500','bg-indigo-500','bg-amber-500','bg-pink-500','bg-slate-400'];
        const maxRev = staff[0].rev;
        el.innerHTML = staff.map((s,i)=>`
          <div>
            <div class="flex justify-between text-sm mb-1"><span class="font-medium">${s.name}</span><span class="text-slate-500 text-xs">${s.orders} đơn · ${(s.rev/1e6).toFixed(2)}M</span></div>
            <div class="w-full bg-slate-100 rounded-full h-2"><div class="${cols[i]} h-2 rounded-full" style="width:${(s.rev/maxRev*100).toFixed(0)}%"></div></div>
          </div>`).join('');
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
                ${s.status==='approved'?'<span class="text-xs text-slate-400 italic">Chờ NV chấm công</span>':''}
                ${s.status==='absent'||s.status==='rejected'?`<span class="text-xs text-slate-400 italic">${s.note||'—'}</span>`:''}
              </div>
            </td>
          </tr>`;
        }).join('');
        lucide.createIcons();
      }

      // Quản lý xác nhận chấm công của NV
      function wsConfirm(id){
        const s = workShifts.find(x=>x.id===id);
        if(!s) return;
        if(!confirm(`Xác nhận ghi nhận ngày công cho ${s.staff}?\nCa: ${s.time} ngày ${s.date.split('-').reverse().join('/')}\nCheck-in: ${s.checkinTime} | Check-out: ${s.checkoutTime}`)) return;
        s.status='done';
        renderWorkShiftList(); updateMgrNotifications();
        toast(`✅ Đã xác nhận ca làm việc của ${s.staff}`,'success');
      }

      // Quản lý từ chối xác nhận (không ghi nhận ngày công)
      function wsReject(id){
        const s = workShifts.find(x=>x.id===id);
        if(!s) return;
        const reason = prompt(`Lý do từ chối xác nhận ca của ${s.staff}?\n(Ví dụ: Quên check-out, không đủ giờ...)`);
        if(reason===null) return; // user cancelled
        s.status='rejected';
        s.note = reason || 'Từ chối bởi quản lý';
        renderWorkShiftList(); updateMgrNotifications();
        toast(`❌ Đã từ chối xác nhận ca của ${s.staff}`,'warning');
      }

      // Xác nhận tất cả các ca đang chờ
      function confirmAllCheckins(){
        const pending = workShifts.filter(s=>s.status==='checkedin');
        if(pending.length===0){ toast('Không có ca nào chờ xác nhận','info'); return; }
        if(!confirm(`Xác nhận tất cả ${pending.length} ca đang chờ?`)) return;
        pending.forEach(s=>{ s.status='done'; });
        renderWorkShiftList(); updateMgrNotifications();
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
        if(typeof XLSX==='undefined'){ toast('SheetJS chưa tải, vui lòng thử lại','error'); return; }
        const rows = [['Mã NV','Tên nhân viên','Ngày','Ca dự kiến','Quầy','Check-in','Check-out','Số giờ','Trạng thái','Ghi chú']];
        const statusLabel = { approved:'Chờ chấm công', checkedin:'Chờ xác nhận', done:'Đã xác nhận', rejected:'Từ chối', absent:'Vắng mặt' };
        workShifts.forEach(s=>{
          rows.push([s.code, s.staff, s.date.split('-').reverse().join('/'), s.time, s.counter, s.checkinTime, s.checkoutTime, s.hours!=null?s.hours.toFixed(1):'—', statusLabel[s.status]||s.status, s.note||'']);
        });
        const ws = XLSX.utils.aoa_to_sheet(rows);
        // Column widths
        ws['!cols'] = [8,18,12,14,10,10,10,8,16,24].map(w=>({wch:w}));
        // Header style (basic)
        const headerRange = XLSX.utils.decode_range(ws['!ref']);
        for(let C=headerRange.s.c; C<=headerRange.e.c; C++){
          const addr = XLSX.utils.encode_cell({r:0,c:C});
          if(!ws[addr]) continue;
          ws[addr].s = { font:{bold:true}, fill:{fgColor:{rgb:'1e293b'}}, alignment:{horizontal:'center'} };
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ca làm việc');
        XLSX.writeFile(wb, `emarket_ca_lam_viec_${new Date().toISOString().slice(0,10)}.xlsx`);
        toast('✅ Đã xuất file Excel ca làm việc','success');
      }

      // Hàm giữ lại cho backward-compat (dùng trong notifications panel)
      function confirmCheckin(id){ wsConfirm(id); }
      function rejectCheckin(id){ wsReject(id); }
      function approveShift(id){
        const s = managedShifts.find(x=>x.id===id);
        if(s){ s.status='approved'; renderWeekGrid(); toast('Đã duyệt ca của '+s.staff,'success'); }
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
      });

      function deleteShift(id){
        const idx = managedShifts.findIndex(x=>x.id===id);
        if(idx>-1){ const name=managedShifts[idx].staff; managedShifts.splice(idx,1); renderShiftList(); renderWeekGrid(); toast('Đã xóa ca của '+name,'warning'); }
      }

      function approveAllShifts(){
        let cnt = 0;
        managedShifts.forEach(s=>{ if(s.status==='pending'){ s.status='approved'; cnt++; } });
        renderWeekGrid();
        toast(cnt>0?`Đã duyệt tất cả ${cnt} ca`:'Không có ca nào cần duyệt', cnt>0?'success':'info');
      }

      function openAddShiftModal(){
        document.getElementById('asConflictErr').classList.add('hidden');
        openModal('modalAddShift');
      }

      function saveNewShift(){
        const staff   = document.getElementById('asStaff').value;
        const type    = document.getElementById('asType').value;
        const date    = document.getElementById('asDate').value;
        const counter = document.getElementById('asCounter').value;
        // Date validation: max 30 days ahead
        const inputDate = new Date(date);
        const today = new Date('2026-06-21');
        const diff  = (inputDate - today) / (1000*60*60*24);
        const errEl = document.getElementById('asConflictErr');
        if(diff > 30){ errEl.textContent='Lịch ca chỉ được tạo trước tối đa 30 ngày.'; errEl.classList.remove('hidden'); return; }
        if(diff < 0){ errEl.textContent='Không thể tạo ca cho ngày đã qua.'; errEl.classList.remove('hidden'); return; }
        // Conflict check: same staff, same day, same type
        const timeMap = { 'Ca sáng':'07:00–15:00','Ca chiều':'15:00–22:00','Ca tối':'17:00–22:00' };
        const dateStr = date.split('-').reverse().join('/');
        const conflict = managedShifts.find(s=>s.staff===staff && s.date===dateStr && s.time===timeMap[type]);
        if(conflict){ errEl.textContent='Nhân viên đã có ca trùng giờ trong ngày này.'; errEl.classList.remove('hidden'); return; }
        const newId = 'CA'+String(managedShifts.length+1).padStart(3,'0');
        managedShifts.push({ id:newId, staff, code:'E0X', date:dateStr, time:timeMap[type], counter, status:'pending' });
        closeModal('modalAddShift');
        renderShiftList();
        renderWeekGrid();
        toast('Đã tạo ca cho '+staff+' (Dự kiến)','success');
      }

      // =========================================================
      // MANAGER: WEEK GRID
      // =========================================================
      function renderWeekGrid(){
        const t = document.getElementById('weekGrid'); if(!t) return;
        const staffList = ['Nguyễn Văn An','Trần Thị Bình','Lê Văn Cường','Phạm Thị Dung','Hoàng Văn Em'];
        const weekDates = ['15/06/2026','16/06/2026','17/06/2026','18/06/2026','19/06/2026','20/06/2026','21/06/2026'];
        const typeColor = { 'Ca sáng':'emerald','Ca chiều':'amber','Ca tối':'indigo' };
        const statusColor = { pending:'bg-amber-100 text-amber-700',approved:'bg-emerald-100 text-emerald-700',done:'bg-slate-100 text-slate-600',absent:'bg-red-100 text-red-700' };
        t.innerHTML = staffList.map((staff,si)=>{
          const cells = weekDates.map(d=>{
            const s = managedShifts.find(x=>x.staff===staff && x.date===d);
            if(!s) return `<td class="p-2 align-top text-center"><button onclick="openAddShiftModal()" class="text-slate-200 hover:text-emerald-500 transition-colors mt-2"><i data-lucide="plus" class="w-4 h-4"></i></button></td>`;
            const isAM = s.time.includes('07')||s.time.includes('06');
            const isPM = s.time.includes('15')||s.time.includes('14');
            const caLabel = isAM?'Ca Sáng':isPM?'Ca Chiều':'Ca Tối';
            const tc = isAM?'emerald':isPM?'amber':'indigo';
            const isPending = s.status==='pending';
            const isApproved = s.status==='approved';
            const isDone = s.status==='done';
            const isAbsent = s.status==='absent';
            return `<td class="p-2 align-top">
              <div class="rounded-xl p-2.5 text-xs cursor-pointer transition-all hover:shadow-md border-2
                ${isPending?'bg-amber-50 border-amber-300':''}
                ${isApproved?'bg-emerald-50 border-emerald-300':''}
                ${isDone?'bg-slate-50 border-slate-200':''}
                ${isAbsent?'bg-red-50 border-red-200':''}
              " onclick="approveShiftDialog('${s.id}')">
                <div class="flex items-start justify-between gap-1 mb-1">
                  <span class="font-bold text-slate-800">${s.time}</span>
                  ${isPending?`<button onclick="event.stopPropagation();approveShift('${s.id}')" class="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700">Duyệt</button>`:''}
                  ${isApproved?`<span class="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">✓</span>`:''}
                </div>
                <p class="text-slate-500">${s.counter}</p>
                <div class="mt-1.5 flex items-center justify-between">
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full
                    ${isPending?'bg-amber-200 text-amber-800':''}
                    ${isApproved?'bg-emerald-100 text-emerald-700':''}
                    ${isDone?'bg-slate-200 text-slate-600':''}
                    ${isAbsent?'bg-red-100 text-red-700':''}
                  ">${isPending?'Dự kiến':isApproved?'Đã duyệt':isDone?'Đã xong':'Vắng mặt'}</span>
                  <button onclick="event.stopPropagation();deleteShift('${s.id}')" class="text-slate-300 hover:text-red-500 transition-colors" title="Xóa lịch ca">
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>
                </div>
              </div>
            </td>`;
          }).join('');
          return `<tr class="border-b border-slate-100"><td class="p-3 min-w-[130px]"><p class="font-semibold text-sm">${staff}</p><p class="text-xs text-slate-400">E0${si+1}</p></td>${cells}</tr>`;
        }).join('');
        lucide.createIcons();
      }

      function approveShiftDialog(id){
        const s = managedShifts.find(x=>x.id===id);
        if(!s) return;
        if(s.status==='pending'){
          // Hiện dialog xác nhận duyệt lịch ca
          if(confirm(`Duyệt lịch ca?

Nhân viên: ${s.staff} (${s.code})
Ngày: ${s.date}
Giờ: ${s.time}
Quầy: ${s.counter}

Sau khi duyệt, nhân viên sẽ thấy lịch này trên app chấm công.`)){
            approveShift(id);
          }
        } else if(s.status==='approved'){
          alert(`Ca này đã được duyệt.

Nhân viên: ${s.staff}
Ngày: ${s.date} · ${s.time}
Nhân viên có thể chấm công qua app.`);
        }
      }

      // =========================================================
      // MANAGER: ATTENDANCE
      // =========================================================
      function renderAttendance(data){
        const t = document.getElementById('attRows'); if(!t) return;
        if(data.length===0){ t.innerHTML=`<tr><td colspan="9" class="p-8 text-center text-slate-400">Không có dữ liệu.</td></tr>`; return; }
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
            <td class="p-4">
              ${d.ex==='forgot'?`<button class="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-2 py-1 hover:bg-amber-100" onclick="toast('Đã đóng ca thay cho ${d.name}','success')">Đóng ca thay</button>`:''}
            </td>
          </tr>`).join('');
        const cnt = document.getElementById('attCount'); if(cnt) cnt.textContent=data.length;
        const totalH = data.reduce((s,d)=>s+(d.hours||0),0);
        const th = document.getElementById('attTotalHours'); if(th) th.textContent=totalH.toFixed(1)+' giờ';
        lucide.createIcons();
      }

      function filterAttendance(){
        const staff = document.getElementById('attFilterStaff')?.value||'';
        const ex    = document.getElementById('attFilterEx')?.value||'';
        renderAttendance(attData.filter(d=>{
          if(staff && d.name!==staff) return false;
          if(ex    && d.ex!==ex)      return false;
          return true;
        }));
      }

      function resetAttendance(){
        const sf=document.getElementById('attFilterStaff'); if(sf) sf.value='';
        const ef=document.getElementById('attFilterEx');    if(ef) ef.value='';
        renderAttendance(attData);
      }

      // =========================================================
      // MANAGER: ORDERS
      // =========================================================
      function renderMgrOrders(data){
        const t = document.getElementById('mgrOrderRows'); if(!t) return;
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
        const filtered = orders.filter(o=>{
          if(id     && !o.id.toLowerCase().includes(id)) return false;
          if(status && o.st!==status) return false;
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
          <tr class="hover:bg-slate-50 cursor-pointer">
            <td class="p-4 font-mono text-slate-500">${c.id}</td>
            <td class="p-4 font-semibold">${c.name}</td>
            <td class="p-4 text-slate-500">${c.phone}</td>
            <td class="p-4 text-right font-semibold text-emerald-600">${c.points.toLocaleString('vi-VN')}</td>
            <td class="p-4"><span class="text-xs px-2 py-1 rounded-full font-medium ${tierBadge[c.tier]}">${c.tier}</span></td>
            <td class="p-4 text-slate-400">${fmtDate(c.regDate)}</td>
            <td class="p-4"><button onclick="showOrderDetail('${orders.find(o=>o.cust===c.name)?.id||''}')" class="p-1.5 rounded-lg hover:bg-slate-100"><i data-lucide="eye" class="w-4 h-4 text-slate-400"></i></button></td>
          </tr>`).join('');
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

      function exportAttendanceExcel(){
        if(typeof XLSX === 'undefined'){
          toast('Không thể tải thư viện xuất Excel (kiểm tra kết nối)','error'); return;
        }

        // --- Chuẩn bị dữ liệu ---
        const statusLabel = { ok:'Đúng giờ', late:'Đi trễ', forgot:'Quên check-out', absent:'Vắng mặt' };
        const today = new Date();
        const exportDate = today.toLocaleDateString('vi-VN',{weekday:'long',year:'numeric',month:'2-digit',day:'2-digit'});
        const exportTime = today.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});

        // Tính tổng kết
        const totalShifts  = attData.length;
        const totalOnTime  = attData.filter(d=>d.ex==='ok').length;
        const totalLate    = attData.filter(d=>d.ex==='late').length;
        const totalForgot  = attData.filter(d=>d.ex==='forgot').length;
        const totalAbsent  = attData.filter(d=>d.ex==='absent').length;
        const totalHours   = attData.reduce((s,d)=>s+(d.hours||0),0);

        // === XÂY DỰNG MẢNG ROWS (AOA) ===
        // Cột: A B C D E F G H I J
        //      STT | Mã NV | Họ tên | Mã ca | Ngày | Ca dự kiến | Check-in TT | Check-out TT | Số giờ | Trạng thái
        const COL_COUNT = 10;
        const rows = [];

        // Dòng 1: Tiêu đề lớn (merge A1:J1)
        rows.push(['BÁO CÁO CHẤM CÔNG NHÂN VIÊN',...Array(COL_COUNT-1).fill(null)]);
        // Dòng 2: Đơn vị
        rows.push(['Siêu thị eMarket — Chi nhánh Quận 1',...Array(COL_COUNT-1).fill(null)]);
        // Dòng 3: Kỳ báo cáo
        rows.push(['Kỳ báo cáo: Tuần 15/06 – 21/06/2026',...Array(COL_COUNT-1).fill(null)]);
        // Dòng 4: Ngày xuất
        rows.push([`Ngày xuất: ${exportDate} lúc ${exportTime}`,...Array(COL_COUNT-1).fill(null)]);
        // Dòng 5: trống
        rows.push(Array(COL_COUNT).fill(null));

        // Dòng 6: TIÊU ĐỀ TỔNG KẾT
        rows.push(['TỔNG KẾT',...Array(COL_COUNT-1).fill(null)]);
        // Dòng 7-11: KPI tổng kết (2 cột: nhãn | giá trị)
        rows.push(['Tổng số ca',totalShifts,...Array(COL_COUNT-2).fill(null)]);
        rows.push(['Đúng giờ',totalOnTime,'('+(totalOnTime/totalShifts*100).toFixed(1)+'%)',...Array(COL_COUNT-3).fill(null)]);
        rows.push(['Đi trễ',totalLate,'('+(totalLate/totalShifts*100).toFixed(1)+'%)',...Array(COL_COUNT-3).fill(null)]);
        rows.push(['Quên check-out',totalForgot,...Array(COL_COUNT-2).fill(null)]);
        rows.push(['Vắng mặt',totalAbsent,'('+(totalAbsent/totalShifts*100).toFixed(1)+'%)',...Array(COL_COUNT-3).fill(null)]);
        rows.push(['Tổng giờ làm việc',totalHours.toFixed(1)+' giờ',...Array(COL_COUNT-2).fill(null)]);
        // Dòng trống
        rows.push(Array(COL_COUNT).fill(null));

        // Dòng: TIÊU ĐỀ BẢNG CHI TIẾT
        rows.push(['CHI TIẾT CHẤM CÔNG',...Array(COL_COUNT-1).fill(null)]);
        rows.push(Array(COL_COUNT).fill(null));

        // Header bảng
        const HEADER_ROW_IDX = rows.length; // 0-based
        rows.push(['STT','Mã NV','Họ và tên','Mã ca','Ngày','Ca dự kiến','Check-in thực tế','Check-out thực tế','Số giờ','Trạng thái']);

        // Data rows
        attData.forEach((d,i)=>{
          rows.push([
            i+1,
            d.id,
            d.name,
            d.ca,
            d.date+'/2026',
            d.schedule,
            d.checkin,
            d.checkout,
            d.hours!=null ? d.hours : '—',
            statusLabel[d.ex]||d.ex,
          ]);
        });

        // Dòng TỔNG CỘNG
        const TOTAL_ROW_IDX = rows.length;
        rows.push(['TỔNG CỘNG',null,null,null,null,null,null,null,totalHours.toFixed(1)+' giờ',totalShifts+' ca']);

        // Dòng trống + chữ ký
        rows.push(Array(COL_COUNT).fill(null));
        rows.push(Array(COL_COUNT).fill(null));
        rows.push(['Người lập báo cáo',...Array(4).fill(null),'Quản lý phê duyệt',...Array(COL_COUNT-6).fill(null)]);
        rows.push(['(Ký, ghi rõ họ tên)',...Array(4).fill(null),'(Ký, ghi rõ họ tên)',...Array(COL_COUNT-6).fill(null)]);

        // === TẠO WORKSHEET ===
        const ws = XLSX.utils.aoa_to_sheet(rows);

        // === MERGE CELLS ===
        ws['!merges'] = [
          // Tiêu đề lớn
          {s:{r:0,c:0},e:{r:0,c:COL_COUNT-1}},
          {s:{r:1,c:0},e:{r:1,c:COL_COUNT-1}},
          {s:{r:2,c:0},e:{r:2,c:COL_COUNT-1}},
          {s:{r:3,c:0},e:{r:3,c:COL_COUNT-1}},
          // Tiêu đề TỔNG KẾT
          {s:{r:5,c:0},e:{r:5,c:COL_COUNT-1}},
          // KPI rows: value cột B + C
          {s:{r:7,c:1},e:{r:7,c:COL_COUNT-1}},
          {s:{r:9,c:1},e:{r:9,c:COL_COUNT-1}},
          {s:{r:11,c:1},e:{r:11,c:COL_COUNT-1}},
          // Tiêu đề CHI TIẾT
          {s:{r:HEADER_ROW_IDX-2,c:0},e:{r:HEADER_ROW_IDX-2,c:COL_COUNT-1}},
          // Dòng tổng cộng cột A-E
          {s:{r:TOTAL_ROW_IDX,c:0},e:{r:TOTAL_ROW_IDX,c:7}},
          // Chữ ký
          {s:{r:TOTAL_ROW_IDX+3,c:0},e:{r:TOTAL_ROW_IDX+3,c:3}},
          {s:{r:TOTAL_ROW_IDX+3,c:5},e:{r:TOTAL_ROW_IDX+3,c:9}},
          {s:{r:TOTAL_ROW_IDX+4,c:0},e:{r:TOTAL_ROW_IDX+4,c:3}},
          {s:{r:TOTAL_ROW_IDX+4,c:5},e:{r:TOTAL_ROW_IDX+4,c:9}},
        ];

        // === STYLE HELPER ===
        function S(s){ return s; } // passthrough (SheetJS community edition ignores styles but structure still works)

        // === CỘT WIDTHS ===
        ws['!cols'] = [
          {wch:5},  // STT
          {wch:8},  // Mã NV
          {wch:20}, // Họ tên
          {wch:10}, // Mã ca
          {wch:14}, // Ngày
          {wch:14}, // Ca dự kiến
          {wch:16}, // Check-in
          {wch:16}, // Check-out
          {wch:10}, // Số giờ
          {wch:16}, // Trạng thái
        ];

        // === ROW HEIGHTS ===
        const rowHeights = [];
        rowHeights[0] = {hpt:30}; // title
        rowHeights[HEADER_ROW_IDX] = {hpt:22}; // header
        ws['!rows'] = rowHeights;

        // === STYLE CÁC Ô QUAN TRỌNG (SheetJS Pro / xlsx-js-style) ===
        // Community SheetJS không hỗ trợ cell styles, nhưng ta set để tương thích nếu dùng bản Pro
        function styleCell(addr, style){ if(ws[addr]) ws[addr].s = style; }

        const BOLD = {bold:true};
        const CENTER = {horizontal:'center',vertical:'center'};
        const LEFT = {horizontal:'left',vertical:'center'};

        // Title rows
        for(let r=0;r<4;r++){
          const addr = XLSX.utils.encode_cell({r,c:0});
          styleCell(addr,{
            font:{bold:true, sz: r===0?16:11, color:{rgb: r===0?'1e293b':'475569'}},
            alignment:{horizontal:'center',vertical:'center',wrapText:true}
          });
        }
        // TỔNG KẾT header
        styleCell(XLSX.utils.encode_cell({r:5,c:0}),{
          font:{bold:true,sz:12,color:{rgb:'ffffff'}},
          fill:{patternType:'solid',fgColor:{rgb:'1e293b'}},
          alignment:CENTER
        });
        // CHI TIẾT header
        styleCell(XLSX.utils.encode_cell({r:HEADER_ROW_IDX-2,c:0}),{
          font:{bold:true,sz:12,color:{rgb:'ffffff'}},
          fill:{patternType:'solid',fgColor:{rgb:'1e293b'}},
          alignment:CENTER
        });
        // KPI labels
        for(let r=6;r<=12;r++){
          styleCell(XLSX.utils.encode_cell({r,c:0}),{font:{bold:true,sz:10},alignment:LEFT});
          styleCell(XLSX.utils.encode_cell({r,c:1}),{
            font:{bold:true,sz:11,color:{rgb: r===8?'d97706':r===10?'dc2626':'059669'}},
            alignment:LEFT
          });
        }
        // Bảng header row
        const headerColors = {0:'374151',1:'374151',2:'374151',3:'374151',4:'374151',5:'374151',6:'374151',7:'374151',8:'374151',9:'374151'};
        for(let c=0;c<COL_COUNT;c++){
          const addr = XLSX.utils.encode_cell({r:HEADER_ROW_IDX,c});
          styleCell(addr,{
            font:{bold:true,sz:10,color:{rgb:'ffffff'}},
            fill:{patternType:'solid',fgColor:{rgb:'1e293b'}},
            alignment:{horizontal:'center',vertical:'center',wrapText:false},
            border:{
              top:{style:'thin',color:{rgb:'e2e8f0'}},
              bottom:{style:'medium',color:{rgb:'94a3b8'}},
              left:{style:'thin',color:{rgb:'e2e8f0'}},
              right:{style:'thin',color:{rgb:'e2e8f0'}}
            }
          });
        }
        // Data rows
        const exColor = {ok:'15803d',late:'b45309',forgot:'c2410c',absent:'b91c1c'};
        attData.forEach((d,i)=>{
          const r = HEADER_ROW_IDX + 1 + i;
          const isEven = i%2===0;
          const bgFill = isEven ? {patternType:'solid',fgColor:{rgb:'f8fafc'}} : {patternType:'solid',fgColor:{rgb:'ffffff'}};
          const border = {top:{style:'thin',color:{rgb:'e2e8f0'}},bottom:{style:'thin',color:{rgb:'e2e8f0'}},left:{style:'thin',color:{rgb:'e2e8f0'}},right:{style:'thin',color:{rgb:'e2e8f0'}}};
          for(let c=0;c<COL_COUNT;c++){
            const addr = XLSX.utils.encode_cell({r,c});
            if(!ws[addr]) continue;
            const isTT = c===9;
            ws[addr].s = {
              font:{ sz:10, color:{rgb: isTT?(exColor[d.ex]||'374151'):'374151'}, bold: isTT||c===8 },
              fill: bgFill,
              alignment:{ horizontal: c<=1||c===3?'center':'left', vertical:'center' },
              border
            };
          }
        });
        // Dòng TỔNG CỘNG
        for(let c=0;c<COL_COUNT;c++){
          const addr = XLSX.utils.encode_cell({r:TOTAL_ROW_IDX,c});
          if(!ws[addr]) ws[addr]={t:'z'};
          ws[addr].s = {
            font:{bold:true,sz:11,color:{rgb:'ffffff'}},
            fill:{patternType:'solid',fgColor:{rgb:'059669'}},
            alignment:{horizontal:c===0?'center':'right',vertical:'center'},
            border:{top:{style:'medium',color:{rgb:'047857'}},bottom:{style:'medium',color:{rgb:'047857'}}}
          };
        }
        // Chữ ký
        for(let rr=TOTAL_ROW_IDX+3;rr<=TOTAL_ROW_IDX+4;rr++){
          const addr1 = XLSX.utils.encode_cell({r:rr,c:0});
          const addr2 = XLSX.utils.encode_cell({r:rr,c:5});
          if(ws[addr1]) ws[addr1].s={font:{italic:true,sz:10,color:{rgb:'64748b'}},alignment:{horizontal:'center'}};
          if(ws[addr2]) ws[addr2].s={font:{italic:true,sz:10,color:{rgb:'64748b'}},alignment:{horizontal:'center'}};
        }

        // === TẠO WORKBOOK & XUẤT ===
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo chấm công');

        // Sheet 2: Tổng hợp theo nhân viên
        const byStaff = {};
        attData.forEach(d=>{
          if(!byStaff[d.name]) byStaff[d.name]={name:d.name,id:d.id,ok:0,late:0,forgot:0,absent:0,hours:0,shifts:0};
          byStaff[d.name].shifts++;
          byStaff[d.name].hours+=(d.hours||0);
          byStaff[d.name][d.ex]=(byStaff[d.name][d.ex]||0)+1;
        });
        const summaryRows=[
          ['TỔNG HỢP THEO NHÂN VIÊN',...Array(6).fill(null)],
          ['Kỳ báo cáo: Tuần 15/06 – 21/06/2026',...Array(6).fill(null)],
          Array(7).fill(null),
          ['Họ và tên','Mã NV','Tổng ca','Đúng giờ','Đi trễ','Vắng mặt','Tổng giờ làm'],
          ...Object.values(byStaff).map(s=>[s.name,s.id,s.shifts,s.ok,s.late,s.absent,s.hours.toFixed(1)]),
          Array(7).fill(null),
          ['Tổng cộng',null,
            Object.values(byStaff).reduce((a,s)=>a+s.shifts,0),
            Object.values(byStaff).reduce((a,s)=>a+s.ok,0),
            Object.values(byStaff).reduce((a,s)=>a+s.late,0),
            Object.values(byStaff).reduce((a,s)=>a+s.absent,0),
            Object.values(byStaff).reduce((a,s)=>a+s.hours,0).toFixed(1),
          ]
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
        ws2['!merges']=[{s:{r:0,c:0},e:{r:0,c:6}},{s:{r:1,c:0},e:{r:1,c:6}}];
        ws2['!cols']=[{wch:20},{wch:8},{wch:9},{wch:9},{wch:9},{wch:9},{wch:14}];
        XLSX.utils.book_append_sheet(wb, ws2, 'Tổng hợp NV');

        const filename = `BaoCaoChamCong_Tuan15-21_06_2026_XuatLuc${exportTime.replace(':','h')}.xlsx`;
        XLSX.writeFile(wb, filename);
        toast('✅ Đã xuất báo cáo chấm công — 2 sheet','success');
      }

      // Tạo báo cáo doanh thu tự động theo mẫu chuẩn (tiêu đề, bảng số liệu,
      // dòng tổng cộng, khu vực ký xác nhận) và xuất ra file Excel (.xlsx)
      // hoàn toàn bằng JavaScript phía trình duyệt, dùng thư viện SheetJS.
      function exportRevenueExcel(){
        if(typeof XLSX === 'undefined'){
          toast('Không thể tải thư viện xuất Excel (kiểm tra kết nối mạng)','error');
          return;
        }
        const modeMap = {
          day:   { labels:revDayLabels,   data:revDayData,   periodLabel:'Theo ngày — 7 ngày gần nhất' },
          week:  { labels:revWeekLabels,  data:revWeekData,  periodLabel:'Theo tuần — 7 tuần gần nhất' },
          month: { labels:revMonthLabels, data:revMonthData, periodLabel:'Theo tháng — 7 tháng gần nhất' },
        };
        const cfg = modeMap[revMode] || modeMap.day;
        const labels = cfg.labels.map(l=>l.replace('\n',' '));
        const data   = cfg.data;
        // Ước tính số đơn hàng tương ứng mỗi kỳ (dựa trên doanh thu trung bình/đơn của ngày hiện tại)
        const avgOrderValue = 73000;
        const orderCounts = data.map(v=>Math.max(1, Math.round(v/avgOrderValue)));
        const totalRev    = data.reduce((s,v)=>s+v,0);
        const totalOrders = orderCounts.reduce((s,v)=>s+v,0);
        const today = new Date();
        const dateStr = today.toLocaleDateString('vi-VN');

        const HEADER_ROW = 5; // chỉ số dòng (0-based) chứa tiêu đề cột STT/Kỳ/...
        const rows = [];
        rows.push(['BÁO CÁO DOANH THU']);
        rows.push(['Siêu thị eMarket — Chi nhánh Quận 1']);
        rows.push(['Kỳ báo cáo: '+cfg.periodLabel]);
        rows.push(['Ngày xuất báo cáo: '+dateStr]);
        rows.push([]);
        rows.push(['STT','Kỳ','Doanh thu (đ)','Số đơn hàng','TB / đơn (đ)']);
        labels.forEach((lb,i)=>{
          rows.push([i+1, lb, data[i], orderCounts[i], Math.round(data[i]/orderCounts[i])]);
        });
        const totalRowIdx = rows.length;
        rows.push(['', 'TỔNG CỘNG', totalRev, totalOrders, Math.round(totalRev/totalOrders)]);
        rows.push([]);
        rows.push([]);
        const sigRowIdx = rows.length;
        rows.push(['Người lập báo cáo', '', 'Kế toán trưởng', '', 'Giám đốc chi nhánh']);
        rows.push(['(Ký, ghi rõ họ tên)', '', '(Ký, ghi rõ họ tên)', '', '(Ký, ghi rõ họ tên)']);

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Gộp ô cho tiêu đề & dòng tổng cộng / khu vực ký tên
        ws['!merges'] = [
          {s:{r:0,c:0},e:{r:0,c:4}},
          {s:{r:1,c:0},e:{r:1,c:4}},
          {s:{r:2,c:0},e:{r:2,c:4}},
          {s:{r:3,c:0},e:{r:3,c:4}},
          {s:{r:totalRowIdx,c:0},e:{r:totalRowIdx,c:1}},
          {s:{r:sigRowIdx,c:0},e:{r:sigRowIdx,c:1}},
          {s:{r:sigRowIdx,c:2},e:{r:sigRowIdx,c:3}},
          {s:{r:sigRowIdx+1,c:0},e:{r:sigRowIdx+1,c:1}},
          {s:{r:sigRowIdx+1,c:2},e:{r:sigRowIdx+1,c:3}},
        ];

        // Độ rộng cột cho bảng cân đối, dễ đọc
        ws['!cols'] = [{wch:6},{wch:26},{wch:18},{wch:14},{wch:16}];

        // Định dạng số có phân tách hàng nghìn + đơn vị "đ" cho các cột tiền
        for(let r=HEADER_ROW+1; r<=totalRowIdx; r++){
          ['C','E'].forEach(col=>{
            const addr = col+(r+1);
            if(ws[addr]) ws[addr].z = '#,##0" đ"';
          });
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo doanh thu');
        const fname = `BaoCaoDoanhThu_${revMode}_${today.toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, fname);
        toast('Đã xuất báo cáo doanh thu: '+fname,'success');
      }

      // =========================================================
      // POS: CART
      // =========================================================
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
        renderCartUI();
      }

      function setQty(i, val){
        const n = parseInt(val);
        if(n>=1) cart[i].qty=n;
        renderCartUI();
      }

      function removeCartItem(i){
        cart.splice(i,1);
        renderCartUI();
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

      function checkout(){
        if(!shiftOpen){ toast('Vui lòng mở ca trước khi thanh toán','warning'); return; }
        if(cart.length===0){ toast('Giỏ hàng trống','error'); return; }
        const subtotal = cart.reduce((s,x)=>s+x.qty*x.price,0);
        const disc     = posCustomer ? Math.floor(subtotal*tierDiscount[posCustomer.tier]) : 0;
        const total    = subtotal - disc;
        const given    = parseFloat((document.getElementById('cashGiven')||{}).value)||0;
        const change   = Math.max(0, given - total);
        const pts      = Math.floor(total/10000*0.5);
        // Receipt
        document.getElementById('receiptItems').innerHTML = cart.map(x=>`<div class="flex justify-between"><span>${x.name} x${x.qty}</span><span>${fmt(x.qty*x.price)}</span></div>`).join('');
        document.getElementById('receiptSubtotal').textContent = fmt(subtotal);
        document.getElementById('receiptDisc').textContent     = '-'+fmt(disc);
        document.getElementById('receiptTotal').textContent    = fmt(total);
        document.getElementById('receiptMethod').textContent   = payMethodLabel(payMethod);
        document.getElementById('receiptGiven').textContent    = payMethod==='cash'?fmt(given):'N/A';
        document.getElementById('receiptChange').textContent   = payMethod==='cash'?fmt(change):'0 đ';
        document.getElementById('receiptPoints').textContent   = '+'+pts+' điểm';
        // Add order to list
        const newOrder = { id:'DH'+String(orders.length+1).padStart(3,'0'), time:new Date().toTimeString().slice(0,5), cust:posCustomer?posCustomer.name:'Khách lẻ', total, payMethod, st:'paid', items:cart.map(x=>({name:x.name,qty:x.qty,price:x.price})) };
        orders.unshift(newOrder);
        // Add loyalty points
        if(posCustomer){ const c=customers.find(x=>x.id===posCustomer.id); if(c){ c.points+=pts; refreshUpgrades(); } }
        cart=[]; clearPosCustomer(); renderCartUI();
        renderPosOrders(orders);
        openModal('modalReceipt');
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

      function confirmOpenShiftGate(){
        const cash = parseFloat(document.getElementById('gateOpenCash').value)||0;
        const err = document.getElementById('gateCashErr');
        if(cash<=0){ err.classList.remove('hidden'); toast('Vui lòng nhập số tiền đầu ca hợp lệ','error'); return; }
        err.classList.add('hidden');
        shiftOpen=true; posOpenShiftCash=cash;
        const gate = document.getElementById('posOpenShiftGate');
        gate.classList.add('hidden'); gate.classList.remove('flex');
        document.getElementById('app-thu_ngan').classList.remove('hidden');
        document.getElementById('app-thu_ngan').classList.add('flex');
        const banner = document.getElementById('posShiftBanner');
        if(banner) banner.classList.add('hidden');
        const badge = document.getElementById('posShiftBadge');
        if(badge){ badge.textContent='● Ca đang mở ('+(gateShiftType==='morning'?'Sáng':'Chiều')+')'; badge.className='text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-medium'; }
        initRole('thu_ngan');
        lucide.createIcons();
        toast('Đã mở ca thành công! Đầu ca: '+fmt(cash),'success');
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

      function confirmCloseShift(){
        const shiftOrders = orders.filter(o=>o.st==='paid');
        const cashRev  = shiftOrders.filter(o=>o.payMethod==='cash').reduce((s,o)=>s+o.total,0);
        const qrRev    = shiftOrders.filter(o=>o.payMethod==='qr').reduce((s,o)=>s+o.total,0);
        const cardRev  = shiftOrders.filter(o=>o.payMethod==='card').reduce((s,o)=>s+o.total,0);
        const totalRev = cashRev+qrRev+cardRev;
        shiftOpen=false; posOpenShiftCash=0; cart=[]; clearPosCustomer(); renderCartUI();
        closeModal('modalCloseShift');
        const badge = document.getElementById('posShiftBadge');
        if(badge){ badge.textContent='⚠ Chưa mở ca'; badge.className='text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-medium'; }
        const banner = document.getElementById('posShiftBanner');
        if(banner) banner.classList.remove('hidden');
        // Return to the Open Shift gate screen for the next shift
        document.getElementById('app-thu_ngan').classList.add('hidden');
        document.getElementById('app-thu_ngan').classList.remove('flex');
        const gateInp = document.getElementById('gateOpenCash');
        if(gateInp) gateInp.value='2000000';
        updateGateCashPreview();
        const gate = document.getElementById('posOpenShiftGate');
        gate.classList.remove('hidden'); gate.classList.add('flex');
        lucide.createIcons();
        toast('Đã đóng ca. Tổng doanh thu: '+fmt(totalRev),'success');
      }

      // Pre-fill close shift modal
      document.getElementById('modalCloseShift').addEventListener('click', ()=>{
        const shiftOrders = orders.filter(o=>o.st==='paid');
        const cashRev  = shiftOrders.filter(o=>o.payMethod==='cash').reduce((s,o)=>s+o.total,0);
        const qrRev    = shiftOrders.filter(o=>o.payMethod==='qr').reduce((s,o)=>s+o.total,0);
        const cardRev  = shiftOrders.filter(o=>o.payMethod==='card').reduce((s,o)=>s+o.total,0);
        const totalRev = cashRev+qrRev+cardRev;
        const el=(id,t)=>{ const e=document.getElementById(id); if(e) e.textContent=t; };
        el('closeShiftOpenCash', fmt(posOpenShiftCash));
        el('closeShiftCashRev',  fmt(cashRev));
        el('closeShiftTotalCash',fmt(posOpenShiftCash+cashRev));
        el('closeShiftOrderCount',`Doanh thu ca (${shiftOrders.length} hóa đơn)`);
        el('closeShiftCash2',    fmt(cashRev));
        el('closeShiftQR',       fmt(qrRev));
        el('closeShiftCard',     fmt(cardRev));
        el('closeShiftTotal',    fmt(totalRev));
        el('closeShiftStamp',    new Date().toLocaleString('vi-VN'));
      },true);

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
        if(tab==='pos-lookup') renderPosOrders(orders);
        if(tab==='pos-customer') renderPosCustomerList(customers);
      }

      function renderPosOrders(data){
        const t = document.getElementById('posLookupRows'); if(!t) return;
        t.innerHTML = data.map(o=>{
          let actionHtml;
          if(o.returnRequest==='pending'){
            actionHtml = `<span class="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">Chờ duyệt hoàn</span>`;
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
        renderPosOrders(orders.filter(o=>{
          if(id     && !o.id.toLowerCase().includes(id)) return false;
          if(status && o.st!==status) return false;
          return true;
        }));
      }

      // =========================================================
      // POS: RETURN (hoàn hàng)
      // Đơn hàng < 3.000.000đ: thu ngân tự xử lý hoàn hàng ngay.
      // Đơn hàng ≥ 3.000.000đ: gửi yêu cầu, cần quản lý xác nhận.
      // =========================================================
      const RETURN_APPROVAL_THRESHOLD = 3000000;
      let returnRequests = [];
      let returnReqSeq = 1;

      function openReturnModal(orderId){
        const o = orders.find(x=>x.id===orderId);
        if(!o){ toast('Không tìm thấy đơn hàng','error'); return; }
        if(o.st!=='paid'){ toast('Chỉ có thể hoàn đơn hàng đã thanh toán','warning'); return; }
        if(o.returnRequest==='pending'){ toast('Đơn hàng này đang chờ quản lý duyệt hoàn hàng','warning'); return; }
        returnOrder = o;
        document.getElementById('returnOrderInfo').textContent = `${o.id} · ${o.cust} · ${fmt(o.total)} · ${o.time}`;
        document.getElementById('returnReason').value = '';
        document.getElementById('returnItemRows').innerHTML = o.items.map(item=>`
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

      function submitReturn(){
        if(!returnOrder) return;
        const reason = document.getElementById('returnReason').value.trim();
        if(!reason){ toast('Vui lòng nhập lý do hoàn hàng','error'); return; }
        const total = calcReturnTotal();
        if(total<=0){ toast('Vui lòng nhập số lượng sản phẩm cần hoàn','error'); return; }

        const itemsReturned = [];
        let qtyError = false;
        document.querySelectorAll('#returnItemRows tr').forEach((tr,i)=>{
          const inp = tr.querySelector('input[type="number"]');
          const qty = parseInt(inp?.value)||0;
          const maxQty = parseInt(inp?.max)||0;
          if(qty > maxQty){ qtyError = true; return; }
          if(qty > 0) itemsReturned.push({ name:returnOrder.items[i].name, qty, price:returnOrder.items[i].price });
        });
        if(qtyError){ toast('Số lượng hoàn không được vượt quá số lượng đã mua','error'); return; }

        if(returnOrder.total >= RETURN_APPROVAL_THRESHOLD){
          const req = {
            id: 'RT'+String(returnReqSeq++).padStart(3,'0'),
            orderId: returnOrder.id,
            cust: returnOrder.cust,
            orderTotal: returnOrder.total,
            returnAmount: total,
            items: itemsReturned,
            reason,
            status: 'pending',
            requestedAt: new Date().toLocaleString('vi-VN'),
          };
          returnRequests.push(req);
          returnOrder.returnRequest = 'pending';
          closeModal('modalReturn');
          renderPosOrders(orders);
          updateMgrNotifications();
          toast('Đơn hàng ≥ 3.000.000 đ — đã gửi yêu cầu hoàn hàng đến quản lý để xác nhận','warning');
        } else {
          returnOrder.st = 'refund';
          closeModal('modalReturn');
          renderPosOrders(orders);
          toast('Đã hoàn hàng thành công: '+fmt(total),'success');
        }
        returnOrder = null;
      }

      function approveReturnRequest(id){
        const req = returnRequests.find(x=>x.id===id);
        if(!req || req.status!=='pending') return;
        const o = orders.find(x=>x.id===req.orderId);
        if(o){ o.st='refund'; delete o.returnRequest; }
        req.status='approved';
        toast('Đã duyệt yêu cầu hoàn hàng đơn '+req.orderId,'success');
        renderMgrOrders(orders);
        renderPosOrders(orders);
        updateMgrNotifications();
      }

      function rejectReturnRequest(id){
        const req = returnRequests.find(x=>x.id===id);
        if(!req || req.status!=='pending') return;
        const o = orders.find(x=>x.id===req.orderId);
        if(o){ delete o.returnRequest; }
        req.status='rejected';
        toast('Đã từ chối yêu cầu hoàn hàng đơn '+req.orderId,'error');
        renderMgrOrders(orders);
        renderPosOrders(orders);
        updateMgrNotifications();
      }


      // =========================================================
      // SLIDE-OVER: ORDER DETAIL
      // =========================================================
      function showOrderDetail(id){
        const o = orders.find(x=>x.id===id); if(!o) return;
        const panel = document.getElementById('slideOverPanel');
        const content = document.getElementById('slideOverContent');
        content.innerHTML = `
          <div class="mb-4 pb-4 border-b border-slate-100">
            <p class="text-slate-400 text-xs mb-1">Mã đơn hàng</p>
            <p class="text-2xl font-bold font-mono">${o.id}</p>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm mb-6">
            <div><p class="text-slate-400 text-xs">Thời gian</p><p class="font-medium">${o.time}</p></div>
            <div><p class="text-slate-400 text-xs">Khách hàng</p><p class="font-medium">${o.cust}</p></div>
            <div><p class="text-slate-400 text-xs">PT thanh toán</p><p class="font-medium">${payMethodLabel(o.payMethod)}</p></div>
            <div><p class="text-slate-400 text-xs">Trạng thái</p>${stBadge(o.st)}</div>
          </div>
          <h3 class="font-semibold mb-3">Danh sách sản phẩm</h3>
          <table class="w-full text-sm mb-6">
            <thead class="bg-slate-50"><tr class="text-xs text-slate-400 uppercase tracking-wider"><th class="p-3 text-left">Sản phẩm</th><th class="p-3 text-right">SL</th><th class="p-3 text-right">Đơn giá</th><th class="p-3 text-right">Thành tiền</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              ${o.items.map(x=>`<tr><td class="p-3">${x.name}</td><td class="p-3 text-right">${x.qty}</td><td class="p-3 text-right">${fmt(x.price)}</td><td class="p-3 text-right font-semibold">${fmt(x.qty*x.price)}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-slate-500">Tổng cộng</span><span>${fmt(o.total)}</span></div>
            <div class="flex justify-between font-bold text-base border-t border-slate-200 pt-2"><span>Thành tiền</span><span class="text-emerald-700">${fmt(o.total)}</span></div>
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

      function saveNewCust(){
        const name  = document.getElementById('ncName').value.trim();
        const phone = document.getElementById('ncPhone').value.trim();
        const email = document.getElementById('ncEmail').value.trim();
        const dob   = document.getElementById('ncDob').value;
        const errEl = document.getElementById('ncPhoneErr');
        errEl.classList.add('hidden');
        if(!name){ toast('Vui lòng nhập họ tên','error'); return; }
        if(!phone){ errEl.textContent='Số điện thoại không được để trống.'; errEl.classList.remove('hidden'); return; }
        if(!/^0\d{8,10}$/.test(phone)){ errEl.textContent='Số điện thoại không hợp lệ.'; errEl.classList.remove('hidden'); return; }
        if(customers.find(c=>c.phone===phone)){ errEl.textContent='Số điện thoại này đã tồn tại trong hệ thống.'; errEl.classList.remove('hidden'); return; }
        const newId = 'KH'+String(customers.length+1).padStart(3,'0');
        customers.push({ id:newId, name, phone, email, dob, regDate:TODAY_STR, points:0, tier:'Thành viên' });
        closeModal('modalNewCust');
        filterCsCustomers();
        toast('Đã tạo thẻ thành viên cho '+name,'success');
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

      function renderCsHist(id){
        const t = document.getElementById('csHistRows'); if(!t) return;
        const c = customers.find(x=>x.id===(id||currentProfileId));
        const custOrders = c ? orders.filter(o=>o.cust===c.name) : orders.slice(0,5);
        t.innerHTML = custOrders.slice(0,6).map(o=>`
          <tr class="hover:bg-slate-50">
            <td class="p-4 font-mono text-slate-500">${o.id}</td>
            <td class="p-4 text-slate-500">21/06/2026</td>
            <td class="p-4 text-right font-semibold">${fmt(o.total)}</td>
            <td class="p-4 text-right text-emerald-600">+${Math.floor(o.total/10000*0.5)}</td>
            <td class="p-4">${stBadge(o.st)}</td>
          </tr>`).join('');
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

      function saveEditCust(){
        const id    = document.getElementById('ecId').value;
        const c     = customers.find(x=>x.id===id); if(!c) return;
        const name  = document.getElementById('ecName').value.trim();
        const phone = document.getElementById('ecPhone').value.trim();
        const email = document.getElementById('ecEmail').value.trim();
        const dob   = document.getElementById('ecDob').value;
        const errEl = document.getElementById('ecPhoneErr');
        errEl.classList.add('hidden');
        if(!name){ toast('Vui lòng nhập họ tên','error'); return; }
        if(!phone||!/^0\d{8,10}$/.test(phone)){ errEl.textContent='Số điện thoại không hợp lệ.'; errEl.classList.remove('hidden'); return; }
        if(customers.find(x=>x.phone===phone&&x.id!==id)){ errEl.textContent='Số điện thoại này đã tồn tại.'; errEl.classList.remove('hidden'); return; }
        c.name=name; c.phone=phone; c.email=email; c.dob=dob;
        closeModal('modalEditCust');
        renderProfile(id);
        filterCsCustomers();
        renderMgrCustomers(customers);
        toast('Đã cập nhật thông tin khách hàng','success');
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

      function confirmUpgrade(id){
        const c = customers.find(x=>x.id===id); if(!c) return;
        const oldTier = c.tier;
        c.tier = tierForPoints(c.points);
        tierHistory.unshift({ date:new Date().toLocaleDateString('vi-VN'), cust:c.name, action:`${oldTier} → ${c.tier}`, by:'Lê Minh Châu' });
        pendingUpgrades = pendingUpgrades.filter(u=>u.id!==id);
        renderUpgrades();
        renderTierHistory();
        filterCsCustomers();
        if(currentProfileId===id) renderProfile(id);
        toast(`Đã nâng hạng ${c.name}: ${oldTier} → ${c.tier}`,'success');
      }

      function renderTierHistory(){
        const t = document.getElementById('tierHistRows'); if(!t) return;
        if(tierHistory.length===0){ t.innerHTML=`<tr><td colspan="4" class="p-6 text-center text-slate-400">Chưa có lịch sử điều chỉnh.</td></tr>`; return; }
        t.innerHTML = tierHistory.map(h=>`
          <tr class="hover:bg-slate-50">
            <td class="p-3 text-slate-500 text-sm">${h.date}</td>
            <td class="p-3 font-medium">${h.cust}</td>
            <td class="p-3"><span class="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">${h.action}</span></td>
            <td class="p-3 text-slate-500 text-sm">${h.by}</td>
          </tr>`).join('');
      }

      // =========================================================
      // MOBILE: SCHEDULE
      // =========================================================
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
        const base=new Date('2026-06-16T00:00:00');
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
      function togglePunch(){
        const btn=document.getElementById('punchBtn');
        const info=document.getElementById('punchInfo');
        const time=document.getElementById('punchTime');
        const now=new Date().toTimeString().slice(0,5);
        const today='21/06/2026'; // mock today
        if(!punchCheckedIn){
          punchCheckedIn=true; punchTime=now;
          btn.className='w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-5 text-xl font-bold shadow-lg shadow-red-200 transition-colors';
          btn.textContent='Check-out';
          info.classList.remove('hidden');
          time.textContent='Đã check-in lúc '+now;
          toast('Check-in thành công lúc '+now,'success');
          // Cập nhật trạng thái ca trong managedShifts → "Chưa xác nhận"
          const myShift = managedShifts.find(s=>s.code===staffInfo.id && s.date===today && s.status==='approved');
          if(myShift){
            myShift.status='checkedin';
            toast('📋 Ca làm việc của bạn đang chờ Quản lý xác nhận','info');
            updateMgrNotifications();
          }
        } else {
          punchCheckedIn=false;
          btn.className='w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-5 text-xl font-bold shadow-lg shadow-emerald-200 transition-colors';
          btn.textContent='Check-in';
          info.classList.add('hidden');
          toast('Check-out thành công lúc '+now,'success');
        }
      }

      // =========================================================
      // MOBILE: PROFILE
      // =========================================================
      function renderStaffProfile(){
        const s = staffInfo;
        const el=(id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
        el('spHeaderName', s.name);
        el('spHeaderSub',  `${s.id} • ${s.store.toUpperCase()}`);
        el('spNameBig',    s.name);
        el('spPhone',      s.phone);
        el('spStore',      s.store);
        el('spGenderAge',  `${s.gender} • ${s.age} tuổi`);
        el('spEmail',      s.email||'—');
        el('spAddr',       s.addr);
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

      function saveEditStaff(){
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
        if(!age||age<16||age>80){ toast('Tuổi không hợp lệ (16–80)','error'); return; }
        Object.assign(staffInfo, {name,phone,email,gender,age,addr});
        closeModal('modalEditStaff');
        renderStaffProfile();
        toast('Đã cập nhật thông tin cá nhân','success');
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