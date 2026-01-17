'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, AlertTriangle, X, Info, Pill, Stethoscope, Microscope, CheckCircle, Globe, ShoppingCart, MessageSquare, Plus, Trash2, Sun, Moon, Eye } from 'lucide-react';
import { SafetyReport } from '@/lib/types';
import clsx from 'clsx';

// Extended Medicine type with bilingual support
interface DBMedicine {
  id: number;
  name_en: string;
  name_ar: string;
  active_ingredient_en: string;
  active_ingredient_ar: string;
  dosage: string;
  contraindications: string;
  price: number;
  image_url?: string;
  category?: string;
}

type Language = 'ar' | 'en';
type Theme = 'light' | 'dark';

interface InteractionReport {
  conflicts: string[];
  hasConflict: boolean;
}

const translations = {
  ar: {
    appTitle: 'أوبليز',
    appTitleSuffix: 'الذكية',
    searchPlaceholder: 'ابحث عن الدواء...',
    heroBadge: 'تحليل صيدلاني مدعوم بالذكاء الاصطناعي',
    heroTitle: 'صيدلية أوبليز',
    heroTitleSuffix: 'بين يديك',
    heroDesc: 'قاعدة بيانات متطورة للتحقق من سلامة الأدوية وتعارضاتها.',
    loadingErrorHeader: 'خطأ في النظام',
    price: 'السعر',
    details: 'التفاصيل',
    viewDetails: 'عرض التفاصيل',
    dosage: 'الجرعة / الشكل الصيدلاني',
    contraindications: 'موانع الاستعمال المعروفة',
    noneListed: 'لا توجد موانع معروفة.',
    smartAnalysisTitle: 'التحليل الطبي الذكي',
    smartAnalysisDesc: 'تحقق فوري من سلامة الدواء وملاءمته لملفك الصحي.',
    checkSafetyBtn: 'افحص السلامة بالذكاء الاصطناعي',
    scanning: 'جاري فحص البيانات البيولوجية...',
    safeTitle: 'آمن للاستخدام',
    safeDesc: 'لم يتم العثور على تعارضات مع ملفك الصحي.',
    dangerTitle: 'تحذير طبي عالي الخطورة',
    dangerDesc: 'تم اكتشاف تعارضات صحية محتملة بناءً على ملفك الطبي.',
    currency: '$',
    addToCart: 'أضف للسلة',
    cartTitle: 'سلة الأدوية',
    cartEmpty: 'السلة فارغة',
    cartInteractionWarning: 'تحذير: تم اكتشاف تعارض دوائي في السلة!',
    checkInteractions: 'فحص التداخلات الدوائية',
    clearCart: 'إفراغ السلة',
    chatPlaceholder: 'اسأل أوبليز بوت...',
    chatWelcome: 'مرحباً! أنا أوبليز بوت. كيف يمكنني مساعدتك في أدويتك اليوم؟',
    botName: 'أوبليز بوت',
    categories: 'التصنيفات',
    allCategories: 'الكل',
  },
  en: {
    appTitle: 'Opliz',
    appTitleSuffix: 'AI',
    searchPlaceholder: 'Search for medicines...',
    heroBadge: 'AI-Powered Pharmaceutical Analysis',
    heroTitle: 'Opliz Pharmacy',
    heroTitleSuffix: 'In Your Hands',
    heroDesc: 'Advanced database for medication safety and interaction checks.',
    loadingErrorHeader: 'System Error',
    price: 'Price',
    details: 'Details',
    viewDetails: 'View Details',
    dosage: 'Dosage / Form',
    contraindications: 'Known Contraindications',
    noneListed: 'None listed.',
    smartAnalysisTitle: 'Smart Medical Analysis',
    smartAnalysisDesc: 'Instant safety and compatibility check against your health profile.',
    checkSafetyBtn: 'Check Safety with AI',
    scanning: 'Scanning Bio-Data Profile...',
    safeTitle: 'Safe to Administer',
    safeDesc: 'No conflicts found with your health profile.',
    dangerTitle: 'High Risk Medical Warning',
    dangerDesc: 'Potential health conflicts detected based on your medical profile.',
    currency: '$',
    addToCart: 'Add to Cart',
    cartTitle: 'Medicine Cart',
    cartEmpty: 'Your cart is empty',
    cartInteractionWarning: 'Warning: Drug Interaction Detected in Cart!',
    checkInteractions: 'Check Interactions',
    clearCart: 'Clear Cart',
    chatPlaceholder: 'Ask OplizBot...',
    chatWelcome: 'Hello! I am OplizBot. How can I help you with your medicines today?',
    botName: 'OplizBot',
    categories: 'Categories',
    allCategories: 'All',
  }
};

