import { User, Medicine, SafetyReport } from './types';

// Mock database helper strictly for this function since we don't have a live DB connection
// In production, these would be Supabase client calls
const mockFetchUser = async (userId: string): Promise<User | null> => {
    // Simulate DB call
    if (userId === 'user-123') {
        return {
            id: 'user-123',
            full_name: 'John Doe',
            email: 'john@example.com',
            medical_history: [],
            chronic_conditions: ['Hypertension', 'Asthma'],
            allergies: ['Peanuts', 'Penicillin'],
            bio_data: { heart_rate_avg: 72 }
        };
    }
    return null;
};

const mockFetchMedicine = async (medicineId: string): Promise<Medicine | null> => {
    // Simulate DB call
    if (medicineId === 'med-aspirin') { // Aspirin is often bad for Asthma/Bleeding
        return {
            id: 'med-aspirin',
            brand_name: 'Bayer Aspirin',
            generic_name: 'Aspirin',
            active_ingredients: ['Acetylsalicylic acid'],
            dosage_form: 'Tablet',
            strength: '81mg',
            contraindications: ['Asthma', 'Bleeding Disorders', 'Stomach Ulcers'],
            stock_quantity: 100
        };
    }
    if (medicineId === 'med-augmentin') { // Contains Penicillin
        return {
            id: 'med-augmentin',
            brand_name: 'Augmentin',
            generic_name: 'Amoxicillin/Clavulanate',
            active_ingredients: ['Amoxicillin', 'Clavulanic acid'],
            dosage_form: 'Tablet',
            strength: '500mg',
            contraindications: ['Liver Disease'],
            stock_quantity: 50
        };
    }
    return null;
};

/**
 * Validates if a medication is safe for a specific user based on their digital twin profile.
 * Checks for:
 * 1. Known Allergies (Direct match with active ingredients or drug class)
 * 2. Contraindications (Condition vs Medicine Contraindications)
 * 
 * @param userId - The UUID of the user
 * @param medicineId - The UUID of the medicine
 * @returns Promise<SafetyReport>
 */
export async function validateMedicationSafety(userId: string, medicineId: string): Promise<SafetyReport> {
    const report: SafetyReport = {
        isSafe: true,
        warnings: [],
        blockTransaction: false,
        details: {
            allergyconflicts: [],
            contraindicationConflicts: []
        },
        timestamp: new Date().toISOString()
    };

    try {
        // 1. Fetch Data (Parallel for performance)
        const [user, medicine] = await Promise.all([
            mockFetchUser(userId),
            mockFetchMedicine(medicineId)
        ]);

        if (!user) throw new Error(`User not found: ${userId}`);
        if (!medicine) throw new Error(`Medicine not found: ${medicineId}`);

        // 2. Check Allergies
        // Simple string matching for demo. In production, use RxNorm or SNOMED CT codes.
        // We check if any active ingredient contains the allergy string or vice versa.
        // Example: User allergic to 'Penicillin', Medicine has 'Amoxicillin' (Cross-sensitivity needs advanced logic, 
        // here we assume direct string match or known classes if dataset allows. 
        // For simplicity, we'll check if allergy is mentioned in ingredients).

        // Let's implement a basic string includes check for demonstration
        for (const allergy of user.allergies) {
            // Check against active ingredients
            for (const ingredient of medicine.active_ingredients) {
                if (ingredient.toLowerCase().includes(allergy.toLowerCase()) ||
                    allergy.toLowerCase().includes(ingredient.toLowerCase())) {
                    report.details.allergyconflicts.push(`Allergy '${allergy}' conflicts with ingredient '${ingredient}'`);
                }
            }

            // Hardcoded check for Penicillin/Amoxicillin family for 'med-augmentin' case
            if (allergy.toLowerCase() === 'penicillin' &&
                medicine.active_ingredients.some(i => i.toLowerCase().includes('amoxicillin'))) {
                report.details.allergyconflicts.push(`Allergy '${allergy}' conflicts with ingredient 'Amoxicillin' (Penicillin class)`);
            }
        }

        // 3. Check Contraindications
        // Check if user's chronic conditions match any of the medicine's contraindications
        for (const condition of user.chronic_conditions) {
            if (medicine.contraindications.includes(condition)) {
                report.details.contraindicationConflicts.push(`Condition '${condition}' is a contraindication for this medicine`);
            }
        }

        // 4. Finalize Report
        if (report.details.allergyconflicts.length > 0 || report.details.contraindicationConflicts.length > 0) {
            report.isSafe = false;
            report.blockTransaction = true; // Block if any safety risk found
            report.warnings.push(...report.details.allergyconflicts);
            report.warnings.push(...report.details.contraindicationConflicts);
        }

        return report;

    } catch (error) {
        // Strict Error Handling
        console.error('Validation Logic Error:', error);
        throw new Error(`Safety Validation Failed: ${error instanceof Error ? error.message : 'Unknown Error'}`);
    }
}
