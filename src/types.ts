export interface Student {
  id: string;
  name: string;
  level: string;
  joinDate: string;
  monthlyFee?: number;
  sessionRate?: number;
  phoneCountryCode?: string;
  phoneNumber?: string;
  nextSessionDate?: string;
  nextSessionTime?: string;
  nextSessionNotes?: string;
}

export interface Session {
  id: string;
  studentId: string;
  date: string;
  durationMinutes: number;
  status: 'present' | 'absent' | 'excused';
  lessonDetails: string;
  notes: string;
  nextSessionDate?: string;
  nextSessionTime?: string;
  nextSessionNotes?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  date: string;
  amount: number;
  periodText?: string;
  paymentMethod?: string;
  notes?: string;
}
