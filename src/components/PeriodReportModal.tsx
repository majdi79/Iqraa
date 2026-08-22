import React, { useState, useMemo } from 'react';
import { Student, Session } from '../types';
import { 
  X, 
  Calendar, 
  Share2, 
  Copy, 
  Check, 
  FileText, 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  Filter
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  sessions: Session[];
  initialStudentId?: string | null;
}

type PeriodType = 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'custom' | 'all';

export function PeriodReportModal({ isOpen, onClose, students, sessions, initialStudentId = null }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || 'all');
  const [periodType, setPeriodType] = useState<PeriodType>('this_month');
  
  // Custom date range state
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // First of this month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [copied, setCopied] = useState(false);

  // Set date ranges when preset changes
  const handlePeriodChange = (type: PeriodType) => {
    setPeriodType(type);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'this_week') {
      // Start of week (Saturday or Sunday)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 6 ? 0 : -1); // approximate Arabic week start
      const startOfWeek = new Date(now.setDate(diff));
      setStartDate(startOfWeek.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (type === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (type === 'last_30_days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      setStartDate(past30.toISOString().split('T')[0]);
      setEndDate(today);
    }
  };

  // Filter sessions based on date & student
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Student filter
      if (selectedStudentId !== 'all' && session.studentId !== selectedStudentId) {
        return false;
      }
      // Date filter
      if (periodType === 'all') return true;
      if (startDate && session.date < startDate) return false;
      if (endDate && session.date > endDate) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, selectedStudentId, periodType, startDate, endDate]);

  // Statistics
  const totalSessions = filteredSessions.length;
  const presentSessions = filteredSessions.filter(s => s.status === 'present').length;
  const absentSessions = filteredSessions.filter(s => s.status === 'absent').length;
  const excusedSessions = filteredSessions.filter(s => s.status === 'excused').length;

  // Group by student for report
  const studentBreakdowns = useMemo(() => {
    const map = new Map<string, { student: Student; sessions: Session[] }>();
    
    // Initialize for relevant students
    const targetStudents = selectedStudentId === 'all' 
      ? students 
      : students.filter(s => s.id === selectedStudentId);

    targetStudents.forEach(st => {
      map.set(st.id, { student: st, sessions: [] });
    });

    filteredSessions.forEach(sess => {
      const entry = map.get(sess.studentId);
      if (entry) {
        entry.sessions.push(sess);
      }
    });

    return Array.from(map.values()).filter(item => item.sessions.length > 0 || selectedStudentId !== 'all');
  }, [students, filteredSessions, selectedStudentId]);

  // Date range label
  const periodLabel = useMemo(() => {
    if (periodType === 'all') return 'كامل الفترة';
    if (startDate === endDate) return `يوم: ${startDate}`;
    return `من ${startDate} إلى ${endDate}`;
  }, [periodType, startDate, endDate]);

  // Generate formatted text for WhatsApp & Copy
  const reportText = useMemo(() => {
    const isSingleStudent = selectedStudentId !== 'all';
    const singleStudent = isSingleStudent ? students.find(s => s.id === selectedStudentId) : null;

    let text = `بسم الله الرحمن الرحيم\n`;
    text += `📖 برنامج اقرأ وارتق لتعليم القرآن الكريم\n`;
    
    if (isSingleStudent && singleStudent) {
      text += `📋 تقرير متابعة الطالب: ${singleStudent.name}\n`;
      text += `المستوى: ${singleStudent.level || 'غير محدد'}\n`;
    } else {
      text += `📋 التقرير العام لحلقة القرآن الكريم\n`;
    }
    
    text += `🗓️ الفترة: ${periodLabel}\n\n`;
    
    text += `📊 ملخص الإحصائيات:\n`;
    text += `• إجمالي الجلسات: ${totalSessions}\n`;
    text += `• الحضور: ${presentSessions} حصة\n`;
    if (absentSessions > 0) text += `• الغياب: ${absentSessions}\n`;
    if (excusedSessions > 0) text += `• الاستئذان: ${excusedSessions}\n`;
    text += `\n`;

    if (studentBreakdowns.length > 0) {
      text += `📝 تفاصيل المتابعة والإنجازات:\n`;
      text += `────────────────────\n`;

      studentBreakdowns.forEach(({ student, sessions: stSessions }) => {
        if (!isSingleStudent) {
          text += `👤 الطالب: ${student.name} (${student.level || 'مستوى عام'})\n`;
          const stPresent = stSessions.filter(s => s.status === 'present').length;
          text += `   الحضور: ${stPresent} من ${stSessions.length} درس\n`;
        }

        if (stSessions.length === 0) {
          text += `   - لا توجد جلسات مسجلة خلال هذه الفترة\n`;
        } else {
          stSessions.forEach(s => {
            text += `   📅 ${s.date} : `;
            if (s.status === 'present') {
              text += `[حاضر]\n`;
              if (s.lessonDetails) text += `      المقرر: ${s.lessonDetails}\n`;
              if (s.notes) text += `      الملاحظات: ${s.notes}\n`;
            } else if (s.status === 'absent') {
              text += `[غائب]\n`;
            } else {
              text += `[مستأذن]\n`;
            }
          });
        }
        text += `\n`;
      });
    } else {
      text += `لا توجد بيانات مسجلة في هذه الفترة.\n\n`;
    }

    text += `نسأل الله لأبنائنا التوفيق والسداد والبركة في القرآن الكريم.\n`;
    text += `مع تحيات إدارة برنامج اقرأ وارتق`;
    return text;
  }, [
    selectedStudentId, 
    students, 
    periodLabel, 
    totalSessions, 
    presentSessions, 
    absentSessions, 
    excusedSessions, 
    studentBreakdowns
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(reportText)}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">تقرير الفترة والمتابعة</h2>
              <p className="text-emerald-200/80 text-xs">توليد ومشاركة تقرير مخصص للفترة المحددة</p>
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

        {/* Filters Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Controls Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  نطاق التقرير
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="all">🌟 جميع الطلاب (التقرير العام للحلقة)</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>👤 {s.name} {s.level ? `(${s.level})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Period Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  الفترة الزمنية
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePeriodChange('this_week')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      periodType === 'this_week' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    هذا الأسبوع
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePeriodChange('this_month')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      periodType === 'this_month' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    هذا الشهر
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePeriodChange('custom')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      periodType === 'custom' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    مخصص
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Dates Inputs */}
            {periodType === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 animate-in fade-in">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">من تاريخ</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-center">
              <div className="text-xs text-emerald-800 font-medium mb-0.5">إجمالي الجلسات</div>
              <div className="text-2xl font-extrabold text-emerald-950">{totalSessions}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-center">
              <div className="text-xs text-emerald-700 font-medium mb-0.5">حضور مكتمل</div>
              <div className="text-2xl font-extrabold text-emerald-700">{presentSessions}</div>
            </div>
            <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl text-center">
              <div className="text-xs text-red-800 font-medium mb-0.5">الغياب</div>
              <div className="text-2xl font-extrabold text-red-700">{absentSessions}</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl text-center">
              <div className="text-xs text-amber-800 font-medium mb-0.5">الاستئذان</div>
              <div className="text-2xl font-extrabold text-amber-700">{excusedSessions}</div>
            </div>
          </div>

          {/* Report Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                معاينة نص التقرير المعد للمشاركة:
              </label>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {filteredSessions.length} سجل مضمن
              </span>
            </div>
            
            <div className="relative">
              <pre className="w-full bg-slate-900 text-emerald-300/90 p-4 rounded-xl text-xs sm:text-sm font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border border-slate-800 shadow-inner">
                {reportText}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 order-2 sm:order-1 text-center sm:text-right">
            يمكنك إرسال التقرير فوراً لولي الأمر أو المجموعة عبر الواتساب بنقرة واحدة.
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
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              مشاركة عبر واتساب
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
