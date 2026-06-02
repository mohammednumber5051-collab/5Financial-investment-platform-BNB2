import { useState } from "react";

/* ─── Types ─────────────────────────────────────────────────── */
interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  profits: string;
  subscription: string;
  fees: string;
  accountHolder: string;
  iban: string;
  status: "active" | "disabled";
}

/* ─── Mock Data ─────────────────────────────────────────────── */
const initialUsers: User[] = [
  {
    id: "u1",
    username: "abdulrahman",
    password: "Ab@123456",
    name: "عبدالرحمن سعيد يحيى ال فروان",
    profits: "17,400",
    subscription: "1,000",
    fees: "3,610",
    accountHolder: "عبدالرحمن سعيد يحيى ال فروان",
    iban: "SA15 8000 0220 6080 1030 8884",
    status: "active",
  },
  {
    id: "u2",
    username: "khalid_m",
    password: "Kh@789012",
    name: "خالد محمد العمري",
    profits: "8,250",
    subscription: "1,000",
    fees: "3,610",
    accountHolder: "خالد محمد العمري",
    iban: "SA29 6000 0100 0001 2345 6789",
    status: "active",
  },
  {
    id: "u3",
    username: "fatima_a",
    password: "Fa@345678",
    name: "فاطمة أحمد القحطاني",
    profits: "4,900",
    subscription: "1,000",
    fees: "3,610",
    accountHolder: "فاطمة أحمد القحطاني",
    iban: "SA36 8000 0000 6080 1031 0009",
    status: "disabled",
  },
];

const currentUser = {
  name: "عبدالرحمن سعيد يحيى ال فروان",
  currency: "الريال السعودي (ر.س)",
};

const currentAccountData = {
  profits: { amount: "17,400", label: "أرباح الاشتراك", sub: "متاح للسحب الفوري", pct: "12.5%+" },
  subscription: { amount: "1,000", label: "مبلغ الاشتراك", sub: "اشتراك نشط" },
  fees: { amount: "3,610", label: "رسوم السحب", sub: "مطلوبة لكل عملية سحب" },
  bank: {
    holder: "عبدالرحمن سعيد يحيى ال فروان",
    iban: "SA15 8000 0220 6080 1030 8884",
    sub: "حساب بنكي مربوط",
  },
};

const accountInfoFields = [
  { label: "اسم العميل", value: "عبدالرحمن سعيد يحيى ال فروان" },
  { label: "رقم الهوية", value: "1082XXXXXXXX" },
  { label: "البريد الإلكتروني", value: "abdulrahman@example.com" },
  { label: "رقم الجوال", value: "+966 5X XXX XXXX" },
  { label: "تاريخ الانضمام", value: "15 يناير 2025" },
];

