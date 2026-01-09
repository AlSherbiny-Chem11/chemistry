
import React from 'react';
import { User, JournalEntry } from '../types';
import { Microscope, Beaker, Atom, FlaskConical, ArrowRight } from 'lucide-react';

interface DashboardProps {
  user: User;
  journalEntries: JournalEntry[];
  onStartLesson: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, journalEntries, onStartLesson }) => {
  const recentEntries = journalEntries.slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10">
          <div className="inline-block bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-blue-500/30">
            Welcome, Future Scientist
          </div>
          <h2 className="text-4xl font-black mb-4 leading-tight">Welcome back,<br />{user.name}! 👨‍🔬</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-md">Professor Mohamed El Sherbiny is proud of your progress in <span className="text-white font-bold">{user.grade}</span>. Ready to experiment?</p>
          <button 
            onClick={onStartLesson}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40"
          >
            Open Lesson Library <ArrowRight size={20} />
          </button>
        </div>
        <div className="absolute top-[-20px] right-[-20px] text-[15rem] text-blue-500/10 rotate-12 select-none">
          🧪
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard icon={<Atom className="text-purple-600" />} label="Elements Mastered" value="18" color="bg-purple-50" />
        <StatsCard icon={<Beaker className="text-emerald-600" />} label="Experiments Done" value="42" color="bg-emerald-50" />
        <StatsCard icon={<Microscope className="text-blue-600" />} label="Academy XP" value={user.points.toString()} color="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black text-slate-800">Lab Journal History</h3>
            <button className="text-blue-600 font-bold text-sm hover:underline">View All Entries</button>
          </div>
          
          <div className="space-y-4">
            {recentEntries.length > 0 ? (
              recentEntries.map(entry => (
                <div key={entry.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-5 hover:border-blue-200 transition-colors">
                  <div className="flex-shrink-0 w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">
                    🗒️
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-xs font-black text-slate-400 uppercase">{new Date(entry.date).toLocaleDateString()}</span>
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       <span className="text-[10px] font-black text-blue-500 uppercase">{entry.branch}</span>
                    </div>
                    <p className="text-slate-700 font-medium line-clamp-2 italic">"{entry.content}"</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                <div className="text-5xl mb-4 opacity-40">🔬</div>
                <p className="text-slate-400 font-black">No experiment notes yet.</p>
                <p className="text-slate-300 text-sm">Every reaction counts! Start writing today.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-6">Course Milestone</h3>
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
               <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Inorganic Unit</span>
                  <span className="text-lg font-black text-blue-600">65%</span>
               </div>
               <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 w-[65%] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]"></div>
               </div>
            </div>

            <div className="space-y-4">
               <Milestone label="Introduction to Acids" completed />
               <Milestone label="Bases and pH Scale" completed />
               <Milestone label="Salt Formation" />
               <Milestone label="Neutralization Reactions" locked />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
    <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-2xl`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const Milestone = ({ label, completed, locked }: { label: string, completed?: boolean, locked?: boolean }) => (
  <div className={`flex items-center gap-4 ${locked ? 'opacity-30' : ''}`}>
    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${completed ? 'bg-emerald-500' : 'bg-slate-200'}`}>
       {completed && <span className="text-white text-[10px] font-bold">✓</span>}
    </div>
    <span className={`text-sm font-black ${completed ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
  </div>
);

export default Dashboard;
