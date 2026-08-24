import React, { useState, useMemo } from 'react';
import { Student, Session } from '../types';
import {
  getBahrainDate,
  getBahrainDateObject,
  getBahrainStartOfMonth
} from '../bahrainTime';
import { 
  ArrowRight, 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Share2,
  Filter,
  CreditCard,
  DollarSign,
  CalendarClock,
  CalendarCheck,
  Send,
  Plus
} from 'lucide-react';

interface Props {
  student: Student;
  sessions: Session[];
  onBack: () => void;
  onNewSession: (student: Student) => void;
  onOpenPeriodReport?: (studentId: string) => void;
  onOpenPaymentReminder?: (studentId: string) => void;
  onOpenFinancialReport?: (studentId: string) => void;
  onOpenSchedule?: (student: Student) => void;
}

type PeriodFilter = 'all' | 'this_week' | 'this_month' | 'custom';

export function StudentProfile({ 
  student, 
  sessions, 
  onBack, 
  onNewSession, 
  onOpenPeriodReport, 
  onOpenPaymentReminder, 
  onOpenFinancialReport,
  onOpenSchedule
}: Props) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const todayStr = getBahrainDate();
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  // Helper for 12-hour Arabic time
  const formatTimeArabic = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours)) return timeStr;
    const period = hours >= 12 ? 'مساءً' : 'صباحاً';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Helper for formatted Arabic date
  const formatDateArabic = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('ar-BH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const isToday = student.nextSessionDate === todayStr;
  const isFuture = student.nextSessionDate && student.nextSessionDate > todayStr;

  const generateNextSessionWhatsAppLink = () => {
    let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
    msg += `أهلاً بكم ولي أمر الطالب: *${student.name}*\n\n`;
    msg += `🗓️ *تذكير بموعد درس القرآن الكريم القادم*\n`;
    msg += `• التاريخ: ${formatDateArabic(student.nextSessionDate) || student.nextSessionDate}\n`;
    if (student.nextSessionTime) {
      msg += `• الوقت: ${formatTimeArabic(student.nextSessionTime)} (${student.nextSessionTime})\n`;
    }
    if (student.nextSessionNotes?.trim()) {
      msg += `• المقرر المطلوب والملاحظات: ${student.nextSessionNotes.trim()}\n`;
    }
    msg += `\nنرجو الحرص على الحضور في الموعد المحدد بإذن الله.\nمنهج اقرأ وارتق`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const studentSessions = useMemo(() => {
    return sessions
      .filter(s => s.studentId === student.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, student.id]);

  const filteredSessions = useMemo(() => {
    const now = getBahrainDateObject();
    return studentSessions.filter(session => {
      if (periodFilter === 'all') return true;
      if (periodFilter === 'this_week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 6 ? 0 : -1);
        const startOfWeek = new Date(now.setDate(diff)).toISOString().split('T')[0];
        return session.date >= startOfWeek && session.date <= todayStr;
      }
      if (periodFilter === 'this_month') {
        const startOfMonth = getBahrainStartOfMonth();
        return session.date >= startOfMonth && session.date <= todayStr;
      }
      if (periodFilter === 'custom') {
        if (customStart && session.date < customStart) return false;
        if (customEnd && session.date > customEnd) return false;
        return true;
      }
      return true;
    });
  }, [studentSessions, periodFilter, customStart, customEnd, todayStr]);

  const totalSessions = filteredSessions.length;
  const presentSessions = filteredSessions.filter(s => s.status === 'present').length;
  const absentSessions = filteredSessions.filter(s => s.status === 'absent' || s.status === 'excused').length;

  const periodLabel = useMemo(() => {
    if (periodFilter === 'all') return 'كامل السجل';
    if (periodFilter === 'this_week') return 'هذا الأسبوع';
    if (periodFilter === 'this_month') return 'هذا الشهر';
    if (periodFilter === 'custom') return `من ${customStart} إلى ${customEnd}`;
    return '';
  }, [periodFilter, customStart, customEnd]);

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'absent': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'excused': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return null;
    }
  };

  const StatusText = ({ status }: { status: string }) => {
    switch (status) {
      case 'present': return <span className="text-emerald-700 font-medium">حاضر</span>;
      case 'absent': return <span className="text-red-700 font-medium">غائب</span>;
      case 'excused': return <span className="text-amber-700 font-medium">مستأذن</span>;
      default: return null;
    }
  };

  const generateWhatsAppLink = () => {
    let text = `بسم الله الرحمن الرحيم\n`;
    text += `📖 تقرير متابعة القرآن الكريم (منهج اقرأ وارتق)\n`;
    text += `👤 الطالب: ${student.name}\n`;
    text += `المستوى: ${student.level || 'غير محدد'}\n`;
    text += `🗓️ الفترة: ${periodLabel}\n\n`;
    
    text += `📊 إحصائيات الفترة:\n`;
    text += `• الجلسات الكلية: ${totalSessions}\n`;
    text += `• أيام الحضور: ${presentSessions}\n`;
    if (absentSessions > 0) {
      text += `• الغياب / الاستئذان: ${absentSessions}\n`;
    }
    text += `\n`;

    if (filteredSessions.length > 0) {
      text += `📚 الإنجازات والمتابعة في هذه الفترة:\n`;
      filteredSessions.forEach(session => {
        text += `\n📅 ${session.date}`;
        if (session.status === 'present') {
          text += ` [حاضر]`;
          if (session.lessonDetails) text += `\nالمقرر: ${session.lessonDetails}`;
          if (session.notes) {
            text += `\nالملاحظات: ${session.notes}`;
          }
        } else if (session.status === 'absent') {
          text += ` [غائب]`;
        } else {
          text += ` [مستأذن]`;
        }
        text += `\n`;
      });
    } else {
      text += `لا توجد جلسات مسجلة في هذه الفترة.\n`;
    }

    text += `\nنسأل الله له التوفيق والسداد والبركة.\nمنهج اقرأ وارتق`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const generateSessionWhatsAppLink = (session: Session) => {
    let text = `بسم الله الرحمن الرحيم\n`;
    text += `📖 تقرير درس القرآن الكريم (منهج اقرأ وارتق)\n`;
    text += `👤 الطالب: ${student.name}\n`;
    text += `📅 التاريخ: ${session.date}\n`;
    
    if (session.status === 'present') {
      text += `\n📚 المقرر المنجز: ${session.lessonDetails}`;
      if (session.notes) {
        text += `\n📝 ملاحظات وتوجيهات: ${session.notes}`;
      }
    } else if (session.status === 'absent') {
      text += `\nحالة الحضور: (غائب)`;
    } else {
      text += `\nحالة الحضور: (مستأذن)`;
    }
    
    text += `\n\nنسأل الله له التوفيق والسداد.\nمنهج اقرأ وارتق`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 mb-6 transition-colors font-medium"
      >
        <ArrowRight className="w-5 h-5" />
        العودة لقائمة الطلاب
      </button>

      {/* Main Student Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="bg-emerald-900 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{student.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-emerald-100/90 text-sm">
                <span className="flex items-center gap-1.5 bg-emerald-800/60 px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  {student.level || 'مستوى غير محدد'}
                </span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Calendar className="w-4 h-4" />
                  تاريخ الانضمام: {student.joinDate}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {onOpenFinancialReport && (
                <button
                  onClick={() => onOpenFinancialReport(student.id)}
                  className="bg-emerald-800/80 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap text-sm border border-emerald-700"
                  title="عرض التقرير المالي وكشف حساب الطالب"
                >
                  <DollarSign className="w-4 h-4 text-emerald-300" />
                  التقرير المالي
                </button>
              )}
              {onOpenPaymentReminder && (
                <button
                  onClick={() => onOpenPaymentReminder(student.id)}
                  className="bg-emerald-800/80 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap text-sm border border-emerald-700"
                  title="إرسال تذكير بدفع الرسوم مع ذكر الفترة"
                >
                  <CreditCard className="w-4 h-4 text-emerald-300" />
                  تذكير بالرسوم
                </button>
              )}
              <a
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap text-sm"
                title="مشاركة تقرير الفترة المحددة عبر الواتساب"
              >
                <Share2 className="w-4 h-4" />
                مشاركة تقرير الفترة
              </a>
              <button
                onClick={() => onNewSession(student)}
                className="bg-white text-emerald-950 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap text-sm"
              >
                <BookOpen className="w-4 h-4" />
                تسجيل حلقة
              </button>
            </div>
          </div>
        </div>

        {/* Next Scheduled Lesson Card */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/60 border-b border-emerald-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isToday ? 'bg-emerald-600 text-white' : 'bg-emerald-200/80 text-emerald-900'
              }`}>
                {isToday ? <CalendarCheck className="w-5 h-5" /> : <CalendarClock className="w-5 h-5" />}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-emerald-950">موعد الدرس القادم:</span>
                  {student.nextSessionDate ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isToday ? 'bg-emerald-600 text-white animate-pulse' : 'bg-white text-emerald-900 border border-emerald-200'
                    }`}>
                      {isToday ? '⚡ اليوم' : formatDateArabic(student.nextSessionDate)} 
                      {student.nextSessionTime ? ` (${formatTimeArabic(student.nextSessionTime)})` : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">لم يتم تحديد موعد بعد</span>
                  )}
                </div>

                {student.nextSessionNotes && (
                  <p className="text-xs text-emerald-900/80 mt-1 font-medium">
                    <span className="font-bold text-emerald-950">المقرر المطلوب:</span> {student.nextSessionNotes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {student.nextSessionDate && (
                <a
                  href={generateNextSessionWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="إرسال تذكير بالموعد عبر الواتساب"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تذكير واتساب</span>
                </a>
              )}

              {onOpenSchedule && (
                <button
                  onClick={() => onOpenSchedule(student)}
                  className="bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{student.nextSessionDate ? 'تعديل الموعد' : 'تحديد موعد'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Period Filter Bar */}
        <div className="bg-emerald-50/50 p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>تصفية الفترة للإحصائيات والتقرير:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 text-xs font-medium shadow-xs">
              <button
                onClick={() => setPeriodFilter('all')}
                className={`px-3 py-1.5 rounded-md transition-colors ${periodFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-emerald-600'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setPeriodFilter('this_week')}
                className={`px-3 py-1.5 rounded-md transition-colors ${periodFilter === 'this_week' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-emerald-600'}`}
              >
                هذا الأسبوع
              </button>
              <button
                onClick={() => setPeriodFilter('this_month')}
                className={`px-3 py-1.5 rounded-md transition-colors ${periodFilter === 'this_month' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-emerald-600'}`}
              >
                هذا الشهر
              </button>
              <button
                onClick={() => setPeriodFilter('custom')}
                className={`px-3 py-1.5 rounded-md transition-colors ${periodFilter === 'custom' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-emerald-600'}`}
              >
                فترة مخصصة
              </button>
            </div>

            {onOpenPeriodReport && (
              <button
                onClick={() => onOpenPeriodReport(student.id)}
                className="text-xs text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors font-medium flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                تخصيص تقرير مفصل
              </button>
            )}
          </div>
        </div>

        {/* Custom date range inputs */}
        {periodFilter === 'custom' && (
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">من:</span>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">إلى:</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <span className="text-emerald-700 font-medium">
              (تم تطبيق التصفية على السجلات بالأسفل وعلى رابط المشاركة)
            </span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-100">
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-slate-900 mb-1">{totalSessions}</div>
            <div className="text-sm text-slate-500 font-medium">
              إجمالي الجلسات {periodFilter !== 'all' ? `(${periodLabel})` : ''}
            </div>
          </div>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-1">{presentSessions}</div>
            <div className="text-sm text-slate-500 font-medium">
              أيام الحضور {periodFilter !== 'all' ? `(${periodLabel})` : ''}
            </div>
          </div>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-amber-600 mb-1">{absentSessions}</div>
            <div className="text-sm text-slate-500 font-medium">
              الغياب / الاستئذان {periodFilter !== 'all' ? `(${periodLabel})` : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xl font-bold text-slate-900">سجل المتابعة والدروس</h3>
        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
          {filteredSessions.length} درس معروض
        </span>
      </div>
      
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 border-dashed text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">لا توجد حلقات مسجلة لهذا الطالب في الفترة المحددة ({periodLabel}).</p>
            {periodFilter !== 'all' && (
              <button 
                onClick={() => setPeriodFilter('all')}
                className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 underline font-medium"
              >
                عرض كل الجلسات المسجلة
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map(session => (
            <div key={session.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center justify-center min-w-[120px] p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Calendar className="w-5 h-5 text-slate-400 mb-2" />
                <span className="font-bold text-slate-700 text-sm">{session.date}</span>
                {session.status === 'present' && (
                  <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {session.durationMinutes} دقيقة
                  </span>
                )}
              </div>
              
              <div className="flex-1 w-full relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={session.status} />
                    <StatusText status={session.status} />
                  </div>
                  <a
                    href={generateSessionWhatsAppLink(session)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-emerald-200 font-medium"
                    title="مشاركة تفاصيل هذا الدرس بالواتساب"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    مشاركة الدرس
                  </a>
                </div>
                
                {session.status === 'present' && (
                  <div className="space-y-3">
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                      <h4 className="text-sm font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        المقرر
                      </h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{session.lessonDetails}</p>
                    </div>
                    {session.notes && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-slate-400" />
                          الملاحظات
                        </h4>
                        <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{session.notes}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {session.status !== 'present' && (
                  <p className="text-slate-500 text-sm mt-2">
                    لم يحضر الطالب في هذه الجلسة.
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