export default function Home() {
  const [medicines, setMedicines] = useState<DBMedicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<DBMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States
  const [cart, setCart] = useState<DBMedicine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [interactionReport, setInteractionReport] = useState<InteractionReport | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [theme, setTheme] = useState<Theme>('dark');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [lang, setLang] = useState<Language>('ar');
  const t = translations[lang];

  const [selectedMedicine, setSelectedMedicine] = useState<DBMedicine | null>(null);
  const [checkingSafety, setCheckingSafety] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyReport | null>(null);

  const getCategory = (med: DBMedicine) => {
    const name = (med.name_en || '').toLowerCase();
    const ing = (med.active_ingredient_en || '').toLowerCase();
    if (name.includes('panadol') || ing.includes('paracetamol') || name.includes('aspirin') || name.includes('profen')) return 'Analgesics';
    if (name.includes('antibiotic') || ing.includes('illin') || ing.includes('cin')) return 'Antibiotics';
    if (name.includes('vitamin') || name.includes('zinc')) return 'Vitamins';
    if (name.includes('syrup') || name.includes('cough')) return 'Cough & Cold';
    return 'General';
  };

  const categories = ['All', 'Analgesics', 'Antibiotics', 'Vitamins', 'Cough & Cold', 'General'];

  useEffect(() => {
    const savedLang = localStorage.getItem('pharma-lang') as Language;
    if (savedLang) setLang(savedLang);

    const savedTheme = localStorage.getItem('pharma-theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
    else setTheme('dark');
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('pharma-lang', lang);
  }, [lang]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pharma-theme', theme);
  }, [theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  useEffect(() => {
    fetchMedicines();
    setMessages([{ text: translations[lang].chatWelcome, sender: 'bot' }]);
  }, []);

  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'bot') {
      setMessages([{ text: translations[lang].chatWelcome, sender: 'bot' }]);
    }
  }, [lang]);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    let filtered = medicines.filter(med => {
      const nameEn = (med.name_en || '').toLowerCase();
      const nameAr = (med.name_ar || '').toLowerCase();
      const ingredientEn = (med.active_ingredient_en || '').toLowerCase();
      const ingredientAr = (med.active_ingredient_ar || '').toLowerCase();

      return (nameEn.includes(query) ||
        nameAr.includes(query) ||
        ingredientEn.includes(query) ||
        ingredientAr.includes(query));
    });

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(med => getCategory(med) === selectedCategory);
    }

    setFilteredMedicines(filtered);
  }, [searchQuery, medicines, selectedCategory]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .limit(10);

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

  const addToCart = (med: DBMedicine) => {
    const newCart = [...cart, med];
    setCart(newCart);
    checkInteractions(newCart);
    setCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    checkInteractions(newCart);
  };

  const checkInteractions = (currentCart: DBMedicine[]) => {
    const ingredients = currentCart.map(m => (m.active_ingredient_en || '').toLowerCase());
    const conflicts: string[] = [];
    const uniqueIngredients = new Set(ingredients);

    if (ingredients.length !== uniqueIngredients.size) {
      const seen = new Set();
      const duplicates = new Set();
      ingredients.forEach(ing => {
        if (seen.has(ing)) duplicates.add(ing);
        seen.add(ing);
      });

      duplicates.forEach(dup => {
        const conflictingMeds = currentCart.filter(m => (m.active_ingredient_en || '').toLowerCase() === dup);
        const medNames = conflictingMeds.map(m => lang === 'ar' ? (m.name_ar || m.name_en) : m.name_en).join(', ');
        conflicts.push(`${lang === 'ar' ? 'تكرار المادة الفعالة' : 'Duplicate Active Ingredient'}: ${dup} (${medNames})`);
      });
    }

    if (ingredients.some(i => i.includes('aspirin')) && ingredients.some(i => i.includes('ibuprofen'))) {
      conflicts.push(lang === 'ar'
        ? 'تفاعل خطير: الأسبرين والإيبوبروفين قد يسببان نزيفاً.'
        : 'Major Interaction: Aspirin and Ibuprofen may increase bleeding risk.');
    }

    setInteractionReport({
      conflicts,
      hasConflict: conflicts.length > 0
    });
  };

  const handleSendMessage = async () => {
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setMessages(prev => [...prev, { text: userText, sender: 'user' }]);
    setInputMsg('');

    setTimeout(() => {
      let response = '';
      const lowerText = userText.toLowerCase();

      const foundMed = medicines.find(m =>
        (m.name_en && lowerText.includes(m.name_en.toLowerCase())) ||
        (m.name_ar && lowerText.includes(m.name_ar.toLowerCase()))
      );

      if (foundMed) {
        const medName = lang === 'ar' ? (foundMed.name_ar || foundMed.name_en) : foundMed.name_en;
        if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('سعر') || lowerText.includes('بكم')) {
          response = lang === 'ar'
            ? `سعر ${medName} هو ${foundMed.price}$`
            : `The price of ${medName} is $${foundMed.price}`;
        } else if (lowerText.includes('dosage') || lowerText.includes('dose') || lowerText.includes('جرعة')) {
          response = lang === 'ar'
            ? `الجرعة الموصى بها لـ ${medName}: ${foundMed.dosage}`
            : `Recommended dosage for ${medName}: ${foundMed.dosage}`;
        } else if (lowerText.includes('contra') || lowerText.includes('موانع')) {
          response = lang === 'ar'
            ? `موانع الاستعمال لـ ${medName}: ${foundMed.contraindications}`
            : `Contraindications for ${medName}: ${foundMed.contraindications}`;
        } else {
          response = lang === 'ar'
            ? `وجدت ${medName}. يمكنك سؤالي عن سعره، جرعته، أو موانع استعماله.`
            : `I found ${medName}. You can ask about its price, dosage, or contraindications.`;
        }
      } else {
        response = lang === 'ar'
          ? "عذراً، لم أفهم أو لم أجد الدواء المحدد. هل يمكنك إعادة الصياغة؟"
          : "I'm sorry, I didn't understand or couldn't find that medicine. Could you rephrase?";
      }

      setMessages(prev => [...prev, { text: response, sender: 'bot' }]);
    }, 600);
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
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockUserProfile = {
        conditions: ['Diabetes', 'Hypertension', 'Asthma'],
        allergies: ['Penicillin', 'Sulfa']
      };
      const warnings: string[] = [];
      let isSafe = true;
      const ingredients = (selectedMedicine.active_ingredient_en || '').toLowerCase();

      if (mockUserProfile.allergies.includes('Penicillin') &&
        (ingredients.includes('penicillin') || ingredients.includes('amoxicillin'))) {
        warnings.push(lang === 'ar'
          ? 'تحذير: يحتوي هذا الدواء على مشتقات البنسلين التي تعاني من حساسية تجاهها.'
          : 'Warning: This medicine contains Penicillin derivatives which you are allergic to.');
        isSafe = false;
      }
      if (mockUserProfile.conditions.includes('Hypertension')) {
        if (ingredients.includes('ibuprofen') || ingredients.includes('pseudoephedrine')) {
          warnings.push(lang === 'ar'
            ? 'تنبيه: قد لا يكون مناسباً لمرضى ارتفاع ضغط الدم.'
            : 'Caution: May not be suitable for patients with hypertension.');
          isSafe = false;
        }
      }
      const contraText = selectedMedicine.contraindications ? selectedMedicine.contraindications.toLowerCase() : '';
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

  const getLocalizedName = (med: DBMedicine) => {
    if (lang === 'ar') return med.name_ar || med.name_en;
    return med.name_en;
  };

  const getLocalizedIngredient = (med: DBMedicine) => {
    if (lang === 'ar') return med.active_ingredient_ar || med.active_ingredient_en;
    return med.active_ingredient_en;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white' : 'bg-slate-50 text-slate-900'} selection:bg-medical-teal/30 ${lang === 'ar' ? 'font-[family-name:var(--font-tajawal)]' : 'font-[family-name:var(--font-inter)]'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Navbar - Fixed & Aligned */}
      <nav className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${theme === 'dark' ? 'border-white/5 bg-slate-950/90' : 'border-slate-200 bg-white/90'}`}>
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity">
              <div className={`relative w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.5)] overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-teal-500/30' : 'bg-white border-teal-500/20'}`}>
                <Image
                  src="/logo.png"
                  alt="Opliz AI Logo"
                  width={40}
                  height={40}
                  className="object-contain p-0.5"
                  priority
                />
              </div>
              <span className={`text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-l ${theme === 'dark' ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'}`}>
                {t.appTitle}<span className="text-medical-teal">{t.appTitleSuffix}</span>
              </span>
            </Link>

            <button onClick={toggleTheme} className={clsx("hidden md:flex p-2 rounded-full transition-colors", theme === 'dark' ? "bg-white/10 hover:bg-white/20 text-yellow-400" : "bg-slate-200 hover:bg-slate-300 text-slate-700")}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setCartOpen(true)} className="relative p-3 rounded-full hover:bg-slate-800/10 transition-colors">
              <ShoppingCart className={clsx("w-6 h-6", theme === 'dark' ? "text-white" : "text-slate-900")} />
              {cart.length > 0 && <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-medical-teal text-white text-xs font-bold rounded-full">{cart.length}</span>}
              {interactionReport?.hasConflict && <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-rose-500 text-white text-xs font-bold rounded-full animate-ping" />}
            </button>

            <button
              onClick={toggleLanguage}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <Globe className="w-4 h-4" />
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content with New Structure */}
      <main className="container mx-auto px-6 py-12 relative z-10 font-[family-name:var(--font-tajawal)]">

        {/* Hero & Central Search Section */}
        <div className="flex flex-col items-center justify-center mb-16 space-y-8">
          <div className="text-center max-w-2xl">
            <h1 className={`text-5xl font-extrabold mb-4 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.heroTitle} <span className="text-medical-teal">{t.heroTitleSuffix}</span>
            </h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.heroDesc}
            </p>
          </div>

          {/* Large Centered Search Bar */}
          <div className="w-full max-w-3xl relative group">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-8 py-5 rounded-full text-lg shadow-2xl outline-none border-2 transition-all ${theme === 'dark'
                  ? 'bg-slate-900/80 border-slate-700 focus:border-medical-teal text-white placeholder-slate-500 shadow-teal-900/20'
                  : 'bg-white border-slate-200 focus:border-medical-teal text-slate-900 placeholder-slate-400 shadow-slate-200'
                }`}
            />
            <Search className={`absolute top-6 w-6 h-6 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} ${lang === 'ar' ? 'left-6' : 'right-6'}`} />
          </div>

          {/* Category Filter Pills - Centered */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat
                    ? 'bg-medical-teal text-white shadow-lg shadow-teal-500/30 transform scale-105'
                    : theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {cat === 'All' ? t.allCategories : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Static Grid Layout (Fixed Hierarchy) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-96 rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-200'}`} />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-rose-500">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredMedicines.map((med) => (
              <div
                key={med.id}
                className={`group flex flex-col h-[420px] rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-2xl ${theme === 'dark'
                    ? 'bg-slate-900/40 backdrop-blur-md border-white/10 hover:border-medical-teal/50'
                    : 'bg-white border-slate-100 shadow-lg hover:border-teal-100'
                  }`}
              >
                {/* 1. Image at Top (Fixed Height) - USING STANDARD IMG TAG AS REQUESTED */}
                <div className={`h-48 w-full p-6 flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <img
                    src={med.image_url || 'https://via.placeholder.com/300x200?text=Medicine'}
                    alt={getLocalizedName(med)}
                    className="h-full w-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Medicine';
                      e.currentTarget.onerror = null;
                    }}
                  />
                </div>

                {/* 2. Content Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className={`text-lg font-bold mb-1 line-clamp-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {getLocalizedName(med)}
                  </h3>
                  <p className={`text-xs mb-3 line-clamp-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {getLocalizedIngredient(med)}
                  </p>

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xl font-mono font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {t.currency}{med.price}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded bg-slate-100/10 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                        {med.dosage}
                      </span>
                    </div>

                    {/* 3. View Details Button */}
                    <button
                      onClick={() => handleMedicineClick(med)}
                      className="w-full py-2.5 rounded-xl bg-medical-teal text-white font-bold text-sm shadow-lg shadow-teal-500/20 hover:bg-teal-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {t.viewDetails}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart & Chat Components */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: lang === 'ar' ? -320 : 320 }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'ar' ? -320 : 320 }}
              className={`fixed top-0 bottom-0 ${lang === 'ar' ? 'left-0' : 'right-0'} w-96 z-50 shadow-2xl overflow-y-auto ${theme === 'dark' ? 'bg-slate-900 border-r border-white/10' : 'bg-white border-l border-slate-200'}`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.cartTitle}</h2>
                  <button onClick={() => setCartOpen(false)}><X className="w-6 h-6 text-slate-500" /></button>
                </div>
                {interactionReport?.hasConflict && (
                  <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                    <strong className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" /> {t.cartInteractionWarning}</strong>
                    <ul className="list-disc list-inside space-y-1">
                      {interactionReport.conflicts.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {cart.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">{t.cartEmpty}</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, idx) => (
                      <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                        <img src={item.image_url || ''} className="w-12 h-12 rounded-lg object-contain bg-white/10" />
                        <div className="flex-1">
                          <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{getLocalizedName(item)}</h4>
                          <p className="text-xs text-slate-500">{t.currency}{item.price}</p>
                        </div>
                        <button onClick={() => removeFromCart(idx)} className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bot FAB */}
      <div className={`fixed bottom-6 ${lang === 'ar' ? 'left-6' : 'right-6'} z-40 flex flex-col items-end gap-4`}>
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className="p-4 bg-medical-teal flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-white/20"><MessageSquare className="w-4 h-4" /></div>
                  <span className="font-bold">{t.botName}</span>
                </div>
                <button onClick={() => setChatOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-medical-teal text-white rounded-br-none' : (theme === 'dark' ? 'bg-slate-800 text-slate-200 rounded-bl-none' : 'bg-slate-100 text-slate-800 rounded-bl-none')}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className={`p-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t.chatPlaceholder}
                    className={`flex-1 px-4 py-2 rounded-full text-sm outline-none border transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-medical-teal' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-medical-teal'}`}
                  />
                  <button onClick={handleSendMessage} className="p-2 rounded-full bg-medical-teal text-white hover:bg-teal-500"><Plus className="w-5 h-5 rotate-90" /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 rounded-full bg-medical-teal shadow-lg shadow-teal-500/30 flex items-center justify-center text-white hover:scale-105 transition-transform"
        >
          {chatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>

      {/* Modal */}
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
                className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden pointer-events-auto relative ${theme === 'dark' ? 'bg-slate-900 border border-white/10' : 'bg-white'} ${lang === 'ar' ? 'text-right' : 'text-left'}`}
              >
                <div className={`relative h-48 bg-gradient-to-l from-teal-900/40 to-slate-900 flex flex-col justify-end p-8`}>
                  <div className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'}`}>
                    <button onClick={closeModal} className="p-2 rounded-full bg-black/20 hover:bg-white/10 text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <h2 className="text-4xl font-bold filter drop-shadow-lg mb-2 text-white">{getLocalizedName(selectedMedicine)}</h2>
                  <p className="text-teal-200/80 font-medium flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    {getLocalizedIngredient(selectedMedicine)}
                  </p>
                </div>

                <div className="p-8">
                  <div className={`grid grid-cols-2 gap-8 mb-8 border-b pb-8 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                    <div><h4 className="text-xs text-slate-500 font-bold mb-2">{t.dosage}</h4><p className={`text-lg ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{selectedMedicine.dosage}</p></div>
                    <div><h4 className="text-xs text-slate-500 font-bold mb-2">{t.price}</h4><p className="text-emerald-400 text-lg font-mono" dir="ltr">{t.currency}{selectedMedicine.price}</p></div>
                    <div className="col-span-2"><h4 className="text-xs text-slate-500 font-bold mb-2">{t.contraindications}</h4><p className={`leading-relaxed p-4 rounded-xl border text-sm ${theme === 'dark' ? 'bg-slate-950/50 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>{selectedMedicine.contraindications || t.noneListed}</p></div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => { addToCart(selectedMedicine); closeModal(); }} className="flex-1 py-3 bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 rounded-xl font-bold flex items-center justify-center gap-2">
                      <ShoppingCart className="w-5 h-5" /> {t.addToCart}
                    </button>
                    {!safetyResult && !checkingSafety && (
                      <button onClick={handleCheckSafety} className="flex-[2] py-3 bg-medical-teal text-white hover:bg-teal-600 rounded-xl font-bold shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-5 h-5" /> {t.checkSafetyBtn}
                      </button>
                    )}
                  </div>

                  {checkingSafety && <div className="text-center py-4 text-medical-teal animate-pulse">{t.scanning}</div>}

                  {safetyResult && (
                    <div className={`mt-6 p-4 rounded-xl border ${safetyResult.isSafe ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                      <div className="flex items-center gap-2 font-bold mb-2">
                        {safetyResult.isSafe ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        {safetyResult.isSafe ? t.safeTitle : t.dangerTitle}
                      </div>
                      <p className="text-sm opacity-90">{safetyResult.isSafe ? t.safeDesc : t.dangerDesc}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className={`absolute top-[-10%] ${lang === 'ar' ? 'right-[-10%]' : 'left-[-10%]'} w-[500px] h-[500px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-teal-500/5' : 'bg-teal-500/10'}`} />
        <div className={`absolute bottom-[-10%] ${lang === 'ar' ? 'left-[-10%]' : 'right-[-10%]'} w-[600px] h-[600px] rounded-full blur-[150px] ${theme === 'dark' ? 'bg-indigo-600/5' : 'bg-indigo-600/10'}`} />
      </div>
    </div>
  );
}
