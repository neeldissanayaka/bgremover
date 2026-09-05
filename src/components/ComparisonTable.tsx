import React from 'react';
import { Check, Sparkles } from 'lucide-react';

export const ComparisonTable: React.FC = () => {
  const comparisonRows = [
    {
      feature: 'Pricing & Cost',
      bgremover: '100% Free (3 free/day)',
      removeBg: '$0.20 to $1.99 per image',
      canva: '$12.99 / month Pro subscription',
    },
    {
      feature: 'Full Resolution HD Downloads',
      bgremover: 'Yes (Up to 2048px+)',
      removeBg: 'Paid credits required for HD',
      canva: 'Paid subscription required',
    },
    {
      feature: 'Watermarks on Output',
      bgremover: 'Zero Watermarks',
      removeBg: 'Zero on paid / Low res on free',
      canva: 'Zero on Pro only',
    },
    {
      feature: 'Account Registration / Login',
      bgremover: 'No Sign-Up Required',
      removeBg: 'Email required for credits',
      canva: 'Mandatory registration',
    },
    {
      feature: 'Official Passport Color Presets',
      bgremover: 'Built-in (White, Blue, Red)',
      removeBg: 'Manual hex code entry only',
      canva: 'Manual color selector only',
    },
    {
      feature: 'Background Blur Bokeh Radius',
      bgremover: 'Built-in Canvas Slider',
      removeBg: 'Fixed presets only',
      canva: 'Complex multi-step tool',
    },
    {
      feature: 'Privacy & Automatic File Purge',
      bgremover: '5-Minute Auto Deletion',
      removeBg: 'Varies by terms',
      canva: 'Saved to cloud library',
    },
  ];

  return (
    <section id="comparison" className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="px-3.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Clear Comparison
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
            Why Choose bgremover.art vs Paid Services?
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            No credit cards, no monthly subscription traps, and no watermarks.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="p-4 sm:p-6 text-sm font-bold text-slate-800 w-1/4">
                    Features & Capabilities
                  </th>
                  <th className="p-4 sm:p-6 text-sm font-bold text-blue-600 bg-blue-50/50 w-1/4 border-x border-blue-100">
                    <div className="flex items-center gap-1.5 font-['Outfit'] text-base">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      bgremover.art
                    </div>
                    <span className="text-[11px] font-normal text-blue-700">100% Free Utility</span>
                  </th>
                  <th className="p-4 sm:p-6 text-sm font-bold text-slate-700 w-1/4">
                    Remove.bg
                  </th>
                  <th className="p-4 sm:p-6 text-sm font-bold text-slate-700 w-1/4">
                    Canva Pro / Photoshop
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}
                  >
                    <td className="p-4 sm:p-5 font-bold text-slate-900">
                      {row.feature}
                    </td>
                    <td className="p-4 sm:p-5 font-bold text-blue-700 bg-blue-50/30 border-x border-blue-100 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{row.bgremover}</span>
                    </td>
                    <td className="p-4 sm:p-5 text-slate-600">
                      {row.removeBg}
                    </td>
                    <td className="p-4 sm:p-5 text-slate-600">
                      {row.canva}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};

