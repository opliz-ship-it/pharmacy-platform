'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, AlertTriangle, X, Activity, Info, Pill, Stethoscope, Microscope, CheckCircle, Globe } from 'lucide-react';
import { SafetyReport } from '@/lib/types';

// Extended Medicine type with bilingual support
interface DBMedicine {
  id: number;
  trade_name: string; // Defaults to English or Primary Name
  trade_name_ar?: string; // Arabic Name
  active_ingredient: string; // English
  active_ingredient_ar?: string; // Arabic
  dosage: string;
  contraindications: string;
  price: number;
  image_url?: string;
}

type Language = 'ar' | 'en';

const translations = {
  ar: {
    appTitle: 'أوبليز',
    appTitleSuffix: 'الذكية',
    searchPlaceholder: 'ابحث عن دواء...',
    heroBadge: 'تحليل صيدلاني مدعوم بالذكاء الاصطناعي',
    heroTitle: 'صيدلية أوبليز',
    heroTitleSuffix: 'بين يديك',
    heroDesc: 'قاعدة بيانات عالمية للمستحضرات الصيدلانية. تحقق فوري من السلامة الدوائية استناداً إلى توأبك الرقمي.',
    loadingErrorHeader: 'خطأ في النظام',
    price: 'السعر',
    details: 'التفاصيل',
    dosage: 'الجرعة / الشكل الصيدلاني',
    contraindications: 'موانع الاستعمال المعروفة',
    noneListed: 'لا توجد موانع معروفة.',
    smartAnalysisTitle: 'التحليل الطبي الذكي',
    smartAnalysisDesc: 'تحقق فوري من سلامة الدواء وملاءمته لملفك الصحي (الحساسية والأمراض المزمنة).',
    checkSafetyBtn: 'افحص السلامة بالذكاء الاصطناعي',
    scanning: 'جاري فحص البيانات البيولوجية...',
    safeTitle: 'آمن للاستخدام',
    safeDesc: 'لم يتم العثور على تعارضات مع ملفك الصحي.',
    dangerTitle: 'تحذير طبي عالي الخطورة',
    dangerDesc: 'تم اكتشاف تعارضات صحية محتملة بناءً على ملفك الطبي.',
    currency: '$',
  },
  en: {
    appTitle: 'Opliz',
    appTitleSuffix: 'AI',
    searchPlaceholder: 'Search for medicines...',
    heroBadge: 'AI-Powered Pharmaceutical Analysis',
    heroTitle: 'Opliz Pharmacy',
    heroTitleSuffix: 'In Your Hands',
    heroDesc: 'Global pharmaceutical database. Instant safety verification based on your digital twin.',
    loadingErrorHeader: 'System Error',
    price: 'Price',
    details: 'Details',
    dosage: 'Dosage / Form',
    contraindications: 'Known Contraindications',
    noneListed: 'None listed.',
    smartAnalysisTitle: 'Smart Medical Analysis',
    smartAnalysisDesc: 'Instant safety and compatibility check against your health profile (Allergies & Chronic Conditions).',
    checkSafetyBtn: 'Check Safety with AI',
    scanning: 'Scanning Bio-Data Profile...',
    safeTitle: 'Safe to Administer',
    safeDesc: 'No conflicts found with your health profile.',
    dangerTitle: 'High Risk Medical Warning',
    dangerDesc: 'Potential health conflicts detected based on your medical profile.',
    currency: '$',
  }
};

