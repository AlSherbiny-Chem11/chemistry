
import React, { useState } from 'react';
import { GradeLevel, ChemistryBranch, Lesson } from '../types';
import { INITIAL_LESSONS, BRANCH_COLORS } from '../constants';
import { generateLessonContent } from '../services/geminiService';
import { Search, Sparkles, X, BookOpen, Loader2, Beaker } from 'lucide-react';

interface LessonLibraryProps {
  grade: GradeLevel;
}

const LessonLibrary: React.FC<LessonLibraryProps> = ({ grade }) => {
  const [selectedBranch, setSelectedBranch] = useState<ChemistryBranch | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const branches: (ChemistryBranch | 'All')[] = ['All', ...Object.values(ChemistryBranch)];

  const filteredLessons = INITIAL_LESSONS.filter(l => 
    (selectedBranch === 'All' || l.branch === selectedBranch) &&
    (l.grade === grade) &&
    (l.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setAiGeneratedContent(null);
  };

  const handleGenerateAI = async () => {
    if (!activeLesson) return;
    setIsLoading(true);
    try {
      const content = await generateLessonContent(activeLesson.title, activeLesson.grade, activeLesson.branch);
      setAiGeneratedContent(content);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 mb-2">Curriculum Library</h2>
          <p className="text-slate-500 font-medium">Selected Level: <span className="text-blue-600 font-bold">{grade}</span></p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search chemical topics..." 
            className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] w-full md:w-80 focus:ring-4 focus:ring-blue-50 outline-none shadow-sm transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {branches.map(br => (
          <button
            key={br}
            onClick={() => setSelectedBranch(br)}
            className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all border text-sm ${
              selectedBranch === br 
                ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105' 
                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
            }`}
          >
            {br}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLessons.map(lesson => (
          <div 
            key={lesson.id} 
            onClick={() => handleOpenLesson(lesson)}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 cursor-pointer hover:shadow-2xl hover:translate-y-[-8px] transition-all group relative overflow-hidden"
          >
            <div className={`w-16 h-16 rounded-[1.5rem] mb-6 flex items-center justify-center text-3xl transition-all group-hover:rotate-12 ${BRANCH_COLORS[lesson.branch]}`}>
              {lesson.icon}
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-3 inline-block border ${BRANCH_COLORS[lesson.branch]}`}>
                {lesson.branch}
              </span>
              <h4 className="text-2xl font-black text-slate-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{lesson.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-2 font-medium">{lesson.summary}</p>
            </div>
            <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
              Study Chapter <BookOpen size={16} />
            </div>
            <div className="absolute -bottom-10 -right-10 text-9xl text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
               {lesson.icon}
            </div>
          </div>
        ))}
        {filteredLessons.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
             <div className="text-6xl mb-4">🔬</div>
             <p className="text-slate-400 font-black">No chapters found for this criteria.</p>
             <p className="text-slate-300 text-sm">Try exploring another branch of chemistry!</p>
          </div>
        )}
      </div>

      {activeLesson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 border border-white">
            <div className="p-10 pb-6 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${BRANCH_COLORS[activeLesson.branch]}`}>
                  {activeLesson.icon}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800">{activeLesson.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">{activeLesson.grade}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{activeLesson.branch}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveLesson(null)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
                <X />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              {!aiGeneratedContent ? (
                <div className="space-y-8">
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 relative">
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                       📖
                    </div>
                    <p className="text-slate-700 text-xl leading-relaxed font-medium">
                      {activeLesson.content}
                    </p>
                  </div>
                  
                  <div className="bg-blue-600 rounded-[2.5rem] p-10 text-center text-white shadow-xl shadow-blue-200">
                    <div className="text-5xl mb-6">✨</div>
                    <h4 className="text-3xl font-black mb-4">Request Academy Resources</h4>
                    <p className="text-blue-100 mb-10 max-w-md mx-auto text-lg leading-relaxed">Professor El Sherbiny's AI Assistant can generate detailed formulas, safety precautions, and deep-dive analysis for this topic.</p>
                    <button 
                      onClick={handleGenerateAI}
                      disabled={isLoading}
                      className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-lg shadow-lg hover:shadow-2xl transition-all disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />}
                      {isLoading ? 'Synthesizing...' : 'Start Full AI Lesson'}
                    </button>
                  </div>
                </div>
              ) : (
                <article className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
                   <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 shadow-sm">
                      <div className="prose prose-slate max-w-none prose-headings:font-black prose-p:font-medium prose-p:text-slate-600 prose-p:leading-loose">
                        <div className="whitespace-pre-wrap text-slate-700 font-medium">
                          {aiGeneratedContent}
                        </div>
                      </div>
                   </div>
                   <div className="mt-10 bg-emerald-600 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-100 flex items-center gap-6 text-white">
                      <div className="text-5xl">✅</div>
                      <div>
                        <p className="text-2xl font-black mb-1">Excellent comprehension!</p>
                        <p className="text-emerald-100 font-bold">Scientific Achievement: "Young Chemist" unlocked! (+100 XP)</p>
                      </div>
                   </div>
                </article>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonLibrary;
