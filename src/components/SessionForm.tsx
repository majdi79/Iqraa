import React, { useState, useEffect } from 'react';
import { Student, Session } from '../types';
import { Clock, BookOpen, FileText, CheckCircle, XCircle, AlertCircle, ArrowRight, Calendar } from 'lucide-react';

interface Props {
  student: Student | null;
  students: Student[];
  onSubmit: (session: Omit<Session, 'id'>) => void;
  onCancel: () => void;
}

export function SessionForm({ student, students, onSubmit, onCancel }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState(student?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(20);
  const [status, setStatus] = useState<'present' | 'absent' | 'excused'>('present');
  const [lessonDetails, setLessonDetails] = useState('');
  const [notes, setNotes] = useState('');
  
  // Next session schedule
  const [setNextLesson, setSetNextLesson] = useState(false);
  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState('');
  const [nextNotes, setNextNotes] = useState('');

  // Auto-select if a single student was passed
  useEffect(() => {
    if (student) {
      setSelectedStudentId(student.id);
      if (student.nextSessionDate) {
        setNextDate(student.nextSessionDate);
        setNextTime(student.nextSessionTime || '');
        setNextNotes(student.nextSessionNotes || '');
      }
    }
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    onSubmit({
      studentId: selectedStudentId,
      date,
      durationMinutes: duration,
      status,
      lessonDetails,
      notes,
      nextSessionDate: setNextLesson ? nextDate : undefined,
      nextSessionTime: setNextLesson ? nextTime : undefined,
      nextSessionNotes: setNextLesson ? nextNotes : undefined
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4">
      <button 
        onClick={onCancel}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 mb-6 transition-colors"
      >
        <ArrowRight className="w-5 h-5" />
        العودة
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">تسجيل حلقة جديدة</h2>
            <p className="text-slate-500 text-sm mt-1">إضافة تفاصيل الدرس والمتابعة الفردية</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">الطالب</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50"
            >
              <option value="">اختر الطالب...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                التاريخ
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                مدة الحصة (بالدقائق)
              </label>
              <input
                type="number"
                min="1"
                required
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">حالة الحضور</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setStatus('present')}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${status === 'present' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <CheckCircle className={`w-5 h-5 ${status === 'present' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="font-medium">حاضر</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('absent')}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${status === 'absent' ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <XCircle className={`w-5 h-5 ${status === 'absent' ? 'text-red-600' : 'text-slate-400'}`} />
                <span className="font-medium">غائب</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('excused')}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${status === 'excused' ? 'bg-amber-50 border-amber-500 text-amber-700 ring-1 ring-amber-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <AlertCircle className={`w-5 h-5 ${status === 'excused' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="font-medium">مستأذن</span>
              </button>
            </div>
          </div>

          {status === 'present' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  محتوى الدرس (المقرر الذي تم إنجازه)
                </label>
                <input
                  type="text"
                  required
                  value={lessonDetails}
                  onChange={(e) => setLessonDetails(e.target.value)}
                  placeholder="مثال: سورة البقرة من آية 1 إلى 5..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  ملاحظات المتابعة والتوجيهات
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات حول التلاوة، الحفظ، أو توجيهات للدرس القادم..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50 resize-none"
                />
              </div>
            </div>
          )}

          {/* Next Lesson Appointment Section */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={setNextLesson}
                  onChange={(e) => {
                    setSetNextLesson(e.target.checked);
                    if (e.target.checked && !nextDate) {
                      // Default to tomorrow or next date
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      setNextDate(d.toISOString().split('T')[0]);
                    }
                  }}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-sm">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>تحديد موعد الدرس القادم لهذا الطالب</span>
                </div>
              </label>
            </div>

            {setNextLesson && (
              <div className="space-y-4 pt-2 border-t border-emerald-200/60 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      تاريخ الدرس القادم
                    </label>
                    <input
                      type="date"
                      required={setNextLesson}
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      الوقت (اختياري)
                    </label>
                    <input
                      type="time"
                      value={nextTime}
                      onChange={(e) => setNextTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    المقرر المطلوب تحضيره أو ملاحظة للموعد القادم (اختياري)
                  </label>
                  <input
                    type="text"
                    value={nextNotes}
                    onChange={(e) => setNextNotes(e.target.value)}
                    placeholder="مثال: مراجعة سورة النبأ وحفظ سورة النازعات..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium shadow-sm transition-colors"
            >
              حفظ السجل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
