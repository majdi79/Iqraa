import { useState, useEffect, useCallback } from 'react';
import { Student, Session, Payment } from './types';
import { supabase } from './lib/supabase';

const MIGRATION_KEY = 'iqra_supabase_migrated';

export function useStore() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Convert Supabase rows to app
  // -----------------------------

  const mapStudent = (row: any): Student => ({
    id: row.id,
    name: row.name,
    level: row.level || '',
    joinDate: row.join_date || '',
    monthlyFee:
      row.monthly_fee !== null && row.monthly_fee !== undefined
        ? Number(row.monthly_fee)
        : undefined,
    sessionRate:
      row.session_rate !== null && row.session_rate !== undefined
        ? Number(row.session_rate)
        : undefined,
    phoneCountryCode: row.phone_country_code || '+973',
phoneNumber: row.phone_number || undefined,
    nextSessionDate: row.next_session_date || undefined,
    nextSessionTime: row.next_session_time || undefined,
    nextSessionNotes: row.next_session_notes || undefined,
  });

  const mapSession = (row: any): Session => ({
    id: row.id,
    studentId: row.student_id,
    date: row.session_date || '',
    durationMinutes: row.duration_minutes || 0,
    status: row.status || 'present',
    lessonDetails: row.lesson_details || '',
    notes: row.notes || '',
    nextSessionDate: row.next_session_date || undefined,
    nextSessionTime: row.next_session_time || undefined,
    nextSessionNotes: row.next_session_notes || undefined,
  });

  const mapPayment = (row: any): Payment => ({
    id: row.id,
    studentId: row.student_id,
    date: row.payment_date || '',
    amount: Number(row.amount || 0),
    periodText: row.period_text || undefined,
    paymentMethod: row.payment_method || undefined,
    notes: row.notes || undefined,
  });

  // -----------------------------
  // Load everything from Supabase
  // -----------------------------

  const loadAll = useCallback(async () => {
    try {
      const [studentsResult, sessionsResult, paymentsResult] =
        await Promise.all([
          supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: true }),

          supabase
            .from('sessions')
            .select('*')
            .order('session_date', { ascending: false }),

          supabase
            .from('payments')
            .select('*')
            .order('payment_date', { ascending: false }),
        ]);

      if (studentsResult.error) throw studentsResult.error;
      if (sessionsResult.error) throw sessionsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setStudents((studentsResult.data || []).map(mapStudent));
      setSessions((sessionsResult.data || []).map(mapSession));
      setPayments((paymentsResult.data || []).map(mapPayment));
    } catch (error) {
      console.error('Error loading Iqraa data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // -----------------------------
  // One-time localStorage migration
  // -----------------------------

  const migrateLocalData = useCallback(async () => {
    if (localStorage.getItem(MIGRATION_KEY) === 'true') {
      return;
    }

    const savedStudents = localStorage.getItem('iqra_students');
    const savedSessions = localStorage.getItem('iqra_sessions');
    const savedPayments = localStorage.getItem('iqra_payments');

    const localStudents: Student[] = savedStudents
      ? JSON.parse(savedStudents)
      : [];

    const localSessions: Session[] = savedSessions
      ? JSON.parse(savedSessions)
      : [];

    const localPayments: Payment[] = savedPayments
      ? JSON.parse(savedPayments)
      : [];

    try {
      if (localStudents.length > 0) {
        const { error } = await supabase.from('students').upsert(
          localStudents.map((student) => ({
            id: student.id,
            name: student.name,
            level: student.level,
            join_date: student.joinDate || null,
            monthly_fee: student.monthlyFee ?? null,
            session_rate: student.sessionRate ?? null,
            phone_country_code: student.phoneCountryCode || '+973',
phone_number: student.phoneNumber || null,
            next_session_date: student.nextSessionDate || null,
            next_session_time: student.nextSessionTime || null,
            next_session_notes: student.nextSessionNotes || null,
          })),
          { onConflict: 'id' }
        );

        if (error) throw error;
      }

      if (localSessions.length > 0) {
        const { error } = await supabase.from('sessions').upsert(
          localSessions.map((session) => ({
            id: session.id,
            student_id: session.studentId,
            session_date: session.date,
            duration_minutes: session.durationMinutes,
            status: session.status,
            lesson_details: session.lessonDetails,
            notes: session.notes,
            next_session_date: session.nextSessionDate || null,
            next_session_time: session.nextSessionTime || null,
            next_session_notes: session.nextSessionNotes || null,
          })),
          { onConflict: 'id' }
        );

        if (error) throw error;
      }

      if (localPayments.length > 0) {
        const { error } = await supabase.from('payments').upsert(
          localPayments.map((payment) => ({
            id: payment.id,
            student_id: payment.studentId,
            payment_date: payment.date,
            amount: payment.amount,
            period_text: payment.periodText || null,
            payment_method: payment.paymentMethod || null,
            notes: payment.notes || null,
          })),
          { onConflict: 'id' }
        );

        if (error) throw error;
      }

      localStorage.setItem(MIGRATION_KEY, 'true');

      console.log('Iqraa local data migrated successfully to Supabase.');
    } catch (error) {
      console.error('Error migrating Iqraa data:', error);
    }
  }, []);

  // -----------------------------
  // Initial startup
  // -----------------------------

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      await migrateLocalData();
      await loadAll();
    };

    initialize();
  }, [migrateLocalData, loadAll]);

  // -----------------------------
  // Students
  // -----------------------------

  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...student,
      id: crypto.randomUUID(),
    };

    setStudents((prev) => [...prev, newStudent]);

    void (async () => {
      const { error } = await supabase.from('students').insert({
        id: newStudent.id,
        name: newStudent.name,
        level: newStudent.level,
        join_date: newStudent.joinDate || null,
        monthly_fee: newStudent.monthlyFee ?? null,
        session_rate: newStudent.sessionRate ?? null,
        phone_country_code: newStudent.phoneCountryCode || '+973',
phone_number: newStudent.phoneNumber || null,
        next_session_date: newStudent.nextSessionDate || null,
        next_session_time: newStudent.nextSessionTime || null,
        next_session_notes: newStudent.nextSessionNotes || null,
      });

      if (error) {
        console.error('Error adding student:', error);
        await loadAll();
      }
    })();

    return newStudent;
  };

  const updateStudent = (
    id: string,
    updates: Partial<Student>
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id
          ? { ...student, ...updates }
          : student
      )
    );

    const dbUpdates: Record<string, any> = {};

    if ('name' in updates) dbUpdates.name = updates.name;
    if ('level' in updates) dbUpdates.level = updates.level;

    if ('joinDate' in updates) {
      dbUpdates.join_date = updates.joinDate || null;
    }

    if ('monthlyFee' in updates) {
      dbUpdates.monthly_fee = updates.monthlyFee ?? null;
    }

    if ('sessionRate' in updates) {
      dbUpdates.session_rate = updates.sessionRate ?? null;
    }
    if ('phoneCountryCode' in updates) {
  dbUpdates.phone_country_code =
    updates.phoneCountryCode || '+973';
}

