/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { supabase } from './lib/supabase';
import { Login } from './components/Login';

import { useStore } from './store';
import { Student } from './types';

import { StudentList } from './components/StudentList';
import { SessionForm } from './components/SessionForm';
import { StudentProfile } from './components/StudentProfile';
import { PeriodReportModal } from './components/PeriodReportModal';
import { PaymentReminderModal } from './components/PaymentReminderModal';
import { FinancialReportModal } from './components/FinancialReportModal';
import { ScheduleModal } from './components/ScheduleModal';

import {
  BookOpen,
  FileText,
  CreditCard,
  DollarSign,
  CalendarClock,
  LogOut
} from 'lucide-react';

type ViewState = 'dashboard' | 'student_profile' | 'new_session';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      setUser(user ?? null);
      setAuthLoading(false);
    };

    checkUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-50 flex items-center justify-center"
      >
        <div className="text-emerald-900 font-medium">
          جاري تحميل النظام...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <IqraaApp user={user} />;
}

function IqraaApp({ user }: { user: User }) {
  const {
    students,
    sessions,
    payments,
    loading,
    addStudent,
    updateStudentSchedule,
    addSession,
    addPayment,
    deletePayment
  } = useStore();

  const [view, setView] = useState<ViewState>('dashboard');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStudentId, setReportStudentId] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentReminderStudentId, setPaymentReminderStudentId] =
    useState<string | null>(null);

  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [financialStudentId, setFinancialStudentId] =
    useState<string | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleStudent, setScheduleStudent] = useState<Student | null>(null);

  const handleSelectStudent = (student: Student) => {
    setActiveStudent(student);
    setView('student_profile');
  };

  const handleNewSession = (student?: Student) => {
    if (student) {
      setActiveStudent(student);
    } else {
      setActiveStudent(null);
    }

    setView('new_session');
  };

  const handleSessionSubmit = (sessionData: any) => {
    addSession(sessionData);

    if (activeStudent) {
      setView('student_profile');
    } else {
      setView('dashboard');
    }
  };

  const handleOpenReport = (studentId: string | null = null) => {
    setReportStudentId(studentId);
    setIsReportModalOpen(true);
  };

  const handleOpenPaymentReminder = (
    studentId?: string | null
  ) => {
    setPaymentReminderStudentId(studentId || null);
    setIsPaymentModalOpen(true);
  };

  const handleOpenFinancialReport = (
    studentId?: string | null
  ) => {
    setFinancialStudentId(studentId || null);
    setIsFinancialModalOpen(true);
  };

  const handleOpenSchedule = (student?: Student) => {
    setScheduleStudent(
      student || (activeStudent ? activeStudent : null)
    );

    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = (
    studentId: string,
    schedule: {
      nextSessionDate?: string;
      nextSessionTime?: string;
      nextSessionNotes?: string;
    }
  ) => {
    updateStudentSchedule(studentId, schedule);

    if (activeStudent && activeStudent.id === studentId) {
      setActiveStudent((prev) =>
        prev ? { ...prev, ...schedule } : null
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-50 flex items-center justify-center"
      >
        <div className="text-emerald-900 font-medium">
          جاري تحميل البيانات...
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 flex flex-col font-sans"
    >
      <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

          <button
            onClick={() => {
              setActiveStudent(null);
              setView('dashboard');
            }}
            className="flex items-center gap-3 text-right hover:opacity-90 transition-opacity"
          >
            <div className="bg-white/10 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-emerald-100" />
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                اقرأ وارتق
              </h1>

              <p className="text-emerald-200 text-xs font-medium">
                نظام المتابعة الفردية للقرآن الكريم
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">

            <button
              onClick={() =>
                handleOpenSchedule(activeStudent || undefined)
              }
              className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
              title="جدولة وتحديد موعد الدرس القادم"
            >
              <CalendarClock className="w-4 h-4 text-emerald-300" />

              <span className="hidden sm:inline">
                جدولة موعد
              </span>

              <span className="sm:hidden">
                المواعيد
              </span>
            </button>

            <button
              onClick={() =>
                handleOpenFinancialReport(
                  activeStudent?.id || null
                )
              }
              className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <DollarSign className="w-4 h-4 text-emerald-300" />

              <span className="hidden sm:inline">
                التقرير المالي
              </span>

              <span className="sm:hidden">
                المالية
              </span>
            </button>

            <button
              onClick={() =>
                handleOpenPaymentReminder(
                  activeStudent?.id || null
                )
              }
              className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-emerald-300" />

              <span className="hidden sm:inline">
                تذكير بالرسوم
              </span>

              <span className="sm:hidden">
                الرسوم
              </span>
            </button>

            <button
              onClick={() =>
                handleOpenReport(activeStudent?.id || null)
              }
              className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-300" />

              <span className="hidden sm:inline">
                تقرير الفترة والمتابعة
              </span>

              <span className="sm:hidden">
                تقرير الفترة
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-900/30 hover:bg-red-800/50 text-white border border-white/20 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />

              <span className="hidden sm:inline">
                خروج
              </span>
            </button>

          </div>
        </div>
      </header>

      <main className="flex-1 py-6">

        {view === 'dashboard' && (
          <StudentList
            students={students}
            onAddStudent={addStudent}
            onSelectStudent={handleSelectStudent}
            onNewSession={handleNewSession}
            onOpenGeneralReport={() =>
              handleOpenReport('all')
            }
            onOpenPaymentReminder={(stId) =>
              handleOpenPaymentReminder(stId)
            }
            onOpenFinancialReport={(stId) =>
              handleOpenFinancialReport(stId)
            }
            onOpenSchedule={(student) =>
              handleOpenSchedule(student)
            }
          />
        )}

        {view === 'new_session' && (
          <SessionForm
            student={activeStudent}
            students={students}
            onSubmit={handleSessionSubmit}
            onCancel={() =>
              setView(
                activeStudent
                  ? 'student_profile'
                  : 'dashboard'
              )
            }
          />
        )}

        {view === 'student_profile' && activeStudent && (
          <StudentProfile
            student={
              students.find(
                (student) =>
                  student.id === activeStudent.id
              ) || activeStudent
            }
            sessions={sessions}
            onBack={() => {
              setActiveStudent(null);
              setView('dashboard');
            }}
            onNewSession={handleNewSession}
            onOpenPeriodReport={(stId) =>
              handleOpenReport(stId)
            }
            onOpenPaymentReminder={(stId) =>
              handleOpenPaymentReminder(stId)
            }
            onOpenFinancialReport={(stId) =>
              handleOpenFinancialReport(stId)
            }
            onOpenSchedule={(student) =>
              handleOpenSchedule(student)
            }
          />
        )}

      </main>

      <PeriodReportModal
        isOpen={isReportModalOpen}
        onClose={() =>
          setIsReportModalOpen(false)
        }
        students={students}
        sessions={sessions}
        initialStudentId={reportStudentId}
      />

      <PaymentReminderModal
        isOpen={isPaymentModalOpen}
        onClose={() =>
          setIsPaymentModalOpen(false)
        }
        students={students}
        sessions={sessions}
        initialStudentId={paymentReminderStudentId}
      />

      <FinancialReportModal
        isOpen={isFinancialModalOpen}
        onClose={() =>
          setIsFinancialModalOpen(false)
        }
        students={students}
        sessions={sessions}
        payments={payments}
        onAddPayment={addPayment}
        onDeletePayment={deletePayment}
        initialStudentId={financialStudentId}
        onOpenPaymentReminder={(stId) =>
          handleOpenPaymentReminder(stId)
        }
      />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() =>
          setIsScheduleModalOpen(false)
        }
        student={scheduleStudent}
        students={students}
        onSaveSchedule={handleSaveSchedule}
        onSelectStudentForSession={(student) => {
          setIsScheduleModalOpen(false);
          handleNewSession(student);
        }}
      />

      <footer className="text-center text-xs text-slate-400 py-3">
        {user.email}
      </footer>
    </div>
  );
}
