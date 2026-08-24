import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, LogIn } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">

        <div className="text-center mb-8">
          <div className="mx-auto bg-emerald-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-emerald-900">
            اقرأ وارتق
          </h1>

          <p className="text-slate-500 mt-2 text-sm">
            نظام المتابعة الفردية للقرآن الكريم
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              البريد الإلكتروني
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              كلمة المرور
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <LogIn className="w-5 h-5" />

            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

        </form>
      </div>
    </div>
  );
}
