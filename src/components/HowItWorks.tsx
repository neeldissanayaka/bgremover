import React from 'react';
import { Upload, Sparkles, Download, CheckCircle2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Upload or Paste Image',
      desc: 'Drag & drop any JPG, PNG, or WebP photo up to 10MB, paste from your clipboard with Ctrl+V, or import via web link.',
      icon: Upload,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      step: '02',
      title: 'AI Automatically Removes BG',
      desc: 'Our neural network isolates fine hair strands, products, and complex subjects in less than 5 seconds with zero manual lassoing.',
      icon: Sparkles,
      color: 'from-indigo-600 to-purple-600',
    },
    {
      step: '03',
      title: 'Edit Colors & Download HD',
      desc: 'Choose transparent checkerboard, apply official passport background colors, add DSLR blur bokeh, and export in full HD.',
      icon: Download,
      color: 'from-purple-600 to-pink-600',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white border-t border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
            How to Remove Backgrounds in 5 Seconds
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            No design skills or expensive Photoshop licenses required. bgremover.art runs 100% in your browser and on high-speed neural hardware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-slate-50 rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-3xl font-black font-['Outfit'] text-slate-300 group-hover:text-blue-600 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2.5 font-['Outfit']">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-1 text-xs font-bold text-blue-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Instant & 100% Free</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

