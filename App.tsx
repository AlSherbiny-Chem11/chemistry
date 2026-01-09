
import React, { useState } from 'react';
import { User, View, GradeLevel, ChemistryBranch, JournalEntry } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LessonLibrary from './components/LessonLibrary';
import LearningJournal from './components/LearningJournal';
import ChatTutor from './components/ChatTutor';
import PeriodicTable from './components/PeriodicTable';
import { BookOpen, Home, PenTool, MessageCircle, Beaker, Table } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      setUser({
        id: '123',
        name: 'Ahmed Student',
        email: 'ahmed@student.com',
        grade: '1st Secondary',
        points: 750,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed'
      });
      setIsLoggingIn(false);
    }, 1000);
  };

  const handleAddJournalEntry = (entry: JournalEntry) => {
    setJournalEntries(prev => [entry, ...prev]);
    if (user) {
      setUser({ ...user, points: user.points + 100 });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl text-center max-w-lg w-full transform hover:scale-[1.02] transition-transform">
          <div className="text-7xl mb-6">🧪</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            El Sherbiny Chemistry
          </h1>
          <p className="text-slate-400 mb-10 text-lg">
            Master the elements with <span className="text-blue-300 font-bold">Professor Mohamed El Sherbiny</span>.
          </p>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="flex items-center justify-center w-full py-4 px-6 bg-blue-600 rounded-2xl text-white font-black text-xl hover:bg-blue-500 transition-all hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.6)] disabled:opacity-50"
          >
            {isLoggingIn ? (
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Access Academy"
            )}
          </button>
          <div className="mt-8 flex justify-center gap-4 text-xs font-bold text-slate-500">
            <span className="bg-slate-800 px-3 py-1 rounded-full uppercase tracking-tighter">Preparatory</span>
            <span className="bg-slate-800 px-3 py-1 rounded-full uppercase tracking-tighter">Secondary</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0 bg-slate-50">
      <Header user={user} onSetView={setCurrentView} activeView={currentView} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {currentView === 'dashboard' && (
          <Dashboard user={user} journalEntries={journalEntries} onStartLesson={() => setCurrentView('lessons')} />
        )}
        {currentView === 'lessons' && (
          <LessonLibrary grade={user.grade} />
        )}
        {currentView === 'journal' && (
          <LearningJournal onAddEntry={handleAddJournalEntry} entries={journalEntries} />
        )}
        {currentView === 'tutor' && (
          <ChatTutor />
        )}
        {currentView === 'periodic-table' && (
          <PeriodicTable />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden flex justify-around items-center p-3 z-50">
        <NavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard'} icon={<Home size={22} />} label="Home" />
        <NavButton active={currentView === 'lessons'} onClick={() => setCurrentView('lessons')} icon={<BookOpen size={22} />} label="Lessons" />
        <NavButton active={currentView === 'periodic-table'} onClick={() => setCurrentView('periodic-table')} icon={<Table size={22} />} label="Table" />
        <NavButton active={currentView === 'journal'} onClick={() => setCurrentView('journal')} icon={<PenTool size={22} />} label="Lab Notes" />
        <NavButton active={currentView === 'tutor'} onClick={() => setCurrentView('tutor')} icon={<MessageCircle size={22} />} label="Assistant" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-blue-600' : 'text-gray-400'}`}>
    {icon}
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default App;