/* ─── SVG Icons ──────────────────────────────────────────────── */
const Icon = {
  TrendingUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Dollar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  AlertCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Logout: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Ban: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Admin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

/* ─── Card Icon Button ───────────────────────────────────────── */
function CardIconBtn({ children, bg = "rgba(255,255,255,0.25)" }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: bg }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   USER DASHBOARD
═══════════════════════════════════════════════════════════════ */

function UserHeader({ onAdminClick }: { onAdminClick: () => void }) {
  return (
    <div className="px-4 pt-5 pb-4">
      <div className="flex items-start justify-between">
        <div className="text-right">
          <h1 className="text-[19px] font-extrabold text-[#1a1f3c] leading-tight tracking-tight">
            المنصة المالية
          </h1>
          <p className="text-[11px] text-[#5a6282] mt-1 leading-snug font-medium">
            مرحباً، {currentUser.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 flex-row-reverse">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#d0d7e8] text-[#1a1f3c] text-[11px] font-semibold shadow-sm hover:bg-gray-50 transition-colors">
              {currentUser.currency}
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#d0d7e8] text-[#1a1f3c] text-[11px] font-semibold shadow-sm hover:bg-gray-50 transition-colors">
              <Icon.Logout />
              <span>تسجيل الخروج</span>
            </button>
          </div>
          <button
            onClick={onAdminClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold shadow-sm transition-colors"
            style={{ background: "linear-gradient(135deg,#2952e3,#7c3aed)", color: "white" }}
          >
            <Icon.Admin />
            <span>لوحة الإدارة</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function WithdrawModal({ onClose, maxAmount, iban, fees }: { onClose: () => void; maxAmount: string; iban: string; fees: string }) {
  const [amount, setAmount] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(15,20,50,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl"
        style={{ fontFamily: "'Cairo', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f6]">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f3f5fa] flex items-center justify-center text-[#5a6282] hover:bg-[#e8edf5] transition-colors"
          >
            <Icon.X />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold text-[#1a1f3c]">سحب الأموال</h3>
            <span className="text-[17px]">$</span>
          </div>
          <div className="w-8" />
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <p className="text-[12px] text-[#8892a4] font-medium text-center">
            أدخل مبلغ السحب ورقم الإيبان
          </p>

          {/* Amount field */}
          <div className="text-right">
            <label className="block text-[12px] font-bold text-[#1a1f3c] mb-1.5">
              مبلغ السحب (ر.س)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="أدخل المبلغ"
              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-[#1a1f3c] text-[13px] font-semibold text-right outline-none focus:border-[#c8005a] focus:ring-1 focus:ring-[#c8005a] transition-all"
            />
            <p className="text-[11px] text-[#8892a4] font-medium mt-1.5 text-right">
              الحد الأقصى: {maxAmount} ر.س
            </p>
          </div>

          {/* IBAN field */}
          <div className="text-right">
            <label className="block text-[12px] font-bold text-[#1a1f3c] mb-1.5">
              رقم الإيبان
            </label>
            <div
              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[#1a1f3c] text-[14px] font-bold text-center"
              dir="ltr"
            >
              {iban}
            </div>
          </div>

          {/* Fees warning */}
          <div
            className="flex items-center justify-end gap-2 px-4 py-3 rounded-xl"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <span className="text-[13px] font-bold text-[#92400e]">
              ر.س {fees}  :رسوم السحب
            </span>
            <span className="text-[16px]">⚠️</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-[#e2e8f0] text-[#5a6282] font-bold text-[14px] hover:bg-[#f3f5fa] transition-colors"
            >
              إلغاء
            </button>
            <button
              className="flex-1 py-3 rounded-2xl text-white font-bold text-[14px] shadow-md active:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#c8005a 0%,#f0196e 50%,#ff4d88 100%)" }}
            >
              متابعة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialOperations({ onWithdrawClick }: { onWithdrawClick: () => void }) {
  return (
    <section className="px-4">
      <h2 className="text-[15px] font-bold text-[#1a1f3c] mb-3.5 text-right">العمليات المالية</h2>
      <div className="flex flex-col gap-3">
        <button
          onClick={onWithdrawClick}
          className="w-full flex items-center justify-center gap-3 px-6 py-[14px] rounded-2xl text-white font-bold text-[14px] shadow-md active:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg,#c8005a 0%,#f0196e 50%,#ff4d88 100%)" }}>
          <Icon.ArrowLeft /><span>سحب الأموال</span>
        </button>
        <button className="w-full flex items-center justify-center gap-3 px-6 py-[14px] rounded-2xl text-white font-bold text-[14px] shadow-md active:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg,#0f7a38 0%,#16a34a 50%,#22c55e 100%)" }}>
          <Icon.Plus /><span>إيداع الأموال</span>
        </button>
      </div>
    </section>
  );
}

function GreenProfitCard() {
  return (
    <div className="rounded-3xl p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0b7a44 0%,#0fa558 40%,#14c46a 70%,#2dd87e 100%)" }}>
      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.3)" }} />
      <div className="absolute -top-10 right-1/3 w-28 h-28 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.4)" }} />
      <div className="flex items-start justify-between mb-7 relative z-10">
        <CardIconBtn><Icon.TrendingUp /></CardIconBtn>
        <span className="bg-white/25 text-white text-[10px] font-bold px-3 py-1 rounded-lg">{currentAccountData.profits.pct}</span>
      </div>
      <div className="text-right relative z-10">
        <p className="text-white/80 text-[11px] font-medium mb-1">{currentAccountData.profits.label}</p>
        <p className="text-white font-extrabold leading-none" style={{ fontSize: "1.95rem" }}>
          {currentAccountData.profits.amount} <span className="text-[19px]">ر.س</span>
        </p>
        <p className="text-white/70 text-[11px] font-medium mt-2">{currentAccountData.profits.sub}</p>
      </div>
    </div>
  );
}

function BlueSubscriptionCard() {
  return (
    <div className="rounded-3xl p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#2952e3 0%,#4f46e5 40%,#7c3aed 100%)" }}>
      <div className="absolute -bottom-10 -right-6 w-40 h-40 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.5)" }} />
      <div className="flex items-start justify-between mb-7 relative z-10">
        <CardIconBtn bg="rgba(255,255,255,0.22)"><Icon.Dollar /></CardIconBtn>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block shadow-sm shadow-emerald-300 mt-1" />
      </div>
      <div className="text-right relative z-10">
        <p className="text-white/80 text-[11px] font-medium mb-1">{currentAccountData.subscription.label}</p>
        <p className="text-white font-extrabold leading-none" style={{ fontSize: "1.95rem" }}>
          {currentAccountData.subscription.amount} <span className="text-[19px]">ر.س</span>
        </p>
        <p className="text-white/70 text-[11px] font-medium mt-2">{currentAccountData.subscription.sub}</p>
      </div>
    </div>
  );
}

