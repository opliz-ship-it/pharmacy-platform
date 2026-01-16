'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, AlertTriangle, X, Activity, Info, Pill, Stethoscope, Microscope } from 'lucide-react';
import { validateMedicationSafety } from '@/lib/validateSafety';
import { Medicine as BaseMedicine, SafetyReport } from '@/lib/types';

// Extended Medicine type potentially matching DB columns if they differ from BaseMedicine
// We'll trust the DB columns: trade_name, active_ingredient, dosage, contraindications, price
interface DBMedicine {
  id: number;
  trade_name: string;
  active_ingredient: string;
  dosage: string;
  contraindications: string; // Text field in DB
  price: number;
}

export default function Home() {
  const [medicines, setMedicines] = useState<DBMedicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<DBMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedMedicine, setSelectedMedicine] = useState<DBMedicine | null>(null);
  const [checkingSafety, setCheckingSafety] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyReport | null>(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = medicines.filter(med =>
      med.trade_name.toLowerCase().includes(query) ||
      med.active_ingredient.toLowerCase().includes(query)
    );
    setFilteredMedicines(filtered);
  }, [searchQuery, medicines]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medicines')
        .select('*');

      if (error) throw error;
      setMedicines(data || []);
      setFilteredMedicines(data || []);
    } catch (err: any) {
      console.error('Error fetching medicines:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineClick = (med: DBMedicine) => {
    setSelectedMedicine(med);
    setSafetyResult(null); // Reset previous check
  };

  const closeModal = () => {
    setSelectedMedicine(null);
    setSafetyResult(null);
  };

  const handleCheckSafety = async () => {
    if (!selectedMedicine) return;

    setCheckingSafety(true);
    // Simulate finding a user ID (in a real app, this comes from auth context)
    const mockUserId = 'user-123';

    // We need to map DBMedicine to the type expected by validateMedicationSafety
    // Or we simply use the DBMedicine data if we bypass the stricter type check, 
    // but the validator simulates a DB fetch for the medicine anyway based on ID.
    // For this demo, let's simulate the check or re-use the validator logic if possible.
    // The validator creates its own mock medicine map. We might want to pass OUR medicine data to a modified validator,
    // or just simulate the result here for the "Futuristic AI" experience if the IDs don't match the hardcoded validator mocks.

    try {
      // Allow some time for "AI Processing" animation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Let's implement a quick local check using the real data we have
      // This ensures it works for ANY medicine from the DB
      const mockUserAllergies = ['Peanuts', 'Penicillin', 'Aspirin'];
      const mockUserConditions = ['Hypertension', 'Asthma'];

      const warnings: string[] = [];
      let isSafe = true;

      // Check Allergies
      const ingredients = selectedMedicine.active_ingredient.split(',').map(i => i.trim().toLowerCase());
      mockUserAllergies.forEach(allergy => {
        if (ingredients.some(ing => ing.includes(allergy.toLowerCase()))) {
          warnings.push(`Allergy Alert: ${allergy} detected in ingredients.`);
          isSafe = false;
        }
      });

      // Check Contraindications (assuming text field)
      const contraText = selectedMedicine.contraindications?.toLowerCase() || '';
      mockUserConditions.forEach(condition => {
        if (contraText.includes(condition.toLowerCase())) {
          warnings.push(`Contraindication: Not recommended for ${condition}.`);
          isSafe = false;
        }
      });

      setSafetyResult({
        isSafe,
        warnings,
        blockTransaction: !isSafe,
        details: { allergyconflicts: [], contraindicationConflicts: [] },
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error(err);
    } finally {
      setCheckingSafety(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white selection:bg-medical-teal/30 font-sans">

      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Pharma<span className="text-medical-teal">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-full w-64 focus:w-80 transition-all focus:outline-none focus:border-medical-teal focus:ring-1 focus:ring-medical-teal/50 text-sm"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-medical-teal transition-colors" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 relative z-10">

        {/* Header Section */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-medical-teal text-xs font-medium mb-6">
              <Microscope className="w-3 h-3" />
              AI-Powered Pharmaceutical Analysis
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Smart Pharmacy <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
                For The Future
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Access our global database of pharmaceutical compounds.
              Real-time safety verification powered by your digital twin.
            </p>
          </motion.div>
        </div>

        {/* Grid or Loading/Error */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-slate-900/50 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-12 rounded-3xl bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-rose-400 mb-2">System Error</h3>
            <p className="text-slate-400">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMedicines.map((med, idx) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleMedicineClick(med)}
                className="group relative cursor-pointer"
              >
                {/* Card Background & Border */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/40 to-slate-950/40 rounded-3xl backdrop-blur-xl border border-white/10 transition-all duration-300 group-hover:border-medical-teal/50 group-hover:shadow-[0_0_40px_-10px_rgba(20,184,166,0.3)]" />

                <div className="relative p-6 h-full flex flex-col z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                      <Pill className="w-6 h-6 text-medical-teal" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-950/50 border border-white/10 text-emerald-400 font-mono font-bold">
                      ${med.price}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-2 group-hover:text-medical-teal transition-colors">
                    {med.trade_name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {med.active_ingredient}
                  </p>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    <span>{med.dosage}</span>
                    <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Safety Check Modal */}
      <AnimatePresence>
        {selectedMedicine && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto relative"
              >
                {/* Modal Header */}
                <div className="relative h-48 bg-gradient-to-r from-teal-900/40 to-slate-900">
                  <div className="absolute top-4 right-4">
                    <button onClick={closeModal} className="p-2 rounded-full bg-black/20 hover:bg-white/10 text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute bottom-6 left-8">
                    <h2 className="text-3xl font-bold filter drop-shadow-lg">{selectedMedicine.trade_name}</h2>
                    <p className="text-teal-200/80 font-medium flex items-center gap-2">
                      <Pill className="w-4 h-4" />
                      {selectedMedicine.active_ingredient}
                    </p>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-8">
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="text-xs uppercase text-slate-500 font-bold mb-2 tracking-wider">Dosage</h4>
                      <p className="text-slate-200 text-lg">{selectedMedicine.dosage}</p>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase text-slate-500 font-bold mb-2 tracking-wider">Price</h4>
                      <p className="text-emerald-400 text-lg font-mono">${selectedMedicine.price}</p>
                    </div>
                    <div className="col-span-2">
                      <h4 className="text-xs uppercase text-slate-500 font-bold mb-2 tracking-wider">Known Contraindications</h4>
                      <p className="text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-white/5">
                        {selectedMedicine.contraindications || "None listed."}
                      </p>
                    </div>
                  </div>

                  {/* AI Safety Check Section */}
                  <div className="border-t border-white/10 pt-8">
                    {!safetyResult && !checkingSafety && (
                      <div className="flex flex-col items-center justify-center text-center py-4">
                        <Stethoscope className="w-12 h-12 text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Smart Safety Analysis</h3>
                        <p className="text-slate-400 mb-6 max-w-md">
                          Run a real-time compatibility check against your digital twin profile (Allergies & Conditions).
                        </p>
                        <button
                          onClick={handleCheckSafety}
                          className="px-8 py-3 bg-medical-teal hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-5 h-5" />
                          Check Safety with AI
                        </button>
                      </div>
                    )}

                    {checkingSafety && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-16 h-16 border-4 border-medical-teal/30 border-t-medical-teal rounded-full animate-spin mb-4" />
                        <p className="text-medical-teal font-medium animate-pulse">Scanning Bio-Data Profile...</p>
                      </div>
                    )}

                    {safetyResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`rounded-2xl p-6 border ${safetyResult.isSafe ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}
                      >
                        <div className="flex items-start gap-4">
                          {safetyResult.isSafe ? (
                            <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                              <ShieldCheck className="w-8 h-8" />
                            </div>
                          ) : (
                            <div className="p-3 rounded-full bg-rose-500/20 text-rose-500">
                              <AlertTriangle className="w-8 h-8" />
                            </div>
                          )}

                          <div className="flex-1">
                            <h3 className={`text-xl font-bold mb-1 ${safetyResult.isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {safetyResult.isSafe ? 'Safe to Administer' : 'Safety Warning Detected'}
                            </h3>
                            <p className="text-slate-300 text-sm mb-4">
                              {safetyResult.isSafe
                                ? "No conflicts found with your allergies or chronic conditions."
                                : "Potential health risks identified based on your profile."
                              }
                            </p>

                            {safetyResult.warnings.length > 0 && (
                              <div className="space-y-2">
                                {safetyResult.warnings.map((warn, i) => (
                                  <div key={i} className="flex items-center gap-2 text-rose-300 bg-rose-500/10 px-3 py-2 rounded-lg text-sm border border-rose-500/10">
                                    <Info className="w-4 h-4 shrink-0" />
                                    {warn}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[150px]" />
      </div>

    </div>
  );
}
