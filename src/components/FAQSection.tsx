import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I remove the background from an image for free on bgremover.art?',
      a: 'Simply drag and drop your photo into the upload box on bgremover.art, click "Upload Image", or press Ctrl+V to paste from your clipboard. Our neural network will automatically detect the main subject, isolate edges, and eliminate the background within 5 seconds.',
    },
    {
      q: 'How does the daily limit system work?',
      a: 'To guarantee lightning-fast response times and prevent server overload, each unique visitor receives 5 free high-definition AI removals every 24 hours. The quota resets automatically at midnight.',
    },
    {
      q: 'Can I change my background to white or passport photo blue?',
      a: 'Yes! After removing the background, click on "Solid Color" in our built-in canvas editor. We provide instant presets for US/EU White, Official Passport Blue, Schengen Red, and Studio Grey, plus a custom color wheel for any background shade you desire.',
    },
    {
      q: 'Is my data secure and private?',
      a: 'Yes. We prioritize cybersecurity and user privacy. Uploaded and processed photos are temporarily stored strictly for generation and automatically purged permanently after 5 minutes. We never sell, store, or train models on your personal photos.',
    },
    {
      q: 'What image formats and file sizes are supported?',
      a: 'bgremover.art supports JPG, JPEG, PNG, and WebP image formats up to 10MB in size. High-resolution images are automatically optimized to deliver crystal-clear cutouts with fast processing speeds.',
    },
    {
      q: 'Can I download images in transparent PNG or WebP format?',
      a: 'Yes. You can export your processed cutout in either lossless transparent PNG (ideal for Photoshop and graphic design) or compressed high-quality WebP (optimized for web pages and e-commerce stores).',
    },
    {
      q: 'What subscription and pricing plans are available on bgremover.art?',
      a: 'We offer 4 flexible options: Pay-as-you-go (from $2.00 for 3 to 50 non-expiring credits), Lite ($4.99/mo for 40 monthly credits & no ads), Pro ($20.00/mo for 200 credits, Ultra-HD 4K & priority queue), and Unlimited Pass ($300/year for unlimited background removals with VIP priority).',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-white border-t border-slate-200/80 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 mb-14"
        >
          <span className="px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
            Got Questions? We’ve Got Answers.
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Learn more about bgremover.art, image formats, passport regulations, and security.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`rounded-2xl border transition-all duration-200 ${
                  isOpen
                    ? 'border-blue-200 bg-blue-50/20 shadow-sm'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                >
                  <span className="text-base font-bold text-slate-900">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-blue-600 text-white rotate-180'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="px-6 pb-6 pt-1 text-sm text-slate-600 leading-relaxed border-t border-blue-100/50"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

