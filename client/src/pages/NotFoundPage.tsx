import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-100">404</h1>
      <p className="mt-2 text-sm text-zinc-400 max-w-sm">
        The compliance sector or registry view you are looking for does not exist.
      </p>
      <button
        onClick={() => navigate('/')}
        className="mt-6 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Command Center</span>
      </button>
    </div>
  );
};
