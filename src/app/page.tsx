'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, AlertTriangle, X, Info, Pill, Stethoscope, Microscope, CheckCircle, Globe, ShoppingCart, MessageSquare, Plus, Trash2, Sun, Moon, Eye, Minus, CreditCard, ShoppingBag } from 'lucide-react';
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

// Cart Item extends Medicine with Quantity
interface CartItem extends DBMedicine {
  quantity: number;
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
    checkSafetyBtn: 'افحص السلامة',
    scanning: 'جاري فحص البيانات...',
    safeTitle: 'آمن للاستخدام',
    safeDesc: 'لم يتم العثور على تعارضات.',
    dangerTitle: 'تحذير عالي الخطورة',
    dangerDesc: 'تم اكتشاف تعارضات صحية.',
    currency: 'ج.م',
    addToCart: 'أضف للسلة',
    cartTitle: 'سلة المشتريات',
    cartEmpty: 'سلتك فارغة',
    cartInteractionWarning: 'تحذير: تعارض دوائي محتمل!',
    checkout: 'إتمام الطلب',
    total: 'المجموع',
    clearCart: 'إفراغ السلة',
    chatPlaceholder: 'اسأل أوبليز بوت...',
    chatWelcome: 'مرحباً! أنا أوبليز بوت. كيف يمكنني مساعدتك؟',
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
    checkSafetyBtn: 'Check Safety',
    scanning: 'Scanning Bio-Data...',
    safeTitle: 'Safe to Administer',
    safeDesc: 'No conflicts found.',
    dangerTitle: 'High Risk Warning',
    dangerDesc: 'Potential health conflicts detected.',
    currency: 'EGP',
    addToCart: 'Add to Cart',
    cartTitle: 'Shopping Cart',
    cartEmpty: 'Your cart is empty',
    cartInteractionWarning: 'Warning: Potential Drug Interaction!',
    checkout: 'Checkout',
    total: 'Total',
    clearCart: 'Clear Cart',
    chatPlaceholder: 'Ask OplizBot...',
    chatWelcome: 'Hello! I am OplizBot. How can I help you?',
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
  const [cart, setCart] = useState<CartItem[]>([]);
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

  // Helper Functions
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