function RedFeesCard() {
  return (
    <div className="rounded-3xl p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#c41e1e 0%,#e83030 30%,#f05a1a 70%,#f97316 100%)" }}>
      <div className="absolute -bottom-8 -left-6 w-36 h-36 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.4)" }} />
      <div className="flex items-start justify-between mb-7 relative z-10">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
          style={{ background: "rgba(180,30,30,0.5)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <Icon.AlertCircle />
        </div>
        <span className="text-white text-[10px] font-bold px-3 py-1 rounded-lg"
          style={{ background: "rgba(210,30,80,0.6)", border: "1px solid rgba(255,255,255,0.2)" }}>رسوم</span>
      </div>
      <div className="text-right relative z-10">
        <p className="text-white/80 text-[11px] font-medium mb-1">{currentAccountData.fees.label}</p>
        <p className="text-white font-extrabold leading-none" style={{ fontSize: "1.95rem" }}>
          {currentAccountData.fees.amount} <span className="text-[19px]">ر.س</span>
        </p>
        <p className="text-white/70 text-[11px] font-medium mt-2">{currentAccountData.fees.sub}</p>
      </div>
    </div>
  );
}

function PurpleBankCard() {
  return (
    <div className="rounded-3xl p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#5b21b6 0%,#7c3aed 40%,#9333ea 80%,#a855f7 100%)" }}>
      <div className="absolute -bottom-10 -right-8 w-44 h-44 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.5)" }} />
      <div className="flex items-start justify-between mb-5 relative z-10">
        <CardIconBtn bg="rgba(255,255,255,0.22)"><Icon.CreditCard /></CardIconBtn>
        <div className="flex items-center gap-1.5">
          <span className="text-white/80 text-[11px] font-semibold">متصل</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
        </div>
      </div>
      <div className="text-right relative z-10 space-y-3.5">
        <div>
          <p className="text-white/60 text-[10px] font-medium mb-0.5">اسم صاحب الحساب</p>
          <p className="text-white font-bold text-[17px] leading-snug">{currentAccountData.bank.holder}</p>
        </div>
        <div>
          <p className="text-white/60 text-[10px] font-medium mb-1">رقم الإيبان</p>
          <p className="text-white font-bold text-[15px] leading-snug" dir="ltr" style={{ textAlign: "right", letterSpacing: "0.07em" }}>
            {currentAccountData.bank.iban}
          </p>
        </div>
        <p className="text-white/60 text-[10px] font-medium">{currentAccountData.bank.sub}</p>
      </div>
    </div>
  );
}