if ('phoneNumber' in updates) {
  dbUpdates.phone_number =
    updates.phoneNumber || null;
}

    if ('nextSessionDate' in updates) {
      dbUpdates.next_session_date =
        updates.nextSessionDate || null;
    }

    if ('nextSessionTime' in updates) {
      dbUpdates.next_session_time =
        updates.nextSessionTime || null;
    }

    if ('nextSessionNotes' in updates) {
      dbUpdates.next_session_notes =
        updates.nextSessionNotes || null;
    }

    void (async () => {
      const { error } = await supabase
        .from('students')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Error updating student:', error);
        await loadAll();
      }
    })();
  };

  const updateStudentSchedule = (
    studentId: string,
    schedule: {
      nextSessionDate?: string;
      nextSessionTime?: string;
      nextSessionNotes?: string;
    }
  ) => {
    updateStudent(studentId, schedule);
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) =>
      prev.filter((student) => student.id !== id)
    );

    setSessions((prev) =>
      prev.filter((session) => session.studentId !== id)
    );

    setPayments((prev) =>
      prev.filter((payment) => payment.studentId !== id)
    );

    void (async () => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting student:', error);
        await loadAll();
      }
    })();
  };

  // -----------------------------
  // Sessions
  // -----------------------------

  const addSession = (session: Omit<Session, 'id'>) => {
    const newSession: Session = {
      ...session,
      id: crypto.randomUUID(),
    };

    setSessions((prev) => [...prev, newSession]);

    if (session.nextSessionDate) {
      updateStudent(session.studentId, {
        nextSessionDate: session.nextSessionDate,
        nextSessionTime: session.nextSessionTime || '',
        nextSessionNotes: session.nextSessionNotes || '',
      });
    }

    void (async () => {
      const { error } = await supabase.from('sessions').insert({
        id: newSession.id,
        student_id: newSession.studentId,
        session_date: newSession.date,
        duration_minutes: newSession.durationMinutes,
        status: newSession.status,
        lesson_details: newSession.lessonDetails,
        notes: newSession.notes,
        next_session_date:
          newSession.nextSessionDate || null,
        next_session_time:
          newSession.nextSessionTime || null,
        next_session_notes:
          newSession.nextSessionNotes || null,
      });

      if (error) {
        console.error('Error adding session:', error);
        await loadAll();
      }
    })();

    return newSession;
  };

  const deleteSession = (id: string) => {
    setSessions((prev) =>
      prev.filter((session) => session.id !== id)
    );

    void (async () => {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting session:', error);
        await loadAll();
      }
    })();
  };

  // -----------------------------
  // Payments
  // -----------------------------

  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...payment,
      id: crypto.randomUUID(),
    };

    setPayments((prev) => [newPayment, ...prev]);

    void (async () => {
      const { error } = await supabase.from('payments').insert({
        id: newPayment.id,
        student_id: newPayment.studentId,
        payment_date: newPayment.date,
        amount: newPayment.amount,
        period_text: newPayment.periodText || null,
        payment_method: newPayment.paymentMethod || null,
        notes: newPayment.notes || null,
      });

      if (error) {
        console.error('Error adding payment:', error);
        await loadAll();
      }
    })();

    return newPayment;
  };

  const deletePayment = (id: string) => {
    setPayments((prev) =>
      prev.filter((payment) => payment.id !== id)
    );

    void (async () => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting payment:', error);
        await loadAll();
      }
    })();
  };

  return {
    students,
    sessions,
    payments,
    loading,
    addStudent,
    updateStudent,
    updateStudentSchedule,
    addSession,
    addPayment,
    deletePayment,
    deleteStudent,
    deleteSession,
    refreshData: loadAll,
  };
}