  // Effects
  useEffect(() => {
    const savedLang = localStorage.getItem('pharma-lang') as Language;
    if (savedLang) setLang(savedLang);
    const savedTheme = localStorage.getItem('pharma-theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
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
      return (nameEn.includes(query) || nameAr.includes(query) || ingredientEn.includes(query) || ingredientAr.includes(query));
    });

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(med => getCategory(med) === selectedCategory);
    }
    setFilteredMedicines(filtered);
  }, [searchQuery, medicines, selectedCategory]);

  const toggleLanguage = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('medicines').select('*').limit(10);
      if (error) throw error;
      setMedicines(data || []);
      setFilteredMedicines(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Upgrade: Advanced Cart Logic ---

  const addToCart = (med: DBMedicine) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === med.id);
      let newCart;
      if (existing) {
        newCart = prev.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        newCart = [...prev, { ...med, quantity: 1 }];
      }
      checkInteractions(newCart);
      return newCart;
    });
    setCartOpen(true);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
      });
      checkInteractions(newCart);
      return newCart;
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.id !== id);
      checkInteractions(newCart);
      return newCart;
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const checkInteractions = (currentCart: CartItem[]) => {
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
      conflicts.push(lang === 'ar' ? 'تفاعل خطير: الأسبرين والإيبوبروفين.' : 'Major Interaction: Aspirin & Ibuprofen.');
    }

    setInteractionReport({ conflicts, hasConflict: conflicts.length > 0 });
  };

  // Chatbot Logic
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
        if (lowerText.includes('price') || lowerText.includes('سعر')) response = lang === 'ar' ? `${medName}: ${foundMed.price} ج.م` : `${medName}: ${foundMed.price} EGP`;
        else if (lowerText.includes('dosage') || lowerText.includes('جرعة')) response = lang === 'ar' ? `الجرعة: ${foundMed.dosage}` : `Dosage: ${foundMed.dosage}`;
        else response = lang === 'ar' ? `وجدت ${medName}.` : `Found ${medName}.`;
      } else {
        response = lang === 'ar' ? "عذراً، لم أجد الدواء." : "Sorry, I couldn't find that medicine.";
      }
      setMessages(prev => [...prev, { text: response, sender: 'bot' }]);
    }, 600);
  };

  // Localization Helpers
  const getLocalizedName = (med: DBMedicine) => lang === 'ar' ? (med.name_ar || med.name_en) : med.name_en;
  const getLocalizedIngredient = (med: DBMedicine) => lang === 'ar' ? (med.active_ingredient_ar || med.active_ingredient_en) : med.active_ingredient_en;

  const handleMedicineClick = (med: DBMedicine) => { setSelectedMedicine(med); setSafetyResult(null); };
  const closeModal = () => { setSelectedMedicine(null); setSafetyResult(null); };

  const handleCheckSafety = async () => {
    if (!selectedMedicine) return;
    setCheckingSafety(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockUserProfile = { conditions: ['Diabetes', 'Hypertension'], allergies: ['Penicillin'] };
      const warnings: string[] = [];
      let isSafe = true;
      const ing = (selectedMedicine.active_ingredient_en || '').toLowerCase();

      if (mockUserProfile.allergies.includes('Penicillin') && (ing.includes('penicillin') || ing.includes('amoxicillin'))) {
        warnings.push(lang === 'ar' ? 'حساسية البنسلين.' : 'Penicillin Allergy.');
        isSafe = false;
      }
      setSafetyResult({ isSafe, warnings, blockTransaction: !isSafe, details: { allergyconflicts: [], contraindicationConflicts: [] }, timestamp: new Date().toISOString() });
    } catch { } finally { setCheckingSafety(false); }
  };

  const PLACEHOLDER_IMG = 'https://via.placeholder.com/300x200?text=Opliz+Medicine';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white' : 'bg-slate-50 text-slate-900'} ${lang === 'ar' ? 'font-[family-name:var(--font-tajawal)]' : 'font-[family-name:var(--font-inter)]'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Navbar */}
      <nav className={`sticky top-0 z-40 w-full border-b backdrop-blur-md ${theme === 'dark' ? 'border-white/5 bg-slate-950/90' : 'border-slate-200 bg-white/90'}`}>
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-4">
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'bg-slate-900 border-teal-500/30' : 'bg-white border-teal-500/20'}`}>
                <Image src="/logo.png" alt="Opliz" width={40} height={40} className="object-contain p-0.5" />
              </div>
              <span className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l ${theme === 'dark' ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'}`}>
                {t.appTitle}<span className="text-medical-teal">{t.appTitleSuffix}</span>
              </span>
            </Link>
            <button onClick={toggleTheme} className={clsx("hidden md:flex p-2 rounded-full", theme === 'dark' ? "bg-white/10 text-yellow-400" : "bg-slate-200 text-slate-700")}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setCartOpen(true)} className="relative p-3 rounded-full hover:bg-slate-500/10">
              <ShoppingCart className={theme === 'dark' ? "text-white" : "text-slate-900"} />
              {cart.length > 0 && <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-medical-teal text-white text-xs font-bold rounded-full">{cart.length}</span>}
              {interactionReport?.hasConflict && <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-rose-500 text-white text-xs font-bold rounded-full animate-ping" />}
            </button>
            <button onClick={toggleLanguage} className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium"><Globe size={16} /> {lang === 'ar' ? 'English' : 'العربية'}</button>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <main className="container mx-auto px-6 py-12 relative z-10">
        {/* Hero Search */}
        <div className="flex flex-col items-center justify-center mb-16 space-y-8">
          <div className="text-center max-w-2xl">
            <h1 className={`text-5xl font-extrabold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.heroTitle} <span className="text-medical-teal">{t.heroTitleSuffix}</span></h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t.heroDesc}</p>
          </div>
          <div className="w-full max-w-3xl relative group">
            <input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full px-8 py-5 rounded-full text-lg shadow-2xl outline-none border-2 transition-all ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`} />
            <Search className={`absolute top-6 w-6 h-6 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} ${lang === 'ar' ? 'left-6' : 'right-6'}`} />
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-medical-teal text-white' : (theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')}`}>{cat === 'All' ? t.allCategories : cat}</button>
            ))}
          </div>
        </div>

        {/* Static Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredMedicines.map((med) => (
            <div key={med.id} className={`group flex flex-col h-[420px] rounded-2xl overflow-hidden border transition-all hover:shadow-2xl ${theme === 'dark' ? 'bg-slate-900/40 border-white/10 hover:border-medical-teal/50' : 'bg-white border-slate-100 shadow-lg'}`}>
              <div className={`h-48 w-full p-6 flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                <img src={med.image_url || PLACEHOLDER_IMG} alt={getLocalizedName(med)} className="h-full w-full object-contain drop-shadow-lg transition-transform group-hover:scale-110" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }} />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className={`text-lg font-bold mb-1 line-clamp-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{getLocalizedName(med)}</h3>
                <p className={`text-xs mb-3 line-clamp-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{getLocalizedIngredient(med)}</p>
                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xl font-mono font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{med.price} {t.currency}</span>
                    <span className="text-xs px-2 py-1 rounded bg-slate-100/10 opacity-70">{med.dosage}</span>
                  </div>
                  <button onClick={() => handleMedicineClick(med)} className="w-full py-2.5 rounded-xl bg-medical-teal text-white font-bold text-sm shadow-lg hover:bg-teal-600 flex items-center justify-center gap-2">
                    <Eye size={16} /> {t.viewDetails}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Professional Slide-over Cart */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} className="fixed inset-0 bg-black z-50 backdrop-blur-sm" />
            <motion.div initial={{ x: lang === 'ar' ? -400 : 400 }} animate={{ x: 0 }} exit={{ x: lang === 'ar' ? -400 : 400 }} className={`fixed top-0 bottom-0 ${lang === 'ar' ? 'left-0' : 'right-0'} w-full sm:w-[450px] z-[60] shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-slate-900/95 border-r border-white/10' : 'bg-white/95 border-l border-slate-200'} backdrop-blur-xl`}>
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-medical-teal/20 text-medical-teal"><ShoppingBag size={24} /></div>
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.cartTitle}</h2>
                </div>
                <button onClick={() => setCartOpen(false)} className="p-2 rounded-full hover:bg-slate-500/20"><X size={24} /></button>
              </div>

              {interactionReport?.hasConflict && (
                <div className="mx-6 mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm animate-pulse">
                  <strong className="flex items-center gap-2 mb-2"><AlertTriangle size={16} /> {t.cartInteractionWarning}</strong>
                  <ul className="list-disc list-inside space-y-1 text-xs opacity-90">{interactionReport.conflicts.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <ShoppingCart size={48} className="mb-4" />
                    <p>{t.cartEmpty}</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className={`flex gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <img src={item.image_url || PLACEHOLDER_IMG} className="w-20 h-20 rounded-xl object-contain bg-white p-2" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }} />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{getLocalizedName(item)}</h4>
                          <p className="text-xs opacity-60 mt-1">{getLocalizedIngredient(item)}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`font-mono font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{item.price} {t.currency}</span>
                          <div className="flex items-center gap-3 bg-slate-500/10 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white/20 rounded"><Minus size={14} /></button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white/20 rounded"><Plus size={14} /></button>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="self-start p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className={`p-6 border-t ${theme === 'dark' ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between mb-6 text-lg">
                    <span className="opacity-70">{t.total}</span>
                    <span className={`font-mono font-bold text-2xl ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{cartTotal.toFixed(2)} {t.currency}</span>
                  </div>
                  <button className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-lg shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                    {t.checkout} <CreditCard size={20} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bot */}
      <div className={`fixed bottom-6 ${lang === 'ar' ? 'left-6' : 'right-6'} z-40 flex flex-col items-end gap-4`}>
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="p-4 bg-medical-teal flex items-center justify-between text-white">
                <div className="flex items-center gap-2"><div className="p-2 rounded-full bg-white/20"><MessageSquare size={16} /></div><span className="font-bold">{t.botName}</span></div>
                <button onClick={() => setChatOpen(false)}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (<div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-medical-teal text-white rounded-br-none' : 'bg-slate-600 text-white rounded-bl-none'}`}>{msg.text}</div></div>))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-white/10 flex gap-2"><input type="text" value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={t.chatPlaceholder} className="flex-1 px-4 py-2 rounded-full text-sm outline-none bg-slate-500/10" /><button onClick={handleSendMessage} className="p-2 rounded-full bg-medical-teal text-white"><Plus size={20} className="rotate-90" /></button></div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setChatOpen(!chatOpen)} className="w-14 h-14 rounded-full bg-medical-teal shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform">{chatOpen ? <X size={24} /> : <MessageSquare size={24} />}</button>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMedicine && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div onClick={closeModal} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
              <div className="relative h-48 bg-gradient-to-l from-teal-900/40 to-slate-900 p-8 flex flex-col justify-end">
                <button onClick={closeModal} className="absolute top-4 right-4 p-2 rounded-full bg-black/20 text-white"><X size={20} /></button>
                <h2 className="text-3xl font-bold text-white">{getLocalizedName(selectedMedicine)}</h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center bg-slate-500/5 p-4 rounded-xl">
                  <div><span className="text-xs uppercase tracking-wider opacity-60">{t.price}</span><p className="text-2xl font-mono font-bold text-emerald-500">{selectedMedicine.price} {t.currency}</p></div>
                  <button onClick={() => { addToCart(selectedMedicine); closeModal(); }} className="px-6 py-3 bg-medical-teal text-white rounded-xl font-bold hover:bg-teal-600 flex items-center gap-2"><ShoppingCart size={20} /> {t.addToCart}</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-dashed border-slate-500/30"><h4 className="text-xs font-bold opacity-60 mb-1">{t.dosage}</h4><p>{selectedMedicine.dosage}</p></div>
                  <div className="p-4 rounded-xl border border-dashed border-slate-500/30"><h4 className="text-xs font-bold opacity-60 mb-1">{t.contraindications}</h4><p className="text-sm">{selectedMedicine.contraindications}</p></div>
                </div>
                <button onClick={handleCheckSafety} className="w-full py-4 rounded-xl border-2 border-medical-teal text-medical-teal font-bold hover:bg-medical-teal hover:text-white transition-colors flex items-center justify-center gap-2"><ShieldCheck size={20} /> {t.checkSafetyBtn}</button>
                {safetyResult && <div className={`p-4 rounded-xl text-center font-bold ${safetyResult.isSafe ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{safetyResult.isSafe ? t.safeDesc : t.dangerDesc}</div>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
