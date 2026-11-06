import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, X, KeyRound } from 'lucide-react';
import { adminLogin } from '../services/api';
import { AdminUser } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (admin: AdminUser) => void;
}

export const AdminLoginModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('يرجى كتابة اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin({ username: username.trim(), password });
      onLoginSuccess(res.admin);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'بيانات الدخول الإدارية غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-sky-100 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-600 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-200 mb-3">
            <ShieldCheck className="w-7 h-7 text-amber-200" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">
            لوحة الإدارة – سنتر العسال
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل دخول آمن ومحمي لإدارة المنتجات، الطلبات، العروض ونقاط العملاء
          </p>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">اسم المستخدم الإداري</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-sky-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 font-semibold"
                autoComplete="username"
              />
              <User className="w-4 h-4 text-cyan-600 absolute right-3.5 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">كلمة المرور المشفرة</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sky-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 font-semibold"
                autoComplete="current-password"
              />
              <Lock className="w-4 h-4 text-cyan-600 absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-extrabold py-3 rounded-xl text-sm shadow-md shadow-cyan-200 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-amber-200" />
            <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول إلى الإدارة'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
