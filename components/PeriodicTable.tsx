
import React, { useState } from 'react';
import { X, Info, Zap, Atom } from 'lucide-react';

interface Element {
  number: number;
  symbol: string;
  name: string;
  weight: number;
  category: string;
  x: number;
  y: number;
  phase: string;
  summary: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'reactive nonmetal': 'bg-emerald-500 text-white',
  'noble gas': 'bg-purple-500 text-white',
  'alkali metal': 'bg-red-500 text-white',
  'alkaline earth metal': 'bg-orange-500 text-white',
  'metalloid': 'bg-teal-500 text-white',
  'post-transition metal': 'bg-sky-500 text-white',
  'transition metal': 'bg-pink-500 text-white',
  'lanthanide': 'bg-indigo-400 text-white',
  'actinide': 'bg-rose-400 text-white',
  'halogen': 'bg-yellow-500 text-white',
};

const ELEMENTS: Element[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', weight: 1.008, category: 'reactive nonmetal', x: 1, y: 1, phase: 'Gas', summary: 'Hydrogen is the chemical element with the symbol H and atomic number 1.' },
  { number: 2, symbol: 'He', name: 'Helium', weight: 4.0026, category: 'noble gas', x: 18, y: 1, phase: 'Gas', summary: 'Helium is a chemical element with symbol He and atomic number 2.' },
  { number: 3, symbol: 'Li', name: 'Lithium', weight: 6.94, category: 'alkali metal', x: 1, y: 2, phase: 'Solid', summary: 'Lithium is a chemical element with symbol Li and atomic number 3.' },
  { number: 4, symbol: 'Be', name: 'Beryllium', weight: 9.0122, category: 'alkaline earth metal', x: 2, y: 2, phase: 'Solid', summary: 'Beryllium is a chemical element with symbol Be and atomic number 4.' },
  { number: 5, symbol: 'B', name: 'Boron', weight: 10.81, category: 'metalloid', x: 13, y: 2, phase: 'Solid', summary: 'Boron is a chemical element with symbol B and atomic number 5.' },
  { number: 6, symbol: 'C', name: 'Carbon', weight: 12.011, category: 'reactive nonmetal', x: 14, y: 2, phase: 'Solid', summary: 'Carbon is a chemical element with symbol C and atomic number 6.' },
  { number: 7, symbol: 'N', name: 'Nitrogen', weight: 14.007, category: 'reactive nonmetal', x: 15, y: 2, phase: 'Gas', summary: 'Nitrogen is a chemical element with symbol N and atomic number 7.' },
  { number: 8, symbol: 'O', name: 'Oxygen', weight: 15.999, category: 'reactive nonmetal', x: 16, y: 2, phase: 'Gas', summary: 'Oxygen is a chemical element with symbol O and atomic number 8.' },
  { number: 9, symbol: 'F', name: 'Fluorine', weight: 18.998, category: 'halogen', x: 17, y: 2, phase: 'Gas', summary: 'Fluorine is a chemical element with symbol F and atomic number 9.' },
  { number: 10, symbol: 'Ne', name: 'Neon', weight: 20.180, category: 'noble gas', x: 18, y: 2, phase: 'Gas', summary: 'Neon is a chemical element with symbol Ne and atomic number 10.' },
  { number: 11, symbol: 'Na', name: 'Sodium', weight: 22.990, category: 'alkali metal', x: 1, y: 3, phase: 'Solid', summary: 'Sodium is a chemical element with symbol Na and atomic number 11.' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', weight: 24.305, category: 'alkaline earth metal', x: 2, y: 3, phase: 'Solid', summary: 'Magnesium is a chemical element with symbol Mg and atomic number 12.' },
  { number: 13, symbol: 'Al', name: 'Aluminium', weight: 26.982, category: 'post-transition metal', x: 13, y: 3, phase: 'Solid', summary: 'Aluminium is a chemical element with symbol Al and atomic number 13.' },
  { number: 14, symbol: 'Si', name: 'Silicon', weight: 28.085, category: 'metalloid', x: 14, y: 3, phase: 'Solid', summary: 'Silicon is a chemical element with symbol Si and atomic number 14.' },
  { number: 15, symbol: 'P', name: 'Phosphorus', weight: 30.974, category: 'reactive nonmetal', x: 15, y: 3, phase: 'Solid', summary: 'Phosphorus is a chemical element with symbol P and atomic number 15.' },
  { number: 16, symbol: 'S', name: 'Sulfur', weight: 32.06, category: 'reactive nonmetal', x: 16, y: 3, phase: 'Solid', summary: 'Sulfur is a chemical element with symbol S and atomic number 16.' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', weight: 35.45, category: 'halogen', x: 17, y: 3, phase: 'Gas', summary: 'Chlorine is a chemical element with symbol Cl and atomic number 17.' },
  { number: 18, symbol: 'Ar', name: 'Argon', weight: 39.948, category: 'noble gas', x: 18, y: 3, phase: 'Gas', summary: 'Argon is a chemical element with symbol Ar and atomic number 18.' },
  { number: 20, symbol: 'Ca', name: 'Calcium', weight: 40.078, category: 'alkaline earth metal', x: 2, y: 4, phase: 'Solid', summary: 'Calcium is a chemical element with symbol Ca and atomic number 20.' },
  { number: 26, symbol: 'Fe', name: 'Iron', weight: 55.845, category: 'transition metal', x: 8, y: 4, phase: 'Solid', summary: 'Iron is a chemical element with symbol Fe and atomic number 26.' },
  { number: 29, symbol: 'Cu', name: 'Copper', weight: 63.546, category: 'transition metal', x: 11, y: 4, phase: 'Solid', summary: 'Copper is a chemical element with symbol Cu and atomic number 29.' },
  { number: 79, symbol: 'Au', name: 'Gold', weight: 196.97, category: 'transition metal', x: 11, y: 6, phase: 'Solid', summary: 'Gold is a chemical element with symbol Au and atomic number 79.' },
  { number: 80, symbol: 'Hg', name: 'Mercury', weight: 200.59, category: 'transition metal', x: 12, y: 6, phase: 'Liquid', summary: 'Mercury is a chemical element with symbol Hg and atomic number 80.' },
  { number: 92, symbol: 'U', name: 'Uranium', weight: 238.03, category: 'actinide', x: 6, y: 9, phase: 'Solid', summary: 'Uranium is a chemical element with symbol U and atomic number 92.' },
];

const PeriodicTable: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 mb-2">Periodic Table</h2>
          <p className="text-slate-500 font-medium">Explore the building blocks of the universe.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase">Metals</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase">Non-metals</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[3rem] shadow-xl border border-slate-100 overflow-x-auto">
        <div className="min-w-[1000px] grid grid-cols-18 gap-1 p-4 bg-slate-50 rounded-2xl relative">
          {ELEMENTS.map((el) => (
            <div
              key={el.number}
              onClick={() => setSelectedElement(el)}
              style={{ gridColumn: el.x, gridRow: el.y }}
              className={`aspect-square p-1 rounded-lg border border-white shadow-sm cursor-pointer transition-all hover:scale-110 hover:z-10 flex flex-col items-center justify-center relative group ${CATEGORY_COLORS[el.category] || 'bg-slate-200 text-slate-500'}`}
            >
              <span className="absolute top-0.5 left-1 text-[8px] font-black opacity-80">{el.number}</span>
              <span className="text-lg font-black">{el.symbol}</span>
              <span className="text-[6px] font-bold uppercase tracking-tighter truncate w-full text-center">{el.name}</span>
            </div>
          ))}

          {/* Spacer items to maintain grid structure for empty cells */}
          {/* In a real production app, we would dynamically generate all 118 or placeholders */}
        </div>
      </div>

      {/* Detail Card / Modal */}
      {selectedElement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className={`p-10 ${CATEGORY_COLORS[selectedElement.category]} relative overflow-hidden`}>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30">
                    <span className="text-5xl font-black text-white">{selectedElement.symbol}</span>
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-white">{selectedElement.name}</h3>
                    <p className="text-white/80 font-bold uppercase tracking-widest text-sm">{selectedElement.category}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedElement(null)} className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all text-white">
                  <X />
                </button>
              </div>
              <div className="absolute top-[-20%] right-[-10%] text-[15rem] text-white/10 font-black pointer-events-none select-none">
                {selectedElement.number}
              </div>
            </div>

            <div className="p-10 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <Atom size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atomic Weight</p>
                    <p className="text-xl font-black text-slate-800">{selectedElement.weight} u</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Natural Phase</p>
                    <p className="text-xl font-black text-slate-800">{selectedElement.phase}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <Info size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atomic Number</p>
                    <p className="text-xl font-black text-slate-800">{selectedElement.number}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Summary</h4>
                <p className="text-slate-600 font-medium leading-relaxed">
                  {selectedElement.summary}
                </p>
                <button className="mt-6 w-full py-3 bg-white border border-slate-200 rounded-xl font-black text-xs text-blue-600 uppercase hover:bg-blue-50 transition-all">
                  Full Encyclopedia Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodicTable;
