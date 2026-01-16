'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, AlertTriangle, X, Activity, Info, Pill, Stethoscope, Microscope, CheckCircle } from 'lucide-react';
import { SafetyReport } from '@/lib/types';

// Extended Medicine type with image_url
interface DBMedicine {
  id: number;
  trade_name: string;
  active_ingredient: string;
  dosage: string;
  contraindications: string;
  price: number;
  image_url?: string;
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

    // Simulate AI Processing
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock User Profile for strict checking
      const mockUserProfile = {
        conditions: ['Diabetes', 'Hypertension', 'Asthma'], // Arabic mapping: السكري, ارتفاع ضغط الدم, الربو
        allergies: ['Penicillin', 'Sulfa'] // Arabic mapping: البنسلين, السلفا
      };

      const warnings: string[] = [];
      let isSafe = true;

      // Active Ingredient Analysis (Simple inclusions check)
      const ingredients = selectedMedicine.active_ingredient.toLowerCase();

      // Check for Allergy: Penicillin
      if (mockUserProfile.allergies.includes('Penicillin') &&
        (ingredients.includes('penicillin') || ingredients.includes('amoxicillin'))) {
        warnings.push('تحذير: يحتوي هذا الدواء على مشتقات البنسلين التي تعاني من حساسية تجاهها.');
        isSafe = false;
      }

      // Check for Chronic Conditions
      // 1. Hypertension (Avoid NSAIDs sometimes, or decongestants)
      if (mockUserProfile.conditions.includes('Hypertension')) {
        if (ingredients.includes('ibuprofen') || ingredients.includes('pseudoephedrine')) {
          warnings.push('تنبيه: قد لا يكون مناسباً لمرضى ارتفاع ضغط الدم.');
          isSafe = false;
        }
      }

      // 2. Diabetes (Avoid Sugar syrups - assumed generic warning for liquid forms or specific drugs)
      if (mockUserProfile.conditions.includes('Diabetes') && selectedMedicine.dosage.includes('Syrup')) {
        warnings.push('تنبيه: الشراب قد يحتوي على السكر، يرجى الحذر لمرضى السكري.');
        isSafe = true; // Warning only
      }

      // 3. Asthma (Avoid Aspirin/NSAIDs)
      if (mockUserProfile.conditions.includes('Asthma')) {
        if (ingredients.includes('aspirin') || ingredients.includes('ibuprofen') || ingredients.includes('diclofenac')) {
          warnings.push('خطر: قد يسبب نوبات ربو لدى المصابين بالربو.');
          isSafe = false;
        }
      }

