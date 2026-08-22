import React, { useState, useMemo, useEffect } from 'react';
import { Student, Session } from '../types';
import { 
  X, 
  CreditCard, 
  Share2, 
  Copy, 
  Check, 
  Calendar, 
  Users, 
  DollarSign, 
  Building2, 
  FileText,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  sessions?: Session[];
  initialStudentId?: string | null;
}

export function PaymentReminderModal({ isOpen, onClose, students, sessions = [], initialStudentId = null }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students[0]?.id || '')
  );

  // Default current month in Arabic
  const currentArabicMonth = useMemo(() => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const now = new Date();
    return `شهر ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const [periodText, setPeriodText] = useState<string>(currentArabicMonth);
  const [periodPreset, setPeriodPreset] = useState<'current_month' | 'next_month' | 'term' | 'custom'>('current_month');
  
  // Custom date range if needed
  const [useDateRange, setUseDateRange] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(todayStr);

  // Sessions count configuration
  const [includeSessionCount, setIncludeSessionCount] = useState(true);
  const [customSessionCount, setCustomSessionCount] = useState<string>('');

  const [amount, setAmount] = useState<string>(() => {
    return localStorage.getItem('iqra_default_amount') || '';
  });
  const [currency, setCurrency] = useState<string>(() => {
    const saved = localStorage.getItem('iqra_default_currency');
    return (saved && saved !== 'ريال') ? saved : 'د.ب';
  });
  const [paymentInfo, setPaymentInfo] = useState<string>(() => {
    return localStorage.getItem('iqra_payment_info') || '';
  });
  const [extraNotes, setExtraNotes] = useState<string>(
    'شاكرين ومقدرين حسن تعاونكم.'
  );

  const [copied, setCopied] = useState(false);

  // Sync initial student when modal opens
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [initialStudentId, students]);

  // Persist default payment details
  useEffect(() => {
    if (amount) localStorage.setItem('iqra_default_amount', amount);
    if (currency) localStorage.setItem('iqra_default_currency', currency);
    if (paymentInfo) localStorage.setItem('iqra_payment_info', paymentInfo);
  }, [amount, currency, paymentInfo]);

  const handlePeriodPreset = (type: 'current_month' | 'next_month' | 'term' | 'custom') => {
    setPeriodPreset(type);
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const now = new Date();

    if (type === 'current_month') {
      setUseDateRange(false);
      setPeriodText(`شهر ${months[now.getMonth()]} ${now.getFullYear()}`);
    } else if (type === 'next_month') {
      setUseDateRange(false);
      const nextMonthIdx = (now.getMonth() + 1) % 12;
      const year = nextMonthIdx === 0 ? now.getFullYear() + 1 : now.getFullYear();
      setPeriodText(`شهر ${months[nextMonthIdx]} ${year}`);
    } else if (type === 'term') {
      setUseDateRange(false);
      setPeriodText(`الفصل الدراسي الحالي`);
    } else if (type === 'custom') {
      setUseDateRange(true);
    }
  };

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Automatically compute attended sessions for this student in the period if possible
  const calculatedSessionCount = useMemo(() => {
    if (!selectedStudentId || !sessions || sessions.length === 0) return 0;

    return sessions.filter(s => {
      if (s.studentId !== selectedStudentId) return false;
      if (s.status !== 'present') return false;

      if (useDateRange) {
        if (startDate && s.date < startDate) return false;
        if (endDate && s.date > endDate) return false;
        return true;
      }

      // If current month preset
      if (periodPreset === 'current_month') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        return s.date >= startOfMonth && s.date <= endOfMonth;
      }

      return true;
    }).length;
  }, [selectedStudentId, sessions, useDateRange, startDate, endDate, periodPreset]);

  const effectiveSessionCount = useMemo(() => {
    if (customSessionCount.trim() !== '') {
      return customSessionCount.trim();
    }
    return calculatedSessionCount > 0 ? String(calculatedSessionCount) : '';
  }, [customSessionCount, calculatedSessionCount]);

  const effectivePeriod = useMemo(() => {
    if (useDateRange) {
      if (startDate === endDate) {
        return `يوم ${startDate}`;
      } else {
        return `الفترة من ${startDate} إلى ${endDate}`;
      }
    } else {
      return periodText;
    }
  }, [useDateRange, startDate, endDate, periodText]);

  // Generate reminder message text
  const reminderMessage = useMemo(() => {
    const studentName = selectedStudent?.name || 'الطالب الكريم';

    let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
    msg += `أهلاً بكم ولي أمر الطالب: ${studentName}\n\n`;
    msg += `نود تذكيركم بموعد سداد الرسوم المستحقة لتعليم القرآن الكريم (منهج اقرأ وارتق).\n\n`;
    
    msg += `📌 تفاصيل الاستحقاق:\n`;
    msg += `• الطالب: ${studentName}\n`;
    if (selectedStudent?.level) {
      msg += `• المستوى: ${selectedStudent.level}\n`;
    }
    msg += `• الفترة المستحقة: ${effectivePeriod}\n`;
    if (includeSessionCount && effectiveSessionCount) {
      msg += `• عدد الحصص: ${effectiveSessionCount} حصة\n`;
    }
    
    if (amount.trim()) {
      msg += `• المبلغ المستحق: ${amount} ${currency}\n`;
    }

    if (paymentInfo.trim()) {
      msg += `\n💳 بيانات وطرق الدفع والتحويل:\n${paymentInfo.trim()}\n`;
    }

    if (extraNotes.trim()) {
      msg += `\n${extraNotes.trim()}\n\n`;
    } else {
      msg += `\n`;
    }
    msg += `بارك الله فيكم وجزاكم خيراً.\nإدارة برنامج اقرأ وارتق`;

    return msg;
  }, [selectedStudent, effectivePeriod, includeSessionCount, effectiveSessionCount, amount, currency, paymentInfo, extraNotes]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reminderMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(reminderMessage)}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">تذكير بدفع الرسوم</h2>
              <p className="text-emerald-200/80 text-xs">إعداد وإرسال رسالة تذكير مخصصة مع تحديد الفترة المستحقة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Student selection & Period settings */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  الطالب المستهدف
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      👤 {s.name} {s.level ? `(${s.level})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Period selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  اختيار الفترة المستحقة
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePeriodPreset('current_month')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      periodPreset === 'current_month' && !useDateRange
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    الشهر الحالي
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePeriodPreset('next_month')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      periodPreset === 'next_month' && !useDateRange
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    الشهر القادم
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePeriodPreset('custom')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      useDateRange
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    تحديد تواريخ
                  </button>
                </div>
              </div>
            </div>

            {/* Period text or Date Range */}
            {!useDateRange ? (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  نص الفترة (يمكن تعديل المسمى بحرية):
                </label>
                <input
                  type="text"
                  value={periodText}
                  onChange={(e) => setPeriodText(e.target.value)}
                  placeholder="مثال: شهر أغسطس 2026، أو رسوم دورة التجويد الصيفية..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 animate-in fade-in">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">بداية الفترة</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">نهاية الفترة</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Session Count Row */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={includeSessionCount}
                  onChange={(e) => setIncludeSessionCount(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>إدراج سطر عدد الحصص المستحقة في التذكير</span>
              </label>

              {includeSessionCount && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">عدد الحصص:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={calculatedSessionCount > 0 ? String(calculatedSessionCount) : 'مثال: 8'}
                    value={customSessionCount}
                    onChange={(e) => setCustomSessionCount(e.target.value)}
                    className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {calculatedSessionCount > 0 && !customSessionCount && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-100/60 px-2 py-1 rounded-md font-medium">
                      محسوبة تلقائياً: {calculatedSessionCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Amount & Bank Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                المبلغ المستحق
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="مثال: 200"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                العملة
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="د.ب (دينار بحريني)"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                بيانات الحساب / الآيبان
              </label>
              <input
                type="text"
                value={paymentInfo}
                onChange={(e) => setPaymentInfo(e.target.value)}
                placeholder="رقم الحساب، الآيبان، أو رابط الدفع..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                معاينة رسالة التذكير قبل الإرسال:
              </label>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                جاهزة للإرسال الفوري
              </span>
            </div>
            
            <pre className="w-full bg-slate-900 text-emerald-300/90 p-4 rounded-xl text-xs sm:text-sm font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border border-slate-800 shadow-inner">
              {reminderMessage}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 order-2 sm:order-1 text-center sm:text-right">
            يتم حفظ بيانات الحساب والرسوم تلقائياً لاستخدامها لاحقاً.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">تم نسخ الرسالة!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>نسخ الرسالة</span>
                </>
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              إرسال عبر واتساب
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
