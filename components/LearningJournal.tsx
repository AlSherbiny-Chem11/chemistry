
import React, { useState } from 'react';
import { ChemistryBranch, JournalEntry } from '../types';
import { BRANCH_COLORS } from '../constants';
import { summarizeLearning } from '../services/geminiService';
import { Microscope, Send, Clock, Sparkles, Loader2, Calendar } from 'lucide-react';

interface LearningJournalProps {
  onAddEntry: (entry: JournalEntry) => void;
  entries: JournalEntry[];
}

const LearningJournal: React.FC<LearningJournalProps> = ({ onAddEntry, entries }) => {
  const [content, setContent] = useState('');
  const [branch, setBranch] = useState<ChemistryBranch>(ChemistryBranch.GENERAL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const summary = await summarizeLearning(content);
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        content,
        branch,
        aiSummary: summary
      };
      onAddEntry(newEntry);
      setContent('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500 pb-12">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Microscope size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800">Lab Observations</h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Personal Study Journal</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Experiment / Lesson Notes</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What did you observe in today's chemical reaction?"
                className="w-full h-56 p-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] focus:bg-white focus:border-blue-200 outline-none transition-all resize-none font-medium placeholder:text-slate-300"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Subject Category</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(ChemistryBranch).map(br => (
                  <button
                    key={br}
                    type="button"
                    onClick={() => setBranch(br)}
                    className={`px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border ${
                      branch === br 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                        : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {br}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-500 hover:shadow-2xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={22} />}
              {isSubmitting ? 'Analyzing...' : 'Log Entry +100 XP'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black text-slate-800">Your Lab Log</h2>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black">{entries.length}</span>
          </div>
        </div>

        <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200">
          {entries.length === 0 ? (
            <div className="bg-white p-16 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
              <div className="text-7xl mb-6 grayscale opacity-50">🧪</div>
              <p className="text-slate-400 font-black text-xl mb-2">The lab is quiet.</p>
              <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">Start logging your chemistry journey</p>
            </div>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all animate-in slide-in-from-right-8 duration-500 group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${BRANCH_COLORS[entry.branch]}`}>
                    {entry.branch}
                  </span>
                </div>
                
                <p className="text-slate-700 font-medium mb-8 leading-relaxed text-lg border-l-4 border-slate-100 pl-6 group-hover:border-blue-200 transition-colors italic">
                  "{entry.content}"
                </p>
                
                {entry.aiSummary && (
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative group-hover:bg-blue-50 transition-colors">
                    <Sparkles className="absolute -top-4 -right-4 text-amber-400 animate-pulse bg-white p-1.5 rounded-full shadow-sm" size={32} fill="currentColor" />
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                      Professor's Assistant Analysis
                    </p>
                    <p className="text-slate-800 text-sm font-bold leading-relaxed">
                      {entry.aiSummary}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningJournal;