function AccountInfoSection() {
  return (
    <section className="px-4 pb-8">
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e2e8f0]">
        <div className="text-right mb-5">
          <h2 className="text-[17px] font-bold text-[#1a1f3c]">معلومات الحساب</h2>
          <p className="text-[11px] text-[#8892a4] mt-0.5 font-medium">تفاصيل حسابك الشخصي</p>
        </div>
        <div className="flex flex-col gap-4">
          {accountInfoFields.map((f) => (
            <div key={f.label} className="text-right">
              <label className="block text-[10px] font-semibold text-[#8892a4] mb-1.5">{f.label}</label>
              <div className="w-full px-4 py-2.5 rounded-xl bg-[#f3f5fa] border border-[#e2e8f0] text-[#1a1f3c] font-semibold text-[12px] text-right">
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UserDashboard({ onAdminClick }: { onAdminClick: () => void }) {
  const [showWithdraw, setShowWithdraw] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      <UserHeader onAdminClick={onAdminClick} />
      <main className="flex flex-col gap-5 pb-2">
        <FinancialOperations onWithdrawClick={() => setShowWithdraw(true)} />
        <section className="px-4">
          <h2 className="text-[15px] font-bold text-[#1a1f3c] mb-4 text-right">نظرة عامة على الحساب</h2>
          <div className="flex flex-col gap-4">
            <GreenProfitCard />
            <BlueSubscriptionCard />
            <RedFeesCard />
            <PurpleBankCard />
          </div>
        </section>
        <AccountInfoSection />
      </main>
      {showWithdraw && (
        <WithdrawModal
          onClose={() => setShowWithdraw(false)}
          maxAmount={currentAccountData.profits.amount}
          iban={currentAccountData.bank.iban}
          fees={currentAccountData.fees.amount}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
═══════════════════════════════════════════════════════════════ */

const emptyUser: Omit<User, "id"> = {
  username: "",
  password: "",
  name: "",
  profits: "",
  subscription: "1,000",
  fees: "3,610",
  accountHolder: "",
  iban: "",
  status: "active",
};

function UserFormModal({
  mode,
  initial,
  onSave,
  onClose,
}: {
  mode: "create" | "edit";
  initial: Omit<User, "id">;
  onSave: (data: Omit<User, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [showPass, setShowPass] = useState(false);

  function set(key: keyof typeof form, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  const fields: { key: keyof Omit<User, "id" | "status">; label: string; placeholder: string; ltr?: boolean }[] = [
    { key: "username", label: "اسم المستخدم", placeholder: "username" },
    { key: "name", label: "الاسم الكامل", placeholder: "عبدالرحمن سعيد..." },
    { key: "profits", label: "أرباح الاشتراك (ر.س)", placeholder: "17,400" },
    { key: "subscription", label: "مبلغ الاشتراك (ر.س)", placeholder: "1,000" },
    { key: "fees", label: "رسوم السحب (ر.س)", placeholder: "3,610" },
    { key: "accountHolder", label: "اسم صاحب الحساب", placeholder: "الاسم الكامل" },
    { key: "iban", label: "رقم الإيبان", placeholder: "SA15 8000...", ltr: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(15,20,50,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto"
        style={{ fontFamily: "'Cairo', sans-serif" }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f6] sticky top-0 bg-white z-10 rounded-t-3xl">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f3f5fa] flex items-center justify-center text-[#5a6282] hover:bg-[#e8edf5] transition-colors">
            <Icon.X />
          </button>
          <h3 className="text-[15px] font-bold text-[#1a1f3c]">
            {mode === "create" ? "إضافة مستخدم جديد" : "تعديل بيانات المستخدم"}
          </h3>
          <div className="w-8" />
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Password field (special) */}
          <div className="text-right">
            <label className="block text-[11px] font-bold text-[#5a6282] mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[#1a1f3c] text-[12px] font-semibold text-right outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all pr-10"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-[#8892a4] hover:text-[#5a6282]">
                {showPass ? <Icon.EyeOff /> : <Icon.Eye />}
              </button>
            </div>
          </div>

          {/* Other fields */}
          {fields.map((f) => (
            <div key={f.key} className="text-right">
              <label className="block text-[11px] font-bold text-[#5a6282] mb-1.5">{f.label}</label>
              <input
                type="text"
                value={form[f.key] as string}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                dir={f.ltr ? "ltr" : "rtl"}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[#1a1f3c] text-[12px] font-semibold text-right outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
                style={f.ltr ? { textAlign: "left", direction: "ltr" } : {}}
              />
            </div>
          ))}

          {/* Status toggle */}
          <div className="text-right">
            <label className="block text-[11px] font-bold text-[#5a6282] mb-2">حالة الحساب</label>
            <div className="flex gap-2 justify-end">
              {(["active", "disabled"] as const).map((s) => (
                <button key={s} onClick={() => set("status", s)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
                  style={{
                    background: form.status === s ? (s === "active" ? "#dcfce7" : "#fee2e2") : "#f3f5fa",
                    color: form.status === s ? (s === "active" ? "#16a34a" : "#dc2626") : "#8892a4",
                    border: `1.5px solid ${form.status === s ? (s === "active" ? "#86efac" : "#fca5a5") : "#e2e8f0"}`,
                  }}>
                  {s === "active" ? <><Icon.CheckCircle /><span>نشط</span></> : <><Icon.Ban /><span>معطّل</span></>}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button onClick={() => onSave(form)}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-[14px] mt-2 transition-opacity active:opacity-90"
            style={{ background: "linear-gradient(135deg,#2952e3,#7c3aed)" }}>
            {mode === "create" ? "إضافة المستخدم" : "حفظ التعديلات"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,20,50,0.55)" }} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 text-center" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <p className="text-[14px] font-bold text-[#1a1f3c] mb-5">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#5a6282] font-semibold text-[12px] hover:bg-[#f3f5fa] transition-colors">
            إلغاء
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-bold text-[12px] hover:opacity-90 transition-opacity">
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; userId: string }
  | { type: "delete"; userId: string }
  | { type: "disable"; userId: string };

function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [showPassId, setShowPassId] = useState<string | null>(null);

  function handleCreate(data: Omit<User, "id">) {
    setUsers((u) => [...u, { ...data, id: `u${Date.now()}` }]);
    setModal({ type: "none" });
  }

  function handleEdit(data: Omit<User, "id">) {
    if (modal.type !== "edit") return;
    setUsers((u) => u.map((x) => (x.id === modal.userId ? { ...x, ...data } : x)));
    setModal({ type: "none" });
  }

  function handleDelete() {
    if (modal.type !== "delete") return;
    setUsers((u) => u.filter((x) => x.id !== modal.userId));
    setModal({ type: "none" });
  }

  function handleToggleDisable() {
    if (modal.type !== "disable") return;
    const id = modal.userId;
    setUsers((u) => u.map((x) => x.id === id ? { ...x, status: x.status === "active" ? "disabled" : "active" } : x));
    setModal({ type: "none" });
  }

  const editingUser = modal.type === "edit" ? users.find((u) => u.id === modal.userId) : null;
  const disablingUser = modal.type === "disable" ? users.find((u) => u.id === modal.userId) : null;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-10" dir="rtl">
      {/* Admin Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#d0d7e8] text-[#1a1f3c] text-[11px] font-semibold shadow-sm hover:bg-gray-50 transition-colors">
            <Icon.ArrowLeft />
            <span>رجوع</span>
          </button>
          <div className="text-right">
            <h1 className="text-[19px] font-extrabold text-[#1a1f3c]">لوحة الإدارة</h1>
            <p className="text-[11px] text-[#5a6282] font-medium">إدارة حسابات المستخدمين</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "إجمالي المستخدمين", value: users.length, color: "#2952e3" },
            { label: "حسابات نشطة", value: users.filter((u) => u.status === "active").length, color: "#16a34a" },
            { label: "حسابات معطّلة", value: users.filter((u) => u.status === "disabled").length, color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center border border-[#e2e8f0] shadow-sm">
              <p className="font-extrabold text-[22px] leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] font-semibold text-[#8892a4] mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section header + Add button */}
      <div className="px-4 flex items-center justify-between mb-4">
        <button onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[12px] font-bold shadow-md transition-opacity active:opacity-90"
          style={{ background: "linear-gradient(135deg,#0f7a38,#22c55e)" }}>
          <Icon.Plus />
          <span>إضافة مستخدم</span>
        </button>
        <h2 className="text-[15px] font-bold text-[#1a1f3c]">المستخدمون</h2>
      </div>

      {/* User Cards */}
      <div className="px-4 flex flex-col gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-3xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            {/* Card top gradient bar */}
            <div className="h-1.5 w-full"
              style={{ background: user.status === "active" ? "linear-gradient(90deg,#2952e3,#7c3aed)" : "#d1d5db" }} />

            <div className="p-4">
              {/* User identity row */}
              <div className="flex items-start justify-between mb-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${user.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-500 border border-red-200"}`}>
                  {user.status === "active" ? "نشط" : "معطّل"}
                </span>
                <div className="text-right">
                  <p className="text-[14px] font-bold text-[#1a1f3c] leading-snug">{user.name}</p>
                  <p className="text-[11px] text-[#8892a4] font-medium mt-0.5" dir="ltr" style={{ textAlign: "right" }}>@{user.username}</p>
                </div>
              </div>

              {/* Password row */}
              <div className="mb-4 text-right">
                <label className="block text-[10px] font-bold text-[#8892a4] mb-1">كلمة المرور</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#f8f9fc] border border-[#e8eaf0]">
                  <button onClick={() => setShowPassId(showPassId === user.id ? null : user.id)}
                    className="text-[#8892a4] hover:text-[#5a6282]">
                    {showPassId === user.id ? <Icon.EyeOff /> : <Icon.Eye />}
                  </button>
                  <span className="text-[12px] font-semibold text-[#1a1f3c]" dir="ltr">
                    {showPassId === user.id ? user.password : "••••••••"}
                  </span>
                </div>
              </div>

              {/* Financial data grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "أرباح الاشتراك", value: user.profits, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                  { label: "مبلغ الاشتراك", value: user.subscription, color: "#2952e3", bg: "#eff6ff", border: "#bfdbfe" },
                  { label: "رسوم السحب", value: user.fees, color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                ].map((d) => (
                  <div key={d.label} className="rounded-xl p-2.5 text-center border" style={{ background: d.bg, borderColor: d.border }}>
                    <p className="font-extrabold text-[13px] leading-none" style={{ color: d.color }}>{d.value}</p>
                    <p className="text-[8px] font-semibold mt-1 text-[#8892a4] leading-snug">{d.label}</p>
                  </div>
                ))}
              </div>

              {/* Bank info */}
              <div className="rounded-2xl p-3.5 text-right mb-4"
                style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)", }}>
                <p className="text-white/60 text-[9px] font-medium mb-0.5">اسم صاحب الحساب</p>
                <p className="text-white font-bold text-[12px] leading-snug mb-2">{user.accountHolder}</p>
                <p className="text-white/60 text-[9px] font-medium mb-0.5">رقم الإيبان</p>
                <p className="text-white font-bold text-[11px]" dir="ltr" style={{ textAlign: "right", letterSpacing: "0.05em" }}>
                  {user.iban}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={() => setModal({ type: "edit", userId: user.id })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-colors"
                  style={{ background: "#eff6ff", color: "#2952e3", border: "1.5px solid #bfdbfe" }}>
                  <Icon.Edit /><span>تعديل</span>
                </button>
                <button onClick={() => setModal({ type: "disable", userId: user.id })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-colors"
                  style={{
                    background: user.status === "active" ? "#fef3c7" : "#dcfce7",
                    color: user.status === "active" ? "#d97706" : "#16a34a",
                    border: `1.5px solid ${user.status === "active" ? "#fde68a" : "#86efac"}`,
                  }}>
                  <Icon.Ban /><span>{user.status === "active" ? "تعطيل" : "تفعيل"}</span>
                </button>
                <button onClick={() => setModal({ type: "delete", userId: user.id })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-colors"
                  style={{ background: "#fef2f2", color: "#ef4444", border: "1.5px solid #fecaca" }}>
                  <Icon.Trash /><span>حذف</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-16 text-[#8892a4]">
            <p className="text-[13px] font-semibold">لا يوجد مستخدمون حتى الآن</p>
            <p className="text-[11px] mt-1">اضغط على "إضافة مستخدم" للبدء</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal.type === "create" && (
        <UserFormModal mode="create" initial={emptyUser} onSave={handleCreate} onClose={() => setModal({ type: "none" })} />
      )}
      {modal.type === "edit" && editingUser && (
        <UserFormModal
          mode="edit"
          initial={{ username: editingUser.username, password: editingUser.password, name: editingUser.name,
            profits: editingUser.profits, subscription: editingUser.subscription, fees: editingUser.fees,
            accountHolder: editingUser.accountHolder, iban: editingUser.iban, status: editingUser.status }}
          onSave={handleEdit}
          onClose={() => setModal({ type: "none" })}
        />
      )}
      {modal.type === "delete" && (
        <ConfirmModal
          message="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
          onConfirm={handleDelete}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
      {modal.type === "disable" && disablingUser && (
        <ConfirmModal
          message={disablingUser.status === "active" ? "هل تريد تعطيل هذا الحساب؟" : "هل تريد تفعيل هذا الحساب؟"}
          onConfirm={handleToggleDisable}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [view, setView] = useState<"user" | "admin">("user");

  return (
    <div dir="rtl" style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#dce4f0 0%,#e8edf7 40%,#eaeef7 100%)",
      fontFamily: "'Cairo', sans-serif",
    }}>
      {view === "user"
        ? <UserDashboard onAdminClick={() => setView("admin")} />
        : <AdminDashboard onBack={() => setView("user")} />
      }
    </div>
  );
}
