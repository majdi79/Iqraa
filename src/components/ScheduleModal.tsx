import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { 
  X, 
  Calendar, 
  Clock, 
  BookOpen, 
  Send, 
  Trash2, 
  Check, 
  Sparkles, 
  User, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  students: Student[];
  onSaveSchedule: (studentId: string, schedule: { nextSessionDate?: string; nextSessionTime?: string; nextSessionNotes?: string }) => void;
  onSelectStudentForSession?: (student: Student) => void;
}

export function ScheduleModal({
  isOpen,
  onClose,
  student,
  students,
  onSaveSchedule,
  onSelectStudentForSession
}: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(student?.id || '');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (student) {
      setSelectedStudentId(student.id);
      setDate(student.nextSessionDate || '');
      setTime(student.nextSessionTime || '');
      setNotes(student.nextSessionNotes || '');
    } else if (students.length > 0) {
      const first = students[0];
      setSelectedStudentId(first.id);
      setDate(first.nextSessionDate || '');
      setTime(first.nextSessionTime || '');
      setNotes(first.nextSessionNotes || '');
    }
  }, [student, students, isOpen]);

  // When changing student from dropdown inside modal
  const handleStudentChange = (stId: string) => {
    setSelectedStudentId(stId);
    const target = students.find(s => s.id === stId);
    if (target) {
      setDate(target.nextSessionDate || '');
      setTime(target.nextSessionTime || '');
      setNotes(target.nextSessionNotes || '');
    }
  };

  const currentStudent = students.find(s => s.id === selectedStudentId);

  // Quick Date Helpers
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    onSaveSchedule(selectedStudentId, {
      nextSessionDate: date.trim() || undefined,
      nextSessionTime: time.trim() || undefined,
      nextSessionNotes: notes.trim() || undefined
    });

    onClose();
  };

  const handleClearSchedule = () => {
    if (!selectedStudentId) return;
    onSaveSchedule(selectedStudentId, {
      nextSessionDate: '',
      nextSessionTime: '',
      nextSessionNotes: ''
    });
    setDate('');
    setTime('');
    setNotes('');
    onClose();
  };

  // Format time to 12-hour Arabic
  const formatTimeArabic = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours)) return timeStr;
    const period = hours >= 12 ? 'مساءً' : 'صباحاً';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Generate WhatsApp Message text
  const generateWhatsAppReminder = () => {
    if (!currentStudent) return '';
    let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
    msg += `أهلاً بكم ولي أمر الطالب: *${currentStudent.name}*\n\n`;
    msg += `🗓️ *تذكير بموعد درس القرآن الكريم القادم*\n`;
    msg += `• التاريخ: ${date || 'يحدد لاحقاً'}\n`;
    if (time) {
      msg += `• الوقت: ${formatTimeArabic(time)} (${time})\n`;
    }
    if (notes.trim()) {
      msg += `• المقرر المطلوب والملاحظات: ${notes.trim()}\n`;
    }
    msg += `\nنرجو الحرص على الحضور في الموعد المحدد، شاكرين ومقدرين حسن تعاونكم.\n`;
    msg += `إدارة برنامج اقرأ وارتق`;
    return msg;
  };

  const whatsappMessage = generateWhatsAppReminder();
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تحديد موعد الدرس القادم</h2>
              <p className="text-emerald-200/80 text-xs">جدولة الموعد القادم وإرسال تذكير عبر الواتساب</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Student Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>الطالب:</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.level ? `(${s.level})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Date Presets */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">اختصارات سريعة للتاريخ:</span>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors text-center"
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1)}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors text-center"
              >
                غداً
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(2)}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors text-center"
              >
                بعد يومين
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7)}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors text-center"
              >
                بعد أسبوع
              </button>
            </div>
          </div>

          {/* Date & Time Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>تاريخ الدرس القادم:</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>الوقت (اختياري):</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes / Preparation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>المقرر المطلوب تحضيره أو ملاحظات (اختياري):</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: مراجعة سورة النبأ من آية 1 إلى 20..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* WhatsApp Reminder Preview */}
          {date && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                  <Send className="w-3.5 h-3.5 text-emerald-700" />
                  رسالة التذكير عبر الواتساب:
                </span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                >
                  <Send className="w-3 h-3" />
                  إرسال للواتساب
                </a>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-[11px] text-slate-700 whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto">
                {whatsappMessage}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-2">
            <div>
              {(currentStudent?.nextSessionDate || date) && (
                <button
                  type="button"
                  onClick={handleClearSchedule}
                  className="text-rose-600 hover:text-rose-700 text-xs font-medium flex items-center gap-1 py-1.5 px-2 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  إلغاء الموعد الحالي
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-xs text-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                حفظ الموعد
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
