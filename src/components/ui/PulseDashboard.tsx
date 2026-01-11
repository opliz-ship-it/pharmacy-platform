'use client';

import { motion } from 'framer-motion';
import { Activity, Heart, Thermometer, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PulseDashboard() {
    const stats = [
        { label: 'Heart Rate', value: '72 BPM', icon: Heart, color: 'text-rose-500', trend: '+2%' },
        { label: 'Oxygen Level', value: '98%', icon: Wind, color: 'text-sky-400', trend: 'Stable' },
        { label: 'Body Temp', value: '36.6°C', icon: Thermometer, color: 'text-amber-400', trend: 'Normal' },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto mb-10">
            <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-medical-teal animate-pulse" />
                <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-medical-teal to-blue-400">
                    Digital Twin Status
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                            "group relative overflow-hidden rounded-2xl p-6",
                            "bg-slate-900/50 backdrop-blur-xl border border-slate-800",
                            "hover:border-medical-teal/50 transition-all duration-300"
                        )}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <stat.icon className="w-16 h-16" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-400">{stat.label}</span>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                                <div className="text-3xl font-mono font-bold text-white tracking-widest">
                                    {stat.value}
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '70%' }}
                                        transition={{ duration: 1.5, delay: 0.5 + idx * 0.1 }}
                                        className={cn("h-full rounded-full", stat.color.replace('text-', 'bg-'))}
                                    />
                                </div>
                                <span className="text-xs text-medical-teal">{stat.trend}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
