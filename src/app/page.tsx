'use client';

import { Search, Bell, Menu } from 'lucide-react';
import PulseDashboard from '@/components/ui/PulseDashboard';
import SmartProductCard from '@/components/ui/SmartProductCard';
import InteractiveAiChat from '@/components/ui/InteractiveAiChat';
import { Medicine } from '@/lib/types';

// Mock Data for Demo
const MOCK_MEDICINES = [
  {
    id: '1',
    brand_name: 'Panadol Extra',
    generic_name: 'Paracetamol + Caffeine',
    active_ingredients: ['Paracetamol', 'Caffeine'],
    dosage_form: 'Tablet',
    strength: '500mg',
    contraindications: [],
    price: 12.50,
    stock_quantity: 50,
    compatibilityScore: 98,
    isSafe: true
  },
  {
    id: '2',
    brand_name: 'Aspirin Cardio',
    generic_name: 'Acetylsalicylic Acid',
    active_ingredients: ['Aspirin'],
    dosage_form: 'Tablet',
    strength: '100mg',
    contraindications: ['Asthma'],
    price: 8.90,
    stock_quantity: 30,
    compatibilityScore: 45,
    isSafe: false
  },
  {
    id: '3',
    brand_name: 'Amoclan',
    generic_name: 'Amoxicillin + Clavulanic Acid',
    active_ingredients: ['Amoxicillin'],
    dosage_form: 'Tablet',
    strength: '1g',
    contraindications: [],
    price: 24.00,
    stock_quantity: 10,
    compatibilityScore: 12,
    isSafe: false // Allergy match
  }
] as (Medicine & { price: number; compatibilityScore: number; isSafe: boolean })[];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white selection:bg-medical-teal/30">

      {/* Navigation */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
              P
            </div>
            <span className="text-xl font-bold tracking-tight">Pharma<span className="text-medical-teal">Twin</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="text-white">Dashboard</a>
            <a href="#" className="hover:text-white transition-colors">Prescriptions</a>
            <a href="#" className="hover:text-white transition-colors">Consultations</a>
            <a href="#" className="hover:text-white transition-colors">History</a>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </button>
            <button className="md:hidden p-2 text-slate-400">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-tr from-indigo-500/20 to-teal-500/20" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Predicted Health & Safety
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Your digital twin analysis shows <span className="text-emerald-400 font-semibold">stable vitals</span>.
            We've filtered today's recommendations based on your real-time genetic and bio-data profile.
          </p>
        </div>

        {/* Pulse Dashboard */}
        <PulseDashboard />

        {/* Recommendations Grid */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <span className="w-1 h-8 rounded-full bg-medical-teal" />
            Personalized Recommendations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {MOCK_MEDICINES.map((med) => (
              <SmartProductCard
                key={med.id}
                medicine={med}
                compatibilityScore={med.compatibilityScore}
                isSafe={med.isSafe}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Floating Chat */}
      <InteractiveAiChat />

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-teal-600/5 blur-[120px]" />
      </div>

    </div>
  );
}
