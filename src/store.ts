import { useState, useEffect } from 'react';
import { Student, Session, Payment } from './types';

export function useStore() {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('iqra_students');
    return saved ? JSON.parse(saved) : [];
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('iqra_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('iqra_payments');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('iqra_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('iqra_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('iqra_payments', JSON.stringify(payments));
  }, [payments]);

  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent = { ...student, id: crypto.randomUUID() };
    setStudents(prev => [...prev, newStudent]);
    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addSession = (session: Omit<Session, 'id'>) => {
    const newSession = { ...session, id: crypto.randomUUID() };
    setSessions(prev => [...prev, newSession]);
    
    // Automatically update student's next session if provided
    if (session.nextSessionDate) {
      updateStudent(session.studentId, {
        nextSessionDate: session.nextSessionDate,
        nextSessionTime: session.nextSessionTime || '',
        nextSessionNotes: session.nextSessionNotes || ''
      });
    }

    return newSession;
  };

  const updateStudentSchedule = (studentId: string, schedule: { nextSessionDate?: string; nextSessionTime?: string; nextSessionNotes?: string }) => {
    updateStudent(studentId, schedule);
  };

  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment = { ...payment, id: crypto.randomUUID() };
    setPayments(prev => [newPayment, ...prev]);
    return newPayment;
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setSessions(prev => prev.filter(s => s.studentId !== id));
    setPayments(prev => prev.filter(p => p.studentId !== id));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return { 
    students, 
    sessions, 
    payments,
    addStudent, 
    updateStudent,
    updateStudentSchedule,
    addSession,
    addPayment,
    deletePayment,
    deleteStudent,
    deleteSession
  };
}

