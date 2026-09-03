import React from 'react';
import { ShoppingBag, UserCheck, Car, Sparkles, Sliders, ShieldCheck } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: 'E-Commerce Product Photos',
      desc: 'Create clean white studio backdrops for Amazon, eBay, Shopify, and Etsy. Increase product conversion rates with professional cutouts.',
      icon: ShoppingBag,
      tag: 'E-Commerce',
    },
    {
      title: 'ID, Visa & Passport Photos',
      desc: 'One-click conversion into certified white, blue, or red backgrounds compliant with international embassy regulations.',
      icon: UserCheck,
      tag: 'Passports',
    },
    {
      title: 'Automotive & Car Sales',
      desc: 'Remove messy parking lots and showroom reflections. Place vehicles onto modern asphalt, showroom, or studio backdrops.',
      icon: Car,
      tag: 'Dealerships',
    },
    {
      title: 'DSLR Depth Blur Bokeh',
      desc: 'Simulate high-end f/1.4 camera lenses by keeping the subject in sharp focus while softly blurring the background with HTML5 canvas.',
      icon: Sliders,
      tag: 'Portraits',
    },
    {
      title: 'Pixel-Perfect Hair & Fur Cutout',
      desc: 'Advanced deep learning segmentation models isolate flyaway hair strands, fine animal fur, and complex transparent glassware.',
      icon: Sparkles,
      tag: 'AI Precision',
    },
    {
      title: 'Strict 5-Minute Auto-Purge',
      desc: 'Your photos are strictly yours. Server temporary files are automatically wiped after 5 minutes with zero data harvesting.',
      icon: ShieldCheck,
      tag: 'Cyber Security',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-white border-t border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            All-in-One Utility
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
            Designed for Creators, Sellers & Photographers
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Everything you need to produce studio-quality cutouts and custom backgrounds in record time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 hover:bg-white flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 font-['Outfit']">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                  <span>Included 100% Free</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

