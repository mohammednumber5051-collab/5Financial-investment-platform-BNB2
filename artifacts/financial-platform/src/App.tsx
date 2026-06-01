import { useState } from "react";

/* ─── Mock Data ─────────────────────────────────────────────── */
const user = {
  name: "عبدالرحمن سعيد يحيى ال فروان",
  nameShort: "عبدالرحمن",
  currency: "الريال السعودي (ر.س)",
};

const accountData = {
  profits: { amount: "17,400", label: "أرباح الاشتراك", sub: "متاح للسحب الفوري", pct: "12.5%+" },
  subscription: { amount: "1,000", label: "مبلغ الاشتراك", sub: "اشتراك نشط" },
  fees: { amount: "3,610", label: "رسوم السحب", sub: "مطلوبة لكل عملية سحب" },
  bank: {
    holder: "عبدالرحمن سعيد يحيى ال فروان",
    iban: "SA15 8000 0220 6080 1030 8884",
    sub: "حساب بنكي مربوط",
  },
};

const accountInfo = [
  { label: "اسم العميل", value: "عبدالرحمن سعيد يحيى ال فروان" },
  { label: "رقم الهوية", value: "1082XXXXXXXX" },
  { label: "البريد الإلكتروني", value: "abdulrahman@example.com" },
  { label: "رقم الجوال", value: "+966 5X XXX XXXX" },
  { label: "تاريخ الانضمام", value: "15 يناير 2025" },
];

/* ─── Icon components (inline SVG) ─────────────────────────── */
function IconTrendingUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function IconDollar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function IconAlertCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function IconCreditCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ─── Header ─────────────────────────────────────────────────── */
function Header() {
  return (
    <div className="px-4 pt-5 pb-4">
      <div className="flex items-start justify-between">
        {/* Right side: title + greeting (RTL start = right) */}
        <div className="text-right">
          <h1 className="text-2xl font-extrabold text-[#1a1f3c] leading-tight tracking-tight">
            المنصة المالية
          </h1>
          <p className="text-sm text-[#5a6282] mt-1 leading-snug font-medium">
            مرحباً، {user.name}
          </p>
        </div>
        {/* Left side: buttons (RTL end = left) */}
        <div className="flex items-center gap-2 flex-row-reverse">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#d0d7e8] text-[#1a1f3c] text-xs font-semibold shadow-sm hover:bg-gray-50 transition-colors">
            <span>{user.currency}</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#d0d7e8] text-[#1a1f3c] text-xs font-semibold shadow-sm hover:bg-gray-50 transition-colors">
            <IconLogout />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Financial Operations ───────────────────────────────────── */
function FinancialOperations() {
  return (
    <section className="px-4">
      <h2 className="text-xl font-bold text-[#1a1f3c] mb-4 text-right">
        العمليات المالية
      </h2>
      <div className="flex flex-col gap-3">
        {/* Withdraw */}
        <button
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-white font-bold text-lg shadow-md active:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #c8005a 0%, #f0196e 50%, #ff4d88 100%)" }}
        >
          <IconArrowLeft />
          <span>سحب الأموال</span>
        </button>
        {/* Deposit */}
        <button
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-white font-bold text-lg shadow-md active:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #0f7a38 0%, #16a34a 50%, #22c55e 100%)" }}
        >
          <IconPlus />
          <span>إيداع الأموال</span>
        </button>
      </div>
    </section>
  );
}

/* ─── Card Icon Button ───────────────────────────────────────── */
function CardIconBtn({ children, bg = "rgba(255,255,255,0.25)" }: { children: React.ReactNode; bg?: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
      style={{ background: bg }}
    >
      {children}
    </div>
  );
}

/* ─── Account Overview ───────────────────────────────────────── */
function AccountOverview() {
  return (
    <section className="px-4">
      <h2 className="text-xl font-bold text-[#1a1f3c] mb-4 text-right">
        نظرة عامة على الحساب
      </h2>
      <div className="flex flex-col gap-4">
        <GreenProfitCard />
        <BlueSubscriptionCard />
        <RedFeesCard />
        <PurpleBankCard />
      </div>
    </section>
  );
}

/* ─── Green Profit Card ──────────────────────────────────────── */
function GreenProfitCard() {
  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0b7a44 0%, #0fa558 40%, #14c46a 70%, #2dd87e 100%)" }}
    >
      {/* Decorative circle */}
      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.3)" }} />
      <div className="absolute -top-10 right-1/3 w-28 h-28 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.4)" }} />

      {/* Top row: icon right, badge left */}
      <div className="flex items-start justify-between mb-8 relative z-10">
        <CardIconBtn bg="rgba(255,255,255,0.25)">
          <IconTrendingUp />
        </CardIconBtn>
        <span className="bg-white/25 text-white text-xs font-bold px-3 py-1 rounded-lg">
          {accountData.profits.pct}
        </span>
      </div>

      {/* Amount (right-aligned in RTL) */}
      <div className="text-right relative z-10">
        <p className="text-white/80 text-sm font-medium mb-1">{accountData.profits.label}</p>
        <p className="text-white font-extrabold leading-none" style={{ fontSize: "2.2rem" }}>
          {accountData.profits.amount} <span className="text-2xl">ر.س</span>
        </p>
        <p className="text-white/70 text-sm font-medium mt-2">{accountData.profits.sub}</p>
      </div>
    </div>
  );
}

