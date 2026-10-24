import { useState } from "react";

export interface PartialPaymentModalProps {
  beneficiaryId: number;
  phaseType: "withdrawal" | "liberation" | "transaction" | string;
  phaseTitle: string;
  currentAmount: number;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function PartialPaymentModal({
  beneficiaryId,
  phaseType,
  phaseTitle,
  currentAmount,
  onClose,
  onSuccess,
}: PartialPaymentModalProps) {
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");
  const [partialAmount, setPartialAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numericPartial = parseInt(partialAmount.replace(/,/g, ""), 10) || 0;
  const paidAmount = paymentType === "full" ? currentAmount : numericPartial;
  const remainingAmount = Math.max(0, currentAmount - paidAmount);

  async function handleConfirm() {
    setError("");
    if (paidAmount <= 0) {
      setError("يرجى إدخال مبلغ سداد صحيح أكبر من الصفر");
      return;
    }
    if (paymentType === "partial" && paidAmount >= currentAmount) {
      // If user entered full or more, confirm as full payment
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/beneficiaries/${beneficiaryId}/pay-partial-fee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseType,
          amountPaid: paidAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل تسجيل عملية السداد");
      }

      await onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || "حدث خطأ أثناء معالجة السداد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(10,15,40,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
        dir="rtl"
        style={{ fontFamily: "'Cairo', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f6] bg-[#f8f9fc]">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#5a6282]"
          >
            ✕
          </button>
          <div className="text-right">
            <h3 className="text-[14px] font-bold text-[#1a1f3c]">سداد الرسوم - {phaseTitle}</h3>
            <p className="text-[11px] text-[#8892a4]">اختر سداد كامل المبلغ أو سداد دفعة جزئية</p>
          </div>
          <div className="w-8" />
        </div>

        <div className="p-5 flex flex-col gap-3.5 text-right">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-[11px] font-bold">
              {error}
            </div>
          )}

          {/* Current Required Fee card */}
          <div className="rounded-2xl p-3.5 bg-[#f0f4ff] border border-[#d0dcfc]">
            <p className="text-[11px] font-bold text-[#5a6282] mb-0.5">المبلغ المطلوب حالياً للمرحلة:</p>
            <p className="text-[20px] font-extrabold text-[#2952e3] tabular-nums">
              {currentAmount.toLocaleString("en-US")} <span className="text-[13px] font-bold">ر.س</span>
            </p>
          </div>

          {/* Type Selector (Full vs Partial) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#f1f5f9] rounded-xl">
            <button
              type="button"
              onClick={() => setPaymentType("full")}
              className={`py-2 rounded-lg text-[12px] font-bold transition-all ${
                paymentType === "full" ? "bg-white text-[#2952e3] shadow-sm" : "text-[#5a6282] hover:text-[#1a1f3c]"
              }`}
            >
              سداد كامل المبلغ
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentType("partial");
                if (!partialAmount) {
                  setPartialAmount(String(Math.floor(currentAmount / 2)));
                }
              }}
              className={`py-2 rounded-lg text-[12px] font-bold transition-all ${
                paymentType === "partial" ? "bg-white text-[#2952e3] shadow-sm" : "text-[#5a6282] hover:text-[#1a1f3c]"
              }`}
            >
              سداد جزئي (دفعة)
            </button>
          </div>

          {/* Partial Amount Input */}
          {paymentType === "partial" && (
            <div className="flex flex-col gap-2">
              <label className="block text-[11px] font-bold text-[#5a6282]">
                أدخل المبلغ المراد سداده الآن (ر.س):
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="مثال: 1545"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[15px] font-extrabold text-[#1a1f3c] outline-none focus:border-[#2952e3]"
                  style={{ textAlign: "left" }}
                />
              </div>

              {/* Dynamic Calculation breakdown */}
              <div className="rounded-xl p-3 bg-[#faf5ff] border border-[#f3e8ff] flex flex-col gap-1.5 text-[11px]">
                <div className="flex justify-between items-center text-[#6b21a8]">
                  <span>المبلغ المسدد الآن:</span>
                  <strong className="text-[13px] tabular-nums">{paidAmount.toLocaleString("en-US")} ر.س</strong>
                </div>
                <div className="flex justify-between items-center text-amber-700 font-bold border-t border-[#f3e8ff] pt-1.5">
                  <span>المبلغ المتبقي المطلوب:</span>
                  <strong className="text-[14px] text-amber-800 tabular-nums">
                    {remainingAmount.toLocaleString("en-US")} ر.س
                  </strong>
                </div>
              </div>

              <p className="text-[10px] text-[#8892a4] leading-relaxed">
                ✓ سيتم إرسال إشعار فوري للمستفيد بالمبلغ المسدد والمتبقي المطلوب.
                <br />✓ ستتحدث بطاقة المرحلة تلقائياً لطلب المبلغ المتبقي (
                {remainingAmount.toLocaleString("en-US")} ر.س).
              </p>
            </div>
          )}

          {paymentType === "full" && (
            <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex flex-col gap-1">
              <p className="font-bold">✓ سيتم اعتماد اكتمال سداد المرحلة بالكامل ({currentAmount.toLocaleString("en-US")} ر.س).</p>
              <p>✓ فتح المرحلة التالية وإرسال إشعار بالاكتمال التام للمستفيد.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-[#5a6282] text-[12px] font-bold hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#2952e3] text-white text-[12px] font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "جارٍ الاعتماد..." : paymentType === "full" ? "تأكيد السداد الكامل" : "تأكيد السداد الجزئي"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
