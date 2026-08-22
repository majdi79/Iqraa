import React, { useState, useMemo, useEffect } from 'react';
import { Student, Session, Payment } from '../types';
import { 
  X, 
  DollarSign, 
  Calendar, 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Printer, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CreditCard, 
  TrendingUp, 
  Wallet, 
  FileSpreadsheet, 
  ArrowRight,
  Filter,
  Calculator
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  sessions: Session[];
  payments: Payment[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onDeletePayment: (paymentId: string) => void;
  initialStudentId?: string | null;
  onOpenPaymentReminder?: (studentId: string) => void;
}

type PeriodType = 'this_month' | 'last_month' | 'last_30_days' | 'custom' | 'all';
type CalcMethod = 'per_session' | 'fixed_period';

export function FinancialReportModal({
  isOpen,
  onClose,
  students,
  sessions,
  payments,
  onAddPayment,
  onDeletePayment,
  initialStudentId = null,
  onOpenPaymentReminder
}: Props) {
  // Mode: 'comprehensive' (all students) or 'individual' (single student)
  const [activeTab, setActiveTab] = useState<'comprehensive' | 'individual'>(
    initialStudentId && initialStudentId !== 'all' ? 'individual' : 'comprehensive'
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    (initialStudentId && initialStudentId !== 'all') ? initialStudentId : (students[0]?.id || '')
  );

  const [periodType, setPeriodType] = useState<PeriodType>('this_month');
  const todayStr = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Calculation method & rates
  const [calcMethod, setCalcMethod] = useState<CalcMethod>(() => {
    return (localStorage.getItem('iqra_calc_method') as CalcMethod) || 'per_session';
  });

  const [sessionRate, setSessionRate] = useState<string>(() => {
    const saved = localStorage.getItem('iqra_default_session_rate');
    return (saved && saved !== '50') ? saved : '5';
  });

  const [fixedFee, setFixedFee] = useState<string>(() => {
    const saved = localStorage.getItem('iqra_default_monthly_fee');
    return (saved && saved !== '300') ? saved : '30';
  });

  const [currency, setCurrency] = useState<string>(() => {
    const saved = localStorage.getItem('iqra_default_currency');
    return (saved && saved !== 'ريال') ? saved : 'د.ب';
  });

  // Filter status in comprehensive table
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Payment Form State
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentTargetStudentId, setPaymentTargetStudentId] = useState<string>('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(todayStr);
  const [payMethod, setPayMethod] = useState('تحويل بنكي');
  const [payNotes, setPayNotes] = useState('');

  const [copied, setCopied] = useState(false);

  // Sync initial student when modal opens
  useEffect(() => {
    if (initialStudentId && initialStudentId !== 'all') {
      setSelectedStudentId(initialStudentId);
      setActiveTab('individual');
    }
  }, [initialStudentId]);

  // Persist rates to local storage
  useEffect(() => {
    localStorage.setItem('iqra_calc_method', calcMethod);
    localStorage.setItem('iqra_default_session_rate', sessionRate);
    localStorage.setItem('iqra_default_monthly_fee', fixedFee);
    localStorage.setItem('iqra_default_currency', currency);
  }, [calcMethod, sessionRate, fixedFee, currency]);

  // Handle Preset Changes
  const handlePeriodChange = (type: PeriodType) => {
    setPeriodType(type);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (type === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (type === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(startOfLastMonth.toISOString().split('T')[0]);
      setEndDate(endOfLastMonth.toISOString().split('T')[0]);
    } else if (type === 'last_30_days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      setStartDate(past30.toISOString().split('T')[0]);
      setEndDate(today);
    }
  };

  // Period label description
  const periodLabel = useMemo(() => {
    if (periodType === 'all') return 'كافة الفترات (سجل شامل)';
    if (startDate === endDate) return `يوم ${startDate}`;
    return `من ${startDate} إلى ${endDate}`;
  }, [periodType, startDate, endDate]);

  // Filter sessions by date range
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (session.status !== 'present') return false;
      if (periodType === 'all') return true;
      if (startDate && session.date < startDate) return false;
      if (endDate && session.date > endDate) return false;
      return true;
    });
  }, [sessions, periodType, startDate, endDate]);

  // Filter payments by date range
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      if (periodType === 'all') return true;
      if (startDate && payment.date < startDate) return false;
      if (endDate && payment.date > endDate) return false;
      return true;
    });
  }, [payments, periodType, startDate, endDate]);

  const numSessionRate = parseFloat(sessionRate) || 0;
  const numFixedFee = parseFloat(fixedFee) || 0;

  // Student Financial Calculations
  const studentsFinancials = useMemo(() => {
    return students.map(student => {
      // Attended sessions count
      const studentSessions = filteredSessions.filter(s => s.studentId === student.id);
      const attendedCount = studentSessions.length;

      // Calculate Due Amount
      let due = 0;
      if (calcMethod === 'per_session') {
        const rate = student.sessionRate || numSessionRate;
        due = attendedCount * rate;
      } else {
        due = student.monthlyFee || numFixedFee;
      }

      // Calculate Paid Amount
      const studentPayments = filteredPayments.filter(p => p.studentId === student.id);
      const paid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // Remaining Balance
      const balance = due - paid;

      // Status
      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (due === 0 && paid === 0) {
        status = 'paid';
      } else if (balance <= 0) {
        status = 'paid';
      } else if (paid > 0 && balance > 0) {
        status = 'partial';
      } else {
        status = 'unpaid';
      }

      return {
        student,
        attendedCount,
        due,
        paid,
        balance,
        status,
        sessions: studentSessions,
        payments: studentPayments
      };
    });
  }, [students, filteredSessions, filteredPayments, calcMethod, numSessionRate, numFixedFee]);

  // Global Totals for Comprehensive Report
  const globalSummary = useMemo(() => {
    const totalSessionsAttended = studentsFinancials.reduce((sum, item) => sum + item.attendedCount, 0);
    const totalDue = studentsFinancials.reduce((sum, item) => sum + item.due, 0);
    const totalPaid = studentsFinancials.reduce((sum, item) => sum + item.paid, 0);
    const totalRemaining = Math.max(0, totalDue - totalPaid);
    const collectionRate = totalDue > 0 ? Math.min(100, Math.round((totalPaid / totalDue) * 100)) : 100;
    
    const fullyPaidCount = studentsFinancials.filter(s => s.status === 'paid').length;
    const partialCount = studentsFinancials.filter(s => s.status === 'partial').length;
    const unpaidCount = studentsFinancials.filter(s => s.status === 'unpaid').length;

    return {
      totalSessionsAttended,
      totalDue,
      totalPaid,
      totalRemaining,
      collectionRate,
      fullyPaidCount,
      partialCount,
      unpaidCount
    };
  }, [studentsFinancials]);

  // Selected Student Financials
  const currentStudentData = useMemo(() => {
    return studentsFinancials.find(sf => sf.student.id === selectedStudentId) || studentsFinancials[0] || null;
  }, [studentsFinancials, selectedStudentId]);

  // Filtered Students for Comprehensive Table
  const filteredStudentsList = useMemo(() => {
    return studentsFinancials.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.student.name.toLowerCase().includes(q);
        const matchLevel = item.student.level?.toLowerCase().includes(q);
        if (!matchName && !matchLevel) return false;
      }

      // Status
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [studentsFinancials, searchQuery, statusFilter]);

  // Generate Report Text for WhatsApp / Copy
  const shareableText = useMemo(() => {
    if (activeTab === 'comprehensive') {
      let msg = `📊 *التقرير المالي الشامل لحلقة اقرأ وارتق*\n`;
      msg += `📅 *الفترة:* ${periodLabel}\n`;
      msg += `طريقة الاحتساب: ${calcMethod === 'per_session' ? `سعر الحصة (${sessionRate} ${currency})` : `رسم ثابت (${fixedFee} ${currency})`}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━\n\n`;

      msg += `📈 *الملخص المالي العام:*\n`;
      msg += `• إجمالي الحصص المنجزة: ${globalSummary.totalSessionsAttended} حصة\n`;
      msg += `• إجمالي المبالغ المستحقة: ${globalSummary.totalDue} ${currency}\n`;
      msg += `• إجمالي المبالغ المحصلة: ${globalSummary.totalPaid} ${currency}\n`;
      msg += `• إجمالي المتبقي والتحصيلات: ${globalSummary.totalRemaining} ${currency}\n`;
      msg += `• نسبة التحصيل: ${globalSummary.collectionRate}%\n\n`;

      msg += `📋 *كشف الطلاب التفصيلي:*\n`;
      studentsFinancials.forEach((sf, idx) => {
        const statusEmoji = sf.status === 'paid' ? '✅ مسدد' : (sf.status === 'partial' ? '⚠️ متبقي جزئي' : '❌ غير مسدد');
        msg += `${idx + 1}. *${sf.student.name}* (${sf.student.level || 'عام'})\n`;
        msg += `   - الحصص: ${sf.attendedCount} | المستحق: ${sf.due} ${currency}\n`;
        msg += `   - المدفوع: ${sf.paid} ${currency} | المتبقي: ${sf.balance > 0 ? sf.balance : 0} ${currency} [${statusEmoji}]\n`;
      });

      msg += `\n━━━━━━━━━━━━━━━━━━━\n`;
      msg += `تم الاستخراج عبر نظام اقرأ وارتق`;
      return msg;
    } else {
      if (!currentStudentData) return '';
      const st = currentStudentData.student;
      let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
      msg += `أهلاً بكم ولي أمر الطالب: *${st.name}*\n\n`;
      msg += `📄 *التقرير المالي وكشف الحساب:*\n`;
      msg += `• الطالب: ${st.name} ${st.level ? `(${st.level})` : ''}\n`;
      msg += `• الفترة: ${periodLabel}\n`;
      msg += `• عدد الحصص المنجزة: ${currentStudentData.attendedCount} حصة\n`;
      msg += `• طريقة الاحتساب: ${calcMethod === 'per_session' ? `سعر الحصة ${st.sessionRate || sessionRate} ${currency}` : `رسم الفترة`}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💵 *المبلغ المستحق:* ${currentStudentData.due} ${currency}\n`;
      msg += `💳 *المبلغ المسدد:* ${currentStudentData.paid} ${currency}\n`;
      msg += `📌 *الرصيد المتبقي:* ${currentStudentData.balance > 0 ? currentStudentData.balance : 0} ${currency}\n`;
      msg += `حالة السداد: ${currentStudentData.status === 'paid' ? '✅ مسدد بالكامل' : (currentStudentData.status === 'partial' ? '⚠️ متبقي جزء من الرسوم' : '❌ بانتظار السداد')}\n\n`;

      if (currentStudentData.payments.length > 0) {
        msg += `🧾 *الدفعات المسجلة في هذه الفترة:*\n`;
        currentStudentData.payments.forEach(p => {
          msg += `• ${p.date}: ${p.amount} ${currency} (${p.paymentMethod || 'تحويل'})\n`;
        });
        msg += `\n`;
      }

      msg += `شاكرين ومقدرين حسن تعاونكم.\n`;
      msg += `إدارة برنامج اقرأ وارتق`;
      return msg;
    }
  }, [activeTab, periodLabel, calcMethod, sessionRate, fixedFee, currency, globalSummary, studentsFinancials, currentStudentData]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const stId = paymentTargetStudentId || selectedStudentId;
    if (!stId) return;
    const num = parseFloat(payAmount);
    if (!num || num <= 0) return;

    onAddPayment({
      studentId: stId,
      amount: num,
      date: payDate || todayStr,
      paymentMethod: payMethod,
      notes: payNotes.trim()
    });

    setPayAmount('');
    setPayNotes('');
    setShowAddPayment(false);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareableText)}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200 shadow-inner">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">التقرير المالي للرسوم والاشتراكات</h2>
              <p className="text-emerald-200/80 text-xs">متابعة المستحقات، الدفعات المحصلة، وإصدار كشوفات الحساب</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPaymentTargetStudentId(activeTab === 'individual' ? selectedStudentId : (students[0]?.id || ''));
                setShowAddPayment(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل دفعة</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector & Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* View Switcher: Comprehensive vs Individual */}
            <div className="inline-flex bg-slate-200/70 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('comprehensive')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'comprehensive'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>تقرير شامل (كافة الطلاب)</span>
              </button>
              <button
                onClick={() => setActiveTab('individual')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'individual'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تقرير طالب محدد (كشف حساب)</span>
              </button>
            </div>

            {/* Period Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => handlePeriodChange('this_month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  periodType === 'this_month'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                الشهر الحالي
              </button>
              <button
                onClick={() => handlePeriodChange('last_month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  periodType === 'last_month'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                الشهر السابق
              </button>
              <button
                onClick={() => handlePeriodChange('last_30_days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  periodType === 'last_30_days'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                آخر 30 يوم
              </button>
              <button
                onClick={() => setPeriodType('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  periodType === 'custom'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                فترة مخصصة
              </button>
              <button
                onClick={() => setPeriodType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  periodType === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                الكل
              </button>
            </div>
          </div>

          {/* Pricing settings & custom dates row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-200/80 text-xs">
            
            {/* Calculation Method Toggle */}
            <div className="md:col-span-4 flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
              <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <span className="font-semibold text-slate-700 whitespace-nowrap">الاحتساب:</span>
                <select
                  value={calcMethod}
                  onChange={(e) => setCalcMethod(e.target.value as CalcMethod)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-medium text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="per_session">حسب سعر الحصة</option>
                  <option value="fixed_period">رسم ثابت للفترة / شهري</option>
                </select>
              </div>
            </div>

            {/* Rate input */}
            <div className="md:col-span-3 flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700 whitespace-nowrap">
                {calcMethod === 'per_session' ? 'سعر الحصة:' : 'الرسم الثابت:'}
              </span>
              <input
                type="number"
                min="0"
                value={calcMethod === 'per_session' ? sessionRate : fixedFee}
                onChange={(e) => {
                  if (calcMethod === 'per_session') setSessionRate(e.target.value);
                  else setFixedFee(e.target.value);
                }}
                className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-bold text-center text-emerald-800 outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-slate-500 font-medium">{currency}</span>
            </div>

            {/* Custom Dates (if selected) or Student Selector (if individual tab) */}
            {activeTab === 'individual' ? (
              <div className="md:col-span-5 flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-700 whitespace-nowrap">الطالب:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold text-emerald-900 outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.level ? `(${s.level})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              periodType === 'custom' ? (
                <div className="md:col-span-5 flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200">
                  <span className="font-medium text-slate-600">من:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs outline-none"
                  />
                  <span className="font-medium text-slate-600">إلى:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs outline-none"
                  />
                </div>
              ) : (
                <div className="md:col-span-5 flex items-center justify-end px-2 text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 ml-1 text-emerald-600" />
                  الفترة: <span className="text-slate-800 mr-1 font-semibold">{periodLabel}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* Quick Add Payment Form Modal / Overlay */}
          {showAddPayment && (
            <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-xl shadow-md animate-in fade-in space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-700" />
                  تسجيل دفعة سداد جديدة
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الطالب</label>
                  <select
                    value={paymentTargetStudentId}
                    onChange={(e) => setPaymentTargetStudentId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ ({currency})</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="مثال: 200"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ السداد</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">طريقة السداد</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="نقدي (كاش)">نقدي (كاش)</option>
                    <option value="شبكة / مدى">شبكة / مدى</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">ملاحظات / رقم الإشعار (اختياري)</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="مثال: دفعة شهر أغسطس، رقم الحوالة 8923..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-1 flex items-end gap-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors shadow-xs"
                  >
                    حفظ الدفعة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPayment(false)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 1: COMPREHENSIVE REPORT */}
          {activeTab === 'comprehensive' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Global Key Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-1">
                    <span>إجمالي المستحق</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-950">
                    {globalSummary.totalDue} <span className="text-xs font-normal text-emerald-700">{currency}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                    عن {globalSummary.totalSessionsAttended} حصة منجزة
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-blue-800 text-xs font-semibold mb-1">
                    <span>المبالغ المحصلة</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-950">
                    {globalSummary.totalPaid} <span className="text-xs font-normal text-blue-700">{currency}</span>
                  </div>
                  <div className="text-[11px] text-blue-700 mt-1 font-medium">
                    نسبة التحصيل: {globalSummary.collectionRate}%
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-1">
                    <span>المتبقي والتحصيلات</span>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-950">
                    {globalSummary.totalRemaining} <span className="text-xs font-normal text-amber-700">{currency}</span>
                  </div>
                  <div className="text-[11px] text-amber-700 mt-1 font-medium">
                    {globalSummary.unpaidCount} طلاب بانتظار السداد
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-700 text-xs font-semibold mb-1">
                    <span>حالة الطلاب</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-slate-800 space-y-0.5 mt-1">
                    <div className="text-emerald-700 text-xs">✓ مسدد بالكامل: {globalSummary.fullyPaidCount}</div>
                    <div className="text-amber-700 text-xs">◓ سداد جزئي: {globalSummary.partialCount}</div>
                    <div className="text-rose-700 text-xs">✗ غير مسدد: {globalSummary.unpaidCount}</div>
                  </div>
                </div>
              </div>

              {/* Students Breakdown Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">كشف تفصيلي بالطلاب</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                      {filteredStudentsList.length} طالب
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search Input */}
                    <input
                      type="text"
                      placeholder="بحث بالاسم..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 w-32 sm:w-40"
                    />

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                    >
                      <option value="all">كافة الحالات</option>
                      <option value="paid">مسدد بالكامل</option>
                      <option value="partial">متبقي جزئي</option>
                      <option value="unpaid">غير مسدد</option>
                    </select>
                  </div>
                </div>

                {filteredStudentsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    لا يوجد طلاب يطابقون خيارات التصفية الحالية.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100/75 text-slate-600 border-b border-slate-200 font-bold">
                        <tr>
                          <th className="p-3">الطالب</th>
                          <th className="p-3 text-center">الحصص</th>
                          <th className="p-3 text-center">المستحق</th>
                          <th className="p-3 text-center">المدفوع</th>
                          <th className="p-3 text-center">المتبقي</th>
                          <th className="p-3 text-center">الحالة</th>
                          <th className="p-3 text-center">إجراءات سريعة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudentsList.map((item) => (
                          <tr key={item.student.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-semibold text-slate-800">
                              <div className="font-bold">{item.student.name}</div>
                              <div className="text-[11px] text-slate-400 font-normal">{item.student.level || 'بدون مستوى'}</div>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-700">
                              {item.attendedCount}
                            </td>
                            <td className="p-3 text-center font-bold text-emerald-800">
                              {item.due} {currency}
                            </td>
                            <td className="p-3 text-center font-bold text-blue-700">
                              {item.paid} {currency}
                            </td>
                            <td className="p-3 text-center font-bold">
                              {item.balance > 0 ? (
                                <span className="text-amber-700">{item.balance} {currency}</span>
                              ) : (
                                <span className="text-emerald-700">0 {currency}</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {item.status === 'paid' && (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                                  <CheckCircle2 className="w-3 h-3" /> مسدد
                                </span>
                              )}
                              {item.status === 'partial' && (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                                  <Clock className="w-3 h-3" /> جزئي
                                </span>
                              )}
                              {item.status === 'unpaid' && (
                                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                                  <AlertCircle className="w-3 h-3" /> بانتظار السداد
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setPaymentTargetStudentId(item.student.id);
                                    setShowAddPayment(true);
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-medium text-[11px] transition-colors border border-emerald-200"
                                  title="تسجيل دفعة جديدة لهذا الطالب"
                                >
                                  + دفعة
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedStudentId(item.student.id);
                                    setActiveTab('individual');
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-[11px] transition-colors"
                                  title="عرض كشف حساب الطالب"
                                >
                                  كشف مفصل
                                </button>
                                {onOpenPaymentReminder && (
                                  <button
                                    onClick={() => {
                                      onClose();
                                      onOpenPaymentReminder(item.student.id);
                                    }}
                                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                                    title="إرسال تذكير بالرسوم عبر واتساب"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INDIVIDUAL STUDENT REPORT */}
          {activeTab === 'individual' && currentStudentData && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Student Header & Quick Summary */}
              <div className="bg-gradient-to-l from-emerald-900 to-emerald-800 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black">{currentStudentData.student.name}</h3>
                    {currentStudentData.student.level && (
                      <span className="bg-white/20 text-emerald-100 text-xs px-2 py-0.5 rounded-md font-medium">
                        {currentStudentData.student.level}
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-200 text-xs mt-1">
                    كشف حساب مالي للفترة: <span className="font-semibold text-white">{periodLabel}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPaymentTargetStudentId(currentStudentData.student.id);
                      setShowAddPayment(true);
                    }}
                    className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-emerald-700" />
                    <span>تسجيل دفعة جديدة</span>
                  </button>

                  {onOpenPaymentReminder && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenPaymentReminder(currentStudentData.student.id);
                      }}
                      className="bg-emerald-700/80 hover:bg-emerald-600 text-white font-medium px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-emerald-600"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-200" />
                      <span>تذكير بالرسوم</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Student Financial Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-right">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">الحصص المنجزة</span>
                  <div className="text-2xl font-black text-slate-800">
                    {currentStudentData.attendedCount} <span className="text-xs font-normal text-slate-500">حصة</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-right">
                  <span className="text-xs font-semibold text-emerald-800 block mb-1">إجمالي المستحق</span>
                  <div className="text-2xl font-black text-emerald-950">
                    {currentStudentData.due} <span className="text-xs font-normal text-emerald-700">{currency}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-right">
                  <span className="text-xs font-semibold text-blue-800 block mb-1">المبلغ المسدد</span>
                  <div className="text-2xl font-black text-blue-950">
                    {currentStudentData.paid} <span className="text-xs font-normal text-blue-700">{currency}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border text-right ${
                  currentStudentData.balance <= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <span className={`text-xs font-semibold block mb-1 ${
                    currentStudentData.balance <= 0 ? 'text-emerald-800' : 'text-amber-800'
                  }`}>
                    الرصيد المتبقي
                  </span>
                  <div className={`text-2xl font-black ${
                    currentStudentData.balance <= 0 ? 'text-emerald-950' : 'text-amber-950'
                  }`}>
                    {currentStudentData.balance > 0 ? currentStudentData.balance : 0} <span className="text-xs font-normal text-slate-500">{currency}</span>
                  </div>
                </div>
              </div>

              {/* Breakdown in 2 Columns: Attended Sessions & Payments Recorded */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Column 1: Attended Sessions in Period */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      الحصص المنجزة في الفترة ({currentStudentData.sessions.length})
                    </h4>
                  </div>

                  {currentStudentData.sessions.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      لا توجد حصص مسجلة في هذه الفترة المحددة.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {currentStudentData.sessions.map((sess, idx) => (
                        <div key={sess.id} className="p-3 text-xs flex items-start justify-between gap-2 hover:bg-slate-50">
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <span className="text-slate-400">{idx + 1}.</span>
                              <span>{sess.date}</span>
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                حاضر
                              </span>
                            </div>
                            {sess.lessonDetails && (
                              <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-1">{sess.lessonDetails}</p>
                            )}
                          </div>
                          {calcMethod === 'per_session' && (
                            <span className="font-bold text-emerald-700 shrink-0">
                              +{currentStudentData.student.sessionRate || sessionRate} {currency}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 2: Payments History in Period */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      سجل الدفعات والتحويلات المسددة ({currentStudentData.payments.length})
                    </h4>
                    <button
                      onClick={() => {
                        setPaymentTargetStudentId(currentStudentData.student.id);
                        setShowAddPayment(true);
                      }}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center gap-1"
                    >
                      + تسجيل دفعة
                    </button>
                  </div>

                  {currentStudentData.payments.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs space-y-2">
                      <p>لم يتم تسجيل أي دفعات سداد لهذا الطالب في هذه الفترة.</p>
                      <button
                        onClick={() => {
                          setPaymentTargetStudentId(currentStudentData.student.id);
                          setShowAddPayment(true);
                        }}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold border border-emerald-200 transition-colors"
                      >
                        تسجيل أول دفعة
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {currentStudentData.payments.map((pmt) => (
                        <div key={pmt.id} className="p-3 text-xs flex items-center justify-between gap-2 hover:bg-slate-50">
                          <div>
                            <div className="font-bold text-slate-800">
                              {pmt.amount} {currency}
                              <span className="text-[11px] font-normal text-slate-500 mr-2">
                                ({pmt.paymentMethod || 'تحويل'})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {pmt.date} {pmt.notes ? `• ${pmt.notes}` : ''}
                            </div>
                          </div>

                          <button
                            onClick={() => onDeletePayment(pmt.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                            title="حذف هذه الدفعة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Text Preview Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  معاينة كشف الحساب والرسالة الجاهزة للمشاركة:
                </label>
                <pre className="w-full bg-slate-900 text-emerald-300/90 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto border border-slate-800 shadow-inner">
                  {shareableText}
                </pre>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 order-2 sm:order-1 text-center sm:text-right">
            {activeTab === 'comprehensive' ? 'تقرير مالي شامل للحلقة' : `كشف حساب الطالب: ${currentStudentData?.student.name || ''}`}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              onClick={handlePrint}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl transition-colors shadow-xs"
              title="طباعة التقرير"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>نسخ التقرير</span>
                </>
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة عبر واتساب</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