      // Check strict contraindications text from DB
      const contraText = selectedMedicine.contraindications ? selectedMedicine.contraindications.toLowerCase() : '';
      if (contraText.includes('pressure') || contraText.includes('ضغط')) {
        if (mockUserProfile.conditions.includes('Hypertension')) {
          warnings.push('موانع الاستعمال: مذكور صراحة أنه يمنع لمرضى الضغط.');
          isSafe = false;
        }
      }

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white selection:bg-medical-teal/30 font-sans" dir="rtl">

      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-l from-white to-slate-400">
              فارما<span className="text-medical-teal">توين</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="relative group">
              <input
                type="text"
                placeholder="ابحث عن دواء..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 pl-4 py-2 bg-slate-900/50 border border-slate-700 rounded-full w-64 focus:w-80 transition-all focus:outline-none focus:border-medical-teal focus:ring-1 focus:ring-medical-teal/50 text-sm text-right"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-medical-teal transition-colors" />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-medical-teal text-xs font-bold mb-6">
              <Microscope className="w-3 h-3" />
              تحليل صيدلاني مدعوم بالذكاء الاصطناعي
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
              صيدلية المستقبل <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-400 to-emerald-500">
                بين يديك
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              قاعدة بيانات عالمية للمستحضرات الصيدلانية.
              تحقق فوري من السلامة الدوائية استناداً إلى توأبك الرقمي.
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
            <h3 className="text-xl font-bold text-rose-400 mb-2">خطأ في النظام</h3>
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
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 overflow-hidden group-hover:scale-105 transition-transform shadow-inner">
                      {med.image_url ? (
                        <img src={med.image_url} alt={med.trade_name} className="w-full h-full object-cover" />
                      ) : (
                        <Pill className="w-8 h-8 text-medical-teal/50" />
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-950/50 border border-white/10 text-emerald-400 font-mono font-bold dir-ltr">
                      ${med.price}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-2 group-hover:text-medical-teal transition-colors text-right">
                    {med.trade_name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2 text-right">
                    {med.active_ingredient}
                  </p>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>{med.dosage}</span>
                    <span className="group-hover:-translate-x-1 transition-transform flex items-center gap-1">
                      التفاصيل &larr;
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto relative text-right"
              >
                {/* Modal Header */}
                <div className="relative h-48 bg-gradient-to-l from-teal-900/40 to-slate-900 flex flex-col justify-end p-8">
                  <div className="absolute top-4 left-4">
                    <button onClick={closeModal} className="p-2 rounded-full bg-black/20 hover:bg-white/10 text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <h2 className="text-4xl font-bold filter drop-shadow-lg mb-2">{selectedMedicine.trade_name}</h2>
                  <p className="text-teal-200/80 font-medium flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    {selectedMedicine.active_ingredient}
                  </p>
                </div>

                {/* Modal Body */}
                <div className="p-8">
                  <div className="grid grid-cols-2 gap-8 mb-8 border-b border-white/5 pb-8">
                    <div>
                      <h4 className="text-xs text-slate-500 font-bold mb-2">الجرعة / الشكل الصيدلاني</h4>
                      <p className="text-slate-200 text-lg">{selectedMedicine.dosage}</p>
                    </div>
                    <div>
                      <h4 className="text-xs text-slate-500 font-bold mb-2">السعر</h4>
                      <p className="text-emerald-400 text-lg font-mono" dir="ltr">${selectedMedicine.price}</p>
                    </div>
                    <div className="col-span-2">
                      <h4 className="text-xs text-slate-500 font-bold mb-2">موانع الاستعمال المعروفة</h4>
                      <p className="text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-white/5 text-sm">
                        {selectedMedicine.contraindications || "لا توجد موانع معروفة."}
                      </p>
                    </div>
                  </div>

                  {/* AI Safety Check Section */}
                  <div>
                    {!safetyResult && !checkingSafety && (
                      <div className="flex flex-col items-center justify-center text-center py-2">
                        <Stethoscope className="w-10 h-10 text-slate-600 mb-3" />
                        <h3 className="text-xl font-bold mb-2">التحليل الطبي الذكي</h3>
                        <p className="text-slate-400 mb-6 max-w-md text-sm">
                          تحقق فوري من سلامة الدواء وملاءمته لملفك الصحي (الحساسية والأمراض المزمنة).
                        </p>
                        <button
                          onClick={handleCheckSafety}
                          className="px-8 py-3 bg-medical-teal hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-5 h-5" />
                          افحص السلامة بالذكاء الاصطناعي
                        </button>
                      </div>
                    )}

                    {checkingSafety && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-12 h-12 border-4 border-medical-teal/30 border-t-medical-teal rounded-full animate-spin mb-4" />
                        <p className="text-medical-teal font-medium animate-pulse">جاري فحص البيانات البيولوجية...</p>
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
                            <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                              <CheckCircle className="w-6 h-6" />
                            </div>
                          ) : (
                            <div className="p-3 rounded-full bg-rose-500/20 text-rose-500 shrink-0">
                              <AlertTriangle className="w-6 h-6" />
                            </div>
                          )}

                          <div className="flex-1">
                            <h3 className={`text-xl font-bold mb-1 ${safetyResult.isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {safetyResult.isSafe ? 'آمن للاستخدام' : 'تحذير طبي عالي الخطورة'}
                            </h3>
                            <p className="text-slate-300 text-sm mb-4">
                              {safetyResult.isSafe
                                ? "لم يتم العثور على تعارضات مع ملفك الصحي."
                                : "تم اكتشاف تعارضات صحية محتملة بناءً على ملفك الطبي."
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
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[150px]" />
      </div>

    </div>
  );
}
