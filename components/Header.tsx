
import React from 'react';
import { User, View } from '../types';
import { Beaker, LayoutDashboard, Book, FlaskConical, MessageSquare, Star, Table } from 'lucide-react';

interface HeaderProps {
  user: User;
  activeView: View;
  onSetView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ user, activeView, onSetView }) => {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSetView('dashboard')}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Beaker size={24} fill="white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-black text-slate-800 block leading-tight">El Sherbiny</span>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Chemistry Academy</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-4">
          <NavItem active={activeView === 'dashboard'} onClick={() => onSetView('dashboard')} icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavItem active={activeView === 'lessons'} onClick={() => onSetView('lessons')} icon={<Book size={18} />} label="Library" />
          <NavItem active={activeView === 'periodic-table'} onClick={() => onSetView('periodic-table')} icon={<Table size={18} />} label="Periodic Table" />
          <NavItem active={activeView === 'journal'} onClick={() => onSetView('journal')} icon={<FlaskConical size={18} />} label="Lab Notes" />
          <NavItem active={activeView === 'tutor'} onClick={() => onSetView('tutor')} icon={<MessageSquare size={18} />} label="AI Assistant" />
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-sm font-black text-slate-800">{user.name}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{user.grade}</span>
          </div>
          <div className="bg-blue-50 px-3 py-1.5 rounded-2xl flex items-center gap-2 border border-blue-100">
             <Star size={14} className="text-blue-600" fill="currentColor" />
             <span className="text-blue-700 font-black text-sm">{user.points}</span>
          </div>
          <img src={user.avatar} className="w-11 h-11 rounded-2xl border-2 border-white shadow-md" alt="Avatar" />
        </div>
      </div>
    </header>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Header;
