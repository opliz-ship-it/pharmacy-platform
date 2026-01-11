export interface User {
    id: string;
    full_name: string;
    email: string;
    medical_history: MedicalRecord[];
    chronic_conditions: string[]; // e.g., ['Hypertension']
    allergies: string[]; // e.g., ['Penicillin']
    bio_data: BioData;
}

export interface MedicalRecord {
    condition: string;
    diagnosed_at: string;
}

export interface BioData {
    heart_rate_avg?: number;
    sleep_hours_avg?: number;
    last_updated?: string;
}

export interface Medicine {
    id: string;
    brand_name: string;
    generic_name: string;
    active_ingredients: string[]; // e.g., ['Ibuprofen']
    dosage_form: string;
    strength: string;
    contraindications: string[]; // e.g., ['Asthma', 'Pregnancy']
    stock_quantity: number;
    storage_temperature_celsius?: number;
}

export interface SafetyReport {
    isSafe: boolean;
    warnings: string[];
    blockTransaction: boolean; // True if critical contraindication found
    details: {
        allergyconflicts: string[];
        contraindicationConflicts: string[];
    };
    timestamp: string;
}