/* ─── Blue Subscription Card ─────────────────────────────────── */
function BlueSubscriptionCard() {
  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2952e3 0%, #4f46e5 40%, #7c3aed 100%)" }}
    >
      <div className="absolute -bottom-10 -right-6 w-40 h-40 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.5)" }} />

      {/* Top row */}
      <div className="flex items-start justify-between mb-8 relative z-10">
        <CardIconBtn bg="rgba(255,255,255,0.22)">
          <IconDollar />
        </CardIconBtn>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block shadow-sm shadow-emerald-300" />
        </div>
      </div>

      {/* Amount */}
      <div className="text-right relative z-10">
        <p className="text-white/80 text-sm font-medium mb-1">{accountData.subscription.label}</p>
        <p className="text-white font-extrabold leading-none" style={{ fontSize: "2.2rem" }}>
          {accountData.subscription.amount} <span className="text-2xl">ر.س</span>
        </p>
        <p className="text-white/70 text-sm font-medium mt-2">{accountData.subscription.sub}</p>
      </div>
    </div>
  );
}

/* ─── Red Fees Card ──────────────────────────────────────────── */
function RedFeesCard() {
  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #c41e1e 0%, #e83030 30%, #f05a1a 70%, #f97316 100%)" }}
    >
      <div className="absolute -bottom-8 -left-6 w-36 h-36 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.4)" }} />

      {/* Top row */}
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
          style={{ background: "rgba(180,30,30,0.5)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <IconAlertCircle />
        </div>
        <span
          className="text-white text-xs font-bold px-3 py-1 rounded-lg"
          style={{ background: "rgba(210,30,80,0.6)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          رسوم
        </span>
      </div>

      {/* Amount */}
      <div className="text-right relative z-10">
        <p className="text-white/80 text-sm font-medium mb-1">{accountData.fees.label}</p>
        <p className="text-white font-extrabold leading-none" style={{ fontSize: "2.2rem" }}>
          {accountData.fees.amount} <span className="text-2xl">ر.س</span>
        </p>
        <p className="text-white/70 text-sm font-medium mt-2">{accountData.fees.sub}</p>
      </div>
    </div>
  );
}

/* ─── Purple Bank Card ───────────────────────────────────────── */
function PurpleBankCard() {
  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 40%, #9333ea 80%, #a855f7 100%)" }}
    >
      <div className="absolute -bottom-10 -right-8 w-44 h-44 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.5)" }} />
      <div className="absolute top-0 left-1/4 w-24 h-24 rounded-full opacity-5" style={{ background: "rgba(255,255,255,0.6)" }} />

      {/* Top row */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <CardIconBtn bg="rgba(255,255,255,0.22)">
          <IconCreditCard />
        </CardIconBtn>
        <div className="flex items-center gap-1.5">
          <span className="text-white/80 text-xs font-semibold">متصل</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block shadow-sm shadow-emerald-300" />
        </div>
      </div>

      {/* Account details */}
      <div className="text-right relative z-10 space-y-4">
        <div>
          <p className="text-white/60 text-xs font-medium mb-1">اسم صاحب الحساب</p>
          <p className="text-white font-bold text-xl leading-snug">{accountData.bank.holder}</p>
        </div>
        <div>
          <p className="text-white/60 text-xs font-medium mb-1.5">رقم الإيبان</p>
          <p className="text-white font-bold text-lg tracking-widest leading-snug" dir="ltr" style={{ textAlign: "right", letterSpacing: "0.08em" }}>
            {accountData.bank.iban}
          </p>
        </div>
        <p className="text-white/60 text-xs font-medium">{accountData.bank.sub}</p>
      </div>
    </div>
  );
}

/* ─── Account Info Section ───────────────────────────────────── */
function AccountInfoSection() {
  return (
    <section className="px-4 pb-8">
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e2e8f0]">
        <div className="text-right mb-5">
          <h2 className="text-xl font-bold text-[#1a1f3c]">معلومات الحساب</h2>
          <p className="text-sm text-[#8892a4] mt-0.5 font-medium">تفاصيل حسابك الشخصي</p>
        </div>

        <div className="flex flex-col gap-4">
          {accountInfo.map((field) => (
            <div key={field.label} className="text-right">
              <label className="block text-xs font-semibold text-[#8892a4] mb-1.5">
                {field.label}
              </label>
              <div className="w-full px-4 py-3 rounded-xl bg-[#f3f5fa] border border-[#e2e8f0] text-[#1a1f3c] font-semibold text-sm text-right">
                {field.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Root App ───────────────────────────────────────────────── */
export default function App() {
  return (
    <div
      dir="rtl"
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #dce4f0 0%, #e8edf7 40%, #eaeef7 100%)", fontFamily: "'Cairo', sans-serif" }}
    >
      <div className="max-w-md mx-auto">
        <Header />
        <main className="flex flex-col gap-6 pb-2">
          <FinancialOperations />
          <AccountOverview />
          <AccountInfoSection />
        </main>
      </div>
    </div>
  );
}
