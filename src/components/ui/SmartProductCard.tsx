'use client';

import { motion } from 'framer-motion';
import { Pill, ShieldCheck, ThermometerSnowflake, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Medicine } from '@/lib/types';

interface SmartProductCardProps {
    medicine: Medicine & { price: number; image?: string };
    compatibilityScore: number; // 0 to 100
    isSafe?: boolean;
}

export default function SmartProductCard({ medicine, compatibilityScore, isSafe = true }: SmartProductCardProps) {
    const isHighMatch = compatibilityScore >= 90;
    const isMediumMatch = compatibilityScore >= 70 && compatibilityScore < 90;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-700 overflow-hidden shadow-2xl"
        >
            {/* Compatibility Badge */}
            <div className={cn(
                "absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md flex items-center gap-1",
                isHighMatch ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" :
                    isMediumMatch ? "bg-amber-500/10 border-amber-500/50 text-amber-400" :
                        "bg-rose-500/10 border-rose-500/50 text-rose-400"
            )}>
                <ShieldCheck className="w-3 h-3" />
                {compatibilityScore}% Match
            </div>

            {/* Product Image Placeholder */}
            <div className="h-48 bg-gradient-to-br from-indigo-900/50 to-slate-900/50 flex items-center justify-center relative">
                <Pill className="w-24 h-24 text-indigo-400/20" />
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-900/90 to-transparent" />
            </div>

            <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-xl font-bold text-white">{medicine.brand_name}</h3>
                        <p className="text-sm text-slate-400">{medicine.generic_name}</p>
                    </div>
                    <div className="text-xl font-mono text-medical-teal font-bold">
                        ${medicine.price}
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4 mb-6">
                    <span className="px-2 py-1 rounded-md bg-slate-800 text-xs text-slate-300 border border-slate-700">
                        {medicine.strength}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-slate-800 text-xs text-slate-300 border border-slate-700">
                        {medicine.dosage_form}
                    </span>
                    {medicine.storage_temperature_celsius && (
                        <span className="px-2 py-1 rounded-md bg-blue-900/30 text-xs text-blue-300 border border-blue-800/50 flex items-center gap-1">
                            <ThermometerSnowflake className="w-3 h-3" />
                            {medicine.storage_temperature_celsius}°C
                        </span>
                    )}
                </div>

                {/* Action Button */}
                <button
                    disabled={!isSafe}
                    className={cn(
                        "w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2",
                        isSafe
                            ? "bg-medical-teal hover:bg-teal-500 text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    )}>
                    {isSafe ? 'Add to Cart' : (
                        <> <AlertTriangle className="w-4 h-4" /> Contraindicated </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