export default function Home() {
  const [medicines, setMedicines] = useState<DBMedicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<DBMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Language State
  const [lang, setLang] = useState<Language>('ar');
  const t = translations[lang];

  // Modal State
  const [selectedMedicine, setSelectedMedicine] = useState<DBMedicine | null>(null);
  const [checkingSafety, setCheckingSafety] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyReport | null>(null);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('pharma-lang') as Language;
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  // Update Direction and Font based on Language
  useEffect(() => {
    // Update HTML/Body attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // NOTE: In a real app we might toggle classes on body, but here we can rely on the main div font class
    localStorage.setItem('pharma-lang', lang);
  }, [lang]);

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = medicines.filter(med => {
      // Bilingual Search Logic
      const tradeName = (med.trade_name || '').toLowerCase();
      // If trade_name_ar exists, verify against it; otherwise just use tradeName
      const tradeNameAr = (med.trade_name_ar || '').toLowerCase();
      const ingredient = (med.active_ingredient || '').toLowerCase();
      const ingredientAr = (med.active_ingredient_ar || '').toLowerCase();

      return tradeName.includes(query) ||
        tradeNameAr.includes(query) ||
        ingredient.includes(query) ||
        ingredientAr.includes(query);
    });
    setFilteredMedicines(filtered);
  }, [searchQuery, medicines]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

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
    setSafetyResult(null);
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
        conditions: ['Diabetes', 'Hypertension', 'Asthma'],
        allergies: ['Penicillin', 'Sulfa']
      };

      const warnings: string[] = [];
      let isSafe = true;

      // Logic uses English Active Ingredient as standard reference
      const ingredients = selectedMedicine.active_ingredient.toLowerCase();

      if (mockUserProfile.allergies.includes('Penicillin') &&
        (ingredients.includes('penicillin') || ingredients.includes('amoxicillin'))) {
        warnings.push(lang === 'ar'
          ? 'تحذير: يحتوي هذا الدواء على مشتقات البنسلين التي تعاني من حساسية تجاهها.'
          : 'Warning: This medicine contains Penicillin derivatives which you are allergic to.');
        isSafe = false;
      }

      // Check for Chronic Conditions
      // 1. Hypertension
      if (mockUserProfile.conditions.includes('Hypertension')) {
        if (ingredients.includes('ibuprofen') || ingredients.includes('pseudoephedrine')) {
          warnings.push(lang === 'ar'
            ? 'تنبيه: قد لا يكون مناسباً لمرضى ارتفاع ضغط الدم.'
            : 'Caution: May not be suitable for patients with hypertension.');
          isSafe = false;
        }
      }

      // 2. Diabetes
      if (mockUserProfile.conditions.includes('Diabetes') && selectedMedicine.dosage.includes('Syrup')) {
        warnings.push(lang === 'ar'
          ? 'تنبيه: الشراب قد يحتوي على السكر، يرجى الحذر لمرضى السكري.'
          : 'Caution: Syrup may contain sugar, please be careful if diabetic.');
        isSafe = true; // Warning only
      }

      // 3. Asthma
      if (mockUserProfile.conditions.includes('Asthma')) {
        if (ingredients.includes('aspirin') || ingredients.includes('ibuprofen') || ingredients.includes('diclofenac')) {
          warnings.push(lang === 'ar'
            ? 'خطر: قد يسبب نوبات ربو لدى المصابين بالربو.'
            : 'Danger: May induce asthma attacks in asthmatic patients.');
          isSafe = false;
        }
      }

      // Check strict contraindications text from DB
      const contraText = selectedMedicine.contraindications ? selectedMedicine.contraindications.toLowerCase() : '';

      // Generic Pressure Check
      if (contraText.includes('pressure') || contraText.includes('ضغط')) {
        if (mockUserProfile.conditions.includes('Hypertension')) {
          warnings.push(lang === 'ar'
            ? 'موانع الاستعمال: مذكور صراحة أنه يمنع لمرضى الضغط.'
            : 'Contraindication: Explicitly stated as contraindicated for hypertension patients.');
          isSafe = false;
        }
      }

      // Specific Logic as requested: check for "High blood pressure" explicitly in contraindications
      if (mockUserProfile.conditions.includes('Hypertension') &&
        (contraText.includes('high blood pressure') || contraText.includes('ارتفاع ضغط الدم'))) {
        warnings.push(lang === 'ar'
          ? "تحذير: هذا الدواء قد لا يناسب مرضى الضغط، يرجى استشارة الصيدلي."
          : "Warning: This medicine might not be suitable for high blood pressure patients, please consult a pharmacist.");
        isSafe = false;
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

  // Helper to get localized field with fallback
  const getLocalizedName = (med: DBMedicine) => {
    if (lang === 'ar') return med.trade_name_ar || med.trade_name;
    return med.trade_name;
  };

  const getLocalizedIngredient = (med: DBMedicine) => {
    if (lang === 'ar') return med.active_ingredient_ar || med.active_ingredient;
    return med.active_ingredient;
  };

  return (
    <div className={`min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white selection:bg-medical-teal/30 ${lang === 'ar' ? 'font-[family-name:var(--font-tajawal)]' : 'font-[family-name:var(--font-inter)]'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-lg shadow-teal-500/10">
              <img src="/logo.png" alt="Opliz Logo" className="w-full h-full object-contain p-1" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-l from-white to-slate-400">
              {t.appTitle}<span className="text-medical-teal">{t.appTitleSuffix}</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700 text-slate-300 hover:text-white hover:border-medical-teal/50 transition-all text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>

            <div className="relative group">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-full w-64 focus:w-80 transition-all focus:outline-none focus:border-medical-teal focus:ring-1 focus:ring-medical-teal/50 text-sm ${lang === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'}`}
              />
              <Search className={`absolute top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-medical-teal transition-colors ${lang === 'ar' ? 'right-3' : 'left-3'}`} />
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
              {t.heroBadge}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
              {t.heroTitle} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-400 to-emerald-500">
                {t.heroTitleSuffix}
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              {t.heroDesc}
            </p>
          </motion.div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-slate-900/50 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-12 rounded-3xl bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-rose-400 mb-2">{t.loadingErrorHeader}</h3>
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
                {/* Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/40 to-slate-950/40 rounded-3xl backdrop-blur-xl border border-white/10 transition-all duration-300 group-hover:border-medical-teal/50 group-hover:shadow-[0_0_40px_-10px_rgba(20,184,166,0.3)]" />

                {/* New Card Structure with Large Image */}
                <div className="relative h-full flex flex-col z-10">
                  {/* Image Section */}
                  <img
                    src={med.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={lang === 'ar' ? (med.trade_name_ar || med.trade_name) : med.trade_name}
                    className="w-full h-48 object-contain bg-white/5 p-4 rounded-t-2xl border-b border-white/5"
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Medicine'; }}
                  />

                  {/* Content Section */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className={`text-2xl font-bold group-hover:text-medical-teal transition-colors ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                        {getLocalizedName(med)}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-slate-950/50 border border-white/10 text-emerald-400 font-mono font-bold text-sm shrink-0" dir="ltr">
                        {t.currency}{med.price}
                      </span>
                    </div>

                    <p className={`text-slate-400 text-sm mb-4 line-clamp-2 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      {getLocalizedIngredient(med)}
                    </p>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span>{med.dosage}</span>
                      <span className={`group-hover:${lang === 'ar' ? '-' : ''}translate-x-1 transition-transform flex items-center gap-1`}>
                        {t.details} {lang === 'ar' ? <>&larr;</> : <>&rarr;</>}
                      </span>
                    </div>
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
                className={`bg-slate-900 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto relative ${lang === 'ar' ? 'text-right' : 'text-left'}`}
              >
                {/* Modal Header */}
                <div className={`relative h-48 bg-gradient-to-l from-teal-900/40 to-slate-900 flex flex-col justify-end p-8`}>
                  <div className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'}`}>
                    <button onClick={closeModal} className="p-2 rounded-full bg-black/20 hover:bg-white/10 text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <h2 className="text-4xl font-bold filter drop-shadow-lg mb-2">{getLocalizedName(selectedMedicine)}</h2>
                  <p className="text-teal-200/80 font-medium flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    {getLocalizedIngredient(selectedMedicine)}
                  </p>
                </div>

                {/* Modal Body */}
                <div className="p-8">
                  <div className="grid grid-cols-2 gap-8 mb-8 border-b border-white/5 pb-8">
                    <div>
                      <h4 className="text-xs text-slate-500 font-bold mb-2">{t.dosage}</h4>
                      <p className="text-slate-200 text-lg">{selectedMedicine.dosage}</p>
                    </div>
                    <div>
                      <h4 className="text-xs text-slate-500 font-bold mb-2">{t.price}</h4>
                      <p className="text-emerald-400 text-lg font-mono" dir="ltr">{t.currency}{selectedMedicine.price}</p>
                    </div>
                    <div className="col-span-2">
                      <h4 className="text-xs text-slate-500 font-bold mb-2">{t.contraindications}</h4>
                      <p className="text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-white/5 text-sm">
                        {selectedMedicine.contraindications || t.noneListed}
                      </p>
                    </div>
                  </div>

                  {/* AI Safety Check Section */}
                  <div>
                    {!safetyResult && !checkingSafety && (
                      <div className="flex flex-col items-center justify-center text-center py-2">
                        <Stethoscope className="w-10 h-10 text-slate-600 mb-3" />
                        <h3 className="text-xl font-bold mb-2">{t.smartAnalysisTitle}</h3>
                        <p className="text-slate-400 mb-6 max-w-md text-sm">
                          {t.smartAnalysisDesc}
                        </p>
                        <button
                          onClick={handleCheckSafety}
                          className="px-8 py-3 bg-medical-teal hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-5 h-5" />
                          {t.checkSafetyBtn}
                        </button>
                      </div>
                    )}

                    {checkingSafety && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-12 h-12 border-4 border-medical-teal/30 border-t-medical-teal rounded-full animate-spin mb-4" />
                        <p className="text-medical-teal font-medium animate-pulse">{t.scanning}</p>
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
                              {safetyResult.isSafe ? t.safeTitle : t.dangerTitle}
                            </h3>
                            <p className="text-slate-300 text-sm mb-4">
                              {safetyResult.isSafe
                                ? t.safeDesc
                                : t.dangerDesc
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
        <div className={`absolute top-[-10%] ${lang === 'ar' ? 'right-[-10%]' : 'left-[-10%]'} w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px]`} />
        <div className={`absolute bottom-[-10%] ${lang === 'ar' ? 'left-[-10%]' : 'right-[-10%]'} w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[150px]`} />
      </div>

    </div>
  );
}
