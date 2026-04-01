// src/lib/validateSafety.ts
import { supabase } from './supabaseClient'
import { SafetyReport } from './types'

export async function validateMedicationSafety(
    userId: string,
    medicineId: string
): Promise<SafetyReport> {
    const report: SafetyReport = {
        isSafe: true,
        warnings: [],
        blockTransaction: false,
        details: {
            allergyconflicts: [],
            contraindicationConflicts: [],
        },
        timestamp: new Date().toISOString(),
    }

    try {
        // 1. Fetch user profile + medicine from Supabase in parallel
        const [{ data: profile }, { data: medicine }] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).single(),
            supabase.from('medicines').select('*').eq('id', medicineId).single(),
        ])

        if (!profile) throw new Error(`User not found: ${userId}`)
        if (!medicine) throw new Error(`Medicine not found: ${medicineId}`)

        const allergies: string[] = profile.allergies || []
        const chronicConditions: string[] = profile.chronic_conditions || []
        const activeIngredients: string[] = medicine.active_ingredients || []
        const contraindications: string[] = medicine.contraindications || []

        // 2. Check Allergies against active ingredients
        for (const allergy of allergies) {
            for (const ingredient of activeIngredients) {
                if (
                    ingredient.toLowerCase().includes(allergy.toLowerCase()) ||
                    allergy.toLowerCase().includes(ingredient.toLowerCase())
                ) {
                    report.details.allergyconflicts.push(
                        `Allergy '${allergy}' conflicts with ingredient '${ingredient}'`
                    )
                }
            }

            // Penicillin / Amoxicillin cross-sensitivity
            if (
                allergy.toLowerCase() === 'penicillin' &&
                activeIngredients.some(i => i.toLowerCase().includes('amoxicillin'))
            ) {
                report.details.allergyconflicts.push(
                    `Allergy '${allergy}' conflicts with ingredient 'Amoxicillin' (Penicillin class)`
                )
            }
        }

        // 3. Check Contraindications against chronic conditions
        for (const condition of chronicConditions) {
            if (contraindications.includes(condition)) {
                report.details.contraindicationConflicts.push(
                    `Condition '${condition}' is a contraindication for this medicine`
                )
            }
        }

        // 4. Finalize Report
        if (
            report.details.allergyconflicts.length > 0 ||
            report.details.contraindicationConflicts.length > 0
        ) {
            report.isSafe = false
            report.blockTransaction = true
            report.warnings.push(...report.details.allergyconflicts)
            report.warnings.push(...report.details.contraindicationConflicts)
        }

        return report

    } catch (error) {
        console.error('Safety Validation Error:', error)
        throw new Error(
            `Safety Validation Failed: ${error instanceof Error ? error.message : 'Unknown Error'}`
        )
    }
}
