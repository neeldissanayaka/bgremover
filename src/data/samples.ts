import { SampleImage, PassportPreset, ScenicBackdrop } from '../types';

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-portrait',
    title: 'Model Portrait',
    category: 'portrait',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    originalUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    // High-resolution pre-rendered cutout for instant testing
    transparentUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    width: 1200,
    height: 1600,
  },
  {
    id: 'sample-product',
    title: 'E-commerce Sneaker',
    category: 'product',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
    originalUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
    transparentUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
    width: 1200,
    height: 800,
  },
  {
    id: 'sample-vehicle',
    title: 'Sports Car',
    category: 'vehicle',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=300&q=80',
    originalUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=85',
    transparentUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=85',
    width: 1200,
    height: 800,
  },
  {
    id: 'sample-pet',
    title: 'Cute Pet Dog',
    category: 'pet',
    thumbnailUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80',
    originalUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=85',
    transparentUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=85',
    width: 1200,
    height: 900,
  },
];

export const PASSPORT_PRESETS: PassportPreset[] = [
  {
    id: 'us-white',
    name: 'US & EU Official White',
    country: 'United States, Schengen, UK',
    hexColor: '#FFFFFF',
    description: 'Standard plain white background for US Passport, Visa, and European Schengen IDs.',
  },
  {
    id: 'passport-blue',
    name: 'Official Passport Blue',
    country: 'Malaysia, Philippines, Kuwait',
    hexColor: '#1E40AF',
    description: 'Standard deep blue backdrop used for official ID cards and national documents.',
  },
  {
    id: 'schengen-red',
    name: 'Passport Red',
    country: 'Indonesia, Japan, Singapore Pass',
    hexColor: '#DC2626',
    description: 'Vibrant red background compliant with specific Asian and Middle Eastern visa specs.',
  },
  {
    id: 'light-blue',
    name: 'Sky Blue ID',
    country: 'India Visa, Corporate Badges',
    hexColor: '#38BDF8',
    description: 'Crisp light cyan/blue shade popular for employee badges and student IDs.',
  },
  {
    id: 'neutral-grey',
    name: 'Neutral Studio Grey',
    country: 'Canada, Australia, New Zealand',
    hexColor: '#E2E8F0',
    description: 'Neutral soft light grey for non-glare biometric identification photos.',
  },
  {
    id: 'pro-black',
    name: 'Studio Matte Black',
    country: 'Portfolio, E-Commerce, Headshots',
    hexColor: '#0F172A',
    description: 'Ultra-modern studio dark background ideal for professional LinkedIn headshots.',
  },
];

export const SOLID_PALETTE = [
  '#FFFFFF',
  '#F8FAFC',
  '#E2E8F0',
  '#94A3B8',
  '#334155',
  '#0F172A',
  '#1E40AF',
  '#2563EB',
  '#38BDF8',
  '#059669',
  '#10B981',
  '#F59E0B',
  '#DC2626',
  '#E11D48',
  '#9333EA',
  '#4F46E5',
];

export const SCENIC_BACKDROPS: ScenicBackdrop[] = [
  {
    id: 'modern-office',
    name: 'Modern Office',
    category: 'Professional',
    previewUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=85',
  },
  {
    id: 'minimal-studio',
    name: 'Minimalist Studio',
    category: 'Studio',
    previewUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=85',
  },
  {
    id: 'sunset-gradient',
    name: 'Warm Sunset Glow',
    category: 'Creative',
    previewUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
  },
  {
    id: 'nature-bokeh',
    name: 'Lush Botanical Garden',
    category: 'Nature',
    previewUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=300&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1400&q=85',
  },
];
