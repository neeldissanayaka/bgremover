import React from 'react';
import { PASSPORT_PRESETS } from '../data/samples';
import { Check, FileBadge } from 'lucide-react';
import { motion } from 'motion/react';

interface PassportSectionProps {
  onSelectPreset?: (hex: string) => void;
}

export const PassportSection: React.FC<PassportSectionProps> = () => {
  return (
    <section id="passport-presets" className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6"
          >
            <span className="px-3.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <FileBadge className="w-3.5 h-3.5" />
              Official ID Standards
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-slate-900 leading-tight">
              Create Compliant Passport & Visa Photos in Seconds
            </h2>

            <p className="text-slate-600 text-base leading-relaxed">
              Never pay $20+ at pharmacy photo booths again. Take a selfie against any messy wall, remove the clutter with bgremover.art, and apply certified white, blue, or red passport backdrop colors instantly.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">ICAO & US State Department Specs</h4>
                  <p className="text-xs text-slate-500">Pure white (255, 255, 255) compliant for US passport & Schengen visas.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Asian & Middle Eastern ID Blue / Red</h4>
                  <p className="text-xs text-slate-500">Standard deep blue and red backdrops for Malaysia, Indonesia, Singapore & Philippines.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Lossless 300 DPI Export</h4>
                  <p className="text-xs text-slate-500">Crystal-clear print resolution suitable for 2x2 inch and 35x45mm prints.</p>
                </div>
              </div>
            </div>

          </motion.div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PASSPORT_PRESETS.map((preset, idx) => (
                <motion.div
                  key={preset.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -3 }}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-xl border border-slate-300 shadow-inner"
                        style={{ backgroundColor: preset.hexColor }}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{preset.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">
                          {preset.hexColor}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {preset.description}
                  </p>
                  <div className="pt-2 border-t border-slate-100 text-[11px] font-medium text-blue-600">
                    Used in: <span className="text-slate-700">{preset.country}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

