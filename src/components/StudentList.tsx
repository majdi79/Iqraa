import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { getBahrainDate, getBahrainDateArabic } from '../bahrainTime';
import { 
  Users, 
  Plus, 
  BookOpen, 
  ChevronLeft, 
  FileText, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Clock, 
  Send, 
  CalendarCheck, 
  CalendarClock, 
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Filter,
  UserCheck,
  UserX
} from 'lucide-react';

interface Props {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onSelectStudent: (student: Student) => void;
  onNewSession: (student: Student) => void;
  onOpenGeneralReport: () => void;
  onOpenPaymentReminder: (studentId?: string) => void;
  onOpenFinancialReport: (studentId?: string) => void;
  onOpenSchedule: (student?: Student) => void;
}

type ScheduleFilterType = 'all' | 'today' | 'upcoming' | 'unscheduled';

export function StudentList({ 
  students, 
  onAddStudent, 
  onSelectStudent, 
  onNewSession, 
  onOpenGeneralReport,
  onOpenPaymentReminder,
  onOpenFinancialReport,
  onOpenSchedule
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [newPhoneCountryCode, setNewPhoneCountryCode] = useState('+973');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilterType>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');

  // Today's date string in YYYY-MM-DD
  const todayStr = getBahrainDate();

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
        return d.toLocaleDateString('ar-BH', { weekday: 'short', day: 'numeric', month: 'short' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Today's Arabic full date for header
  const todayArabicHeader = getBahrainDateArabic();

  // Students scheduled for today
  const todayStudents = students.filter(s => s.nextSessionDate === todayStr);

  // Students scheduled for future dates
  const upcomingStudents = students
    .filter(s => s.nextSessionDate && s.nextSessionDate > todayStr)
    .sort((a, b) => (a.nextSessionDate || '').localeCompare(b.nextSessionDate || ''));

  // Unique Levels for filter dropdown
  const uniqueLevels = useMemo(() => {
    const levels = new Set<string>();
    students.forEach(s => {
      if (s.level && s.level.trim()) {
        levels.add(s.level.trim());
      }
    });
    return Array.from(levels);
  }, [students]);

  // Filtered Students list based on search and filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // 1. Text Search (matches name, level, or next session notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesLevel = student.level?.toLowerCase().includes(q) || false;
        const matchesNotes = student.nextSessionNotes?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesLevel && !matchesNotes) {
          return false;
        }
      }

      // 2. Level Filter
      if (selectedLevelFilter !== 'all') {
        if (student.level !== selectedLevelFilter) {
          return false;
        }
      }

      // 3. Schedule Filter
      if (scheduleFilter === 'today') {
        if (student.nextSessionDate !== todayStr) return false;
      } else if (scheduleFilter === 'upcoming') {
        if (!student.nextSessionDate || student.nextSessionDate <= todayStr) return false;
      } else if (scheduleFilter === 'unscheduled') {
        if (student.nextSessionDate && student.nextSessionDate >= todayStr) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedLevelFilter, scheduleFilter, todayStr]);

  // Quick WhatsApp message for today's appointment
  const generateTodayWhatsAppLink = (student: Student) => {
    let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
    msg += `أهلاً بكم ولي أمر الطالب: *${student.name}*\n\n`;
    msg += `🗓️ *تذكير بموعد درس القرآن الكريم اليوم*\n`;
    msg += `• التاريخ: ${todayArabicHeader}\n`;
    if (student.nextSessionTime) {
      msg += `• الوقت: ${formatTimeArabic(student.nextSessionTime)} (${student.nextSessionTime})\n`;
    }
    if (student.nextSessionNotes?.trim()) {
      msg += `• المقرر والملاحظات: ${student.nextSessionNotes.trim()}\n`;
    }
    msg += `\nنرجو الاستعداد والحضور في الموعد المحدد بإذن الله.\nمنهج اقرأ وارتق`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setScheduleFilter('all');
    setSelectedLevelFilter('all');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddStudent({
      name: newName.trim(),
      level: newLevel.trim(),
      joinDate: getBahrainDate(),
      phoneCountryCode: newPhoneCountryCode,
      phoneNumber: newPhoneNumber.trim() || undefined
    });
    setNewName('');
    setNewLevel('');
    setNewPhoneCountryCode('+973');
    setNewPhoneNumber('');
    setIsAdding(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            سجل ومتابعة الطلاب
          </h2>
          <p className="text-slate-500 mt-1">إدارة طلاب منهج اقرأ وارتق والمواعيد والحلقات</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => onOpenSchedule()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors font-medium text-sm flex-1 sm:flex-none"
            title="جدولة وتحديد موعد درس قادم لأي طالب"
          >
            <CalendarClock className="w-4 h-4 text-emerald-200" />
            جدولة موعد
          </button>
          <button
            onClick={() => onOpenFinancialReport()}
            className="bg-emerald-900 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors font-medium text-sm flex-1 sm:flex-none"
            title="عرض التقرير المالي الشامل وإدارة الرسوم والدفعات"
          >
            <DollarSign className="w-4 h-4 text-emerald-300" />
            التقرير المالي
          </button>
          <button
            onClick={() => onOpenPaymentReminder()}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors font-medium text-sm flex-1 sm:flex-none"
            title="إرسال تذكير بدفع الرسوم مع ذكر الفترة"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            تذكير بالرسوم
          </button>
          <button
            onClick={onOpenGeneralReport}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors font-medium text-sm flex-1 sm:flex-none"
            title="إنشاء ومشاركة تقرير إنجازات الحلقة لفترة محددة"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            تقرير الفترة
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors font-medium text-sm flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            طالب جديد
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: TODAY'S SCHEDULE / مواعيد اليوم في واجهة البرنامج                 */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-800 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-800/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-emerald-300 shadow-inner">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">مواعيد دروس اليوم</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    todayStudents.length > 0 ? 'bg-amber-400 text-amber-950' : 'bg-white/15 text-emerald-200'
                  }`}>
                    {todayStudents.length} {todayStudents.length === 1 ? 'موعد' : 'مواعيد'}
                  </span>
                </div>
                <p className="text-emerald-200/80 text-xs sm:text-sm mt-0.5 font-medium">
                  {todayArabicHeader}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenSchedule()}
                className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20"
              >
                <Plus className="w-3.5 h-3.5" />
                تحديد موعد جديد
              </button>
            </div>
          </div>

          {/* Today's appointments cards */}
          {todayStudents.length === 0 ? (
            <div className="pt-5 pb-2 text-center">
              <div className="inline-flex p-3 rounded-full bg-white/5 text-emerald-300/80 mb-2">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-emerald-100 font-semibold text-sm">لا توجد دروس مجدولة لهذا اليوم حتى الآن</p>
              <p className="text-emerald-300/70 text-xs mt-1">
                يمكنك الضغط على زر "جدولة موعد" أو من بطاقة أي طالب لتحديد موعد درسه القادم.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4">
              {todayStudents.map(student => (
                <div 
                  key={student.id} 
                  className="bg-white/10 hover:bg-white/15 backdrop-blur-xs border border-white/15 rounded-xl p-4 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-base text-white">{student.name}</h4>
                        <span className="text-xs text-emerald-200/90 bg-emerald-800/80 px-2 py-0.5 rounded-md inline-block mt-0.5 font-medium">
                          {student.level || 'مستوى غير محدد'}
                        </span>
                      </div>

                      {student.nextSessionTime ? (
                        <div className="flex items-center gap-1.5 bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTimeArabic(student.nextSessionTime)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-300 bg-white/10 px-2 py-0.5 rounded-md">
                          موعد اليوم
                        </span>
                      )}
                    </div>

                    {student.nextSessionNotes && (
                      <p className="text-xs text-emerald-100/90 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40 my-2 leading-relaxed">
                        <span className="font-bold text-amber-300">المقرر: </span>
                        {student.nextSessionNotes}
                      </p>
                    )}
                  </div>

                  {/* Actions for today's appointment */}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/10">
                    <button
                      onClick={() => onNewSession(student)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      بدء وتسجيل الدرس
                    </button>

                    <a
                      href={generateTodayWhatsAppLink(student)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/15 hover:bg-white/25 text-emerald-100 p-1.5 rounded-lg transition-colors"
                      title="إرسال تذكير بموعد اليوم عبر الواتساب"
                    >
                      <Send className="w-4 h-4 text-emerald-300" />
                    </a>

                    <button
                      onClick={() => onOpenSchedule(student)}
                      className="bg-white/15 hover:bg-white/25 text-emerald-100 p-1.5 rounded-lg transition-colors"
                      title="تعديل الموعد"
                    >
                      <CalendarClock className="w-4 h-4 text-emerald-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming lessons overview expandable */}
          {upcomingStudents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-emerald-800/60">
              <button
                onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                className="w-full flex items-center justify-between text-xs text-emerald-200 hover:text-white font-medium py-1 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-emerald-400" />
                  <span>المواعيد القادمة في الأيام التالية ({upcomingStudents.length} طلاب)</span>
                </span>
                {showAllUpcoming ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAllUpcoming && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3 pt-2 animate-in fade-in">
                  {upcomingStudents.map(student => (
                    <div 
                      key={student.id} 
                      className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{student.name}</div>
                        <div className="text-[11px] text-emerald-300 flex items-center gap-1 mt-0.5">
                          <span>📅 {formatDateArabic(student.nextSessionDate)}</span>
                          {student.nextSessionTime && (
                            <span>• ⏰ {formatTimeArabic(student.nextSessionTime)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenSchedule(student)}
                        className="p-1.5 bg-white/10 hover:bg-white/20 text-emerald-200 rounded-lg transition-colors shrink-0"
                        title="تعديل الموعد أو إرسال تذكير"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: ADD NEW STUDENT FORM                                             */}
      {/* ========================================================================= */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">بيانات الطالب الجديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم الطالب رباعياً</label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="محمد أحمد محمود..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">المستوى / المرحلة</label>
              <input
                type="text"
                value={newLevel}
                onChange={e => setNewLevel(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="مثال: التمهيدي، الجزء الأول..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رمز الدولة</label>
              <select
                value={newPhoneCountryCode}
                onChange={(e) => setNewPhoneCountryCode(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              >
                <option value="+973">🇧🇭 البحرين +973</option>
                <option value="+966">🇸🇦 السعودية +966</option>
                <option value="+965">🇰🇼 الكويت +965</option>
                <option value="+971">🇦🇪 الإمارات +971</option>
                <option value="+974">🇶🇦 قطر +974</option>
                <option value="+968">🇴🇲 عمان +968</option>
                <option value="+20">🇪🇬 مصر +20</option>
                <option value="+962">🇯🇴 الأردن +962</option>
                <option value="+961">🇱🇧 لبنان +961</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رقم التواصل</label>
              <div className="flex gap-2" dir="ltr">
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium">
                  {newPhoneCountryCode}
                </div>
                <input
                  type="tel"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="36000000"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
            >
              حفظ الطالب
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SECTION: STUDENTS GRID & SEARCH / FILTER                                  */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Search & Filter Header Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200/90 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن الطالب بالاسم، المستوى، أو المقرر..."
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Level Filter Dropdown if unique levels exist */}
            {uniqueLevels.length > 0 && (
              <div className="sm:w-48">
                <select
                  value={selectedLevelFilter}
                  onChange={(e) => setSelectedLevelFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value="all">جميع المستويات ({students.length})</option>
                  {uniqueLevels.map(lvl => (
                    <option key={lvl} value={lvl}>
                      {lvl} ({students.filter(s => s.level === lvl).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Schedule Filter Chips & Student Counts */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1 ml-1 text-[11px]">
                <Filter className="w-3 h-3" />
                تصفية:
              </span>

              <button
                type="button"
                onClick={() => setScheduleFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  scheduleFilter === 'all'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({students.length})
              </button>

              <button
                type="button"
                onClick={() => setScheduleFilter('today')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                  scheduleFilter === 'today'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <CalendarCheck className="w-3 h-3" />
                <span>دروس اليوم ({todayStudents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleFilter('upcoming')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                  scheduleFilter === 'upcoming'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CalendarClock className="w-3 h-3" />
                <span>مواعيد قادمة ({upcomingStudents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleFilter('unscheduled')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  scheduleFilter === 'unscheduled'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                بدون موعد ({students.filter(s => !s.nextSessionDate || s.nextSessionDate < todayStr).length})
              </button>
            </div>

            {/* Results counter / Reset */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold text-[11px]">
                عرض <strong className="text-emerald-900">{filteredStudents.length}</strong> من أصل {students.length} طالب
              </span>
              {(searchQuery || scheduleFilter !== 'all' || selectedLevelFilter !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-rose-600 hover:text-rose-700 hover:underline font-bold text-[11px] flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" />
                  إعادة ضبط
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 border-dashed text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">لا يوجد طلاب بعد</h3>
              <p className="text-slate-500">قم بإضافة طالب جديد للبدء بتسجيل الحلقات.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="col-span-full bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">لم يتم العثور على طالب يطابق البحث</h4>
                <p className="text-xs text-slate-500 mt-1">
                  لا توجد نتائج تطابق: "{searchQuery || scheduleFilter || selectedLevelFilter}"
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                مسح معايير البحث والتصفية
              </button>
            </div>
          ) : (
            filteredStudents.map(student => {
              const isToday = student.nextSessionDate === todayStr;
              const isFuture = student.nextSessionDate && student.nextSessionDate > todayStr;
              const isPast = student.nextSessionDate && student.nextSessionDate < todayStr;

              return (
                <div 
                  key={student.id} 
                  className={`bg-white rounded-2xl p-5 shadow-xs border transition-all group flex flex-col justify-between ${
                    isToday 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' 
                      : 'border-slate-200/90 hover:border-emerald-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    {/* Top Row: Name & Level */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-emerald-800 transition-colors">
                          {student.name}
                        </h3>
                        <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                          {student.level || 'مستوى غير محدد'}
                        </span>
                      </div>
                    </div>

                    {/* Next Lesson Appointment Banner on card */}
                    <div className="mb-4">
                      {isToday ? (
                        <div 
                          onClick={() => onOpenSchedule(student)}
                          className="bg-emerald-100/90 border border-emerald-300 hover:bg-emerald-200/90 cursor-pointer p-2 rounded-xl text-xs transition-colors"
                        >
                          <div className="flex items-center justify-between text-emerald-950 font-bold mb-0.5">
                            <span className="flex items-center gap-1">
                              <CalendarCheck className="w-3.5 h-3.5 text-emerald-700" />
                              الدرس اليوم!
                            </span>
                            {student.nextSessionTime && (
                              <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                {formatTimeArabic(student.nextSessionTime)}
                              </span>
                            )}
                          </div>
                          {student.nextSessionNotes && (
                            <p className="text-[11px] text-emerald-900 truncate mt-0.5 font-medium">
                              المقرر: {student.nextSessionNotes}
                            </p>
                          )}
                        </div>
                      ) : isFuture ? (
                        <div 
                          onClick={() => onOpenSchedule(student)}
                          className="bg-slate-50 border border-slate-200 hover:bg-emerald-50/60 hover:border-emerald-200 cursor-pointer p-2 rounded-xl text-xs transition-colors"
                        >
                          <div className="flex items-center justify-between text-slate-700 font-semibold mb-0.5">
                            <span className="flex items-center gap-1 text-emerald-800">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              {formatDateArabic(student.nextSessionDate)}
                            </span>
                            {student.nextSessionTime && (
                              <span className="text-[11px] text-slate-500">
                                {formatTimeArabic(student.nextSessionTime)}
                              </span>
                            )}
                          </div>
                          {student.nextSessionNotes && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {student.nextSessionNotes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => onOpenSchedule(student)}
                          className="w-full text-right py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 text-xs font-medium border border-dashed border-slate-200 hover:border-emerald-200 flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-1">
                            <CalendarClock className="w-3.5 h-3.5" />
                            <span>تحديد موعد الدرس القادم</span>
                          </span>
                          <span className="text-emerald-600 font-bold">+</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex gap-1.5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onNewSession(student)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        isToday 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      درس جديد
                    </button>
                    
                    <button
                      onClick={() => onOpenSchedule(student)}
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="جدولة موعد الدرس القادم وتذكير الواتساب"
                    >
                      <CalendarClock className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onOpenFinancialReport(student.id)}
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="التقرير المالي وكشف الحساب"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onOpenPaymentReminder(student.id)}
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="إرسال تذكير بالرسوم"
                    >
                      <CreditCard className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onSelectStudent(student)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="فتح ملف وسجل الطالب"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
