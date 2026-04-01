// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SYSTEM_PROMPT = `You are PharmAI, an expert AI assistant for a smart pharmacy platform.
Your role is to:
1. Help users understand their symptoms and suggest appropriate medicines
2. Check for drug interactions and contraindications based on the user's medical profile
3. Always recommend consulting a pharmacist or doctor for serious conditions
4. Be clear, concise, and medically accurate
5. If a user mentions an emergency, always tell them to call emergency services immediately
6. Never diagnose diseases - only suggest possible causes and recommend professional consultation
 
You have access to the user's:
- Known allergies
- Chronic conditions
- Current medications (if provided)
 
Always prioritize patient safety above everything else.
Respond in the same language the user writes in (Arabic or English).`

export async function POST(request: NextRequest) {
    try {
        const { messages, userId } = await request.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            )
        }

        // Fetch user profile from Supabase for personalized safety checks
        let userContext = ''
        if (userId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (profile) {
                userContext = `
User Medical Profile:
- Name: ${profile.full_name}
- Allergies: ${profile.allergies?.join(', ') || 'None known'}
- Chronic Conditions: ${profile.chronic_conditions?.join(', ') || 'None known'}
Always check this profile before suggesting any medication.`
            }
        }

        // Call Claude API
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT + userContext,
            messages: messages.map((msg: { role: string; content: string }) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
        })

        const aiMessage = response.content[0].type === 'text'
            ? response.content[0].text
            : 'Sorry, I could not process your request.'

        // Save consultation to Supabase if user is logged in
        if (userId && messages.length > 0) {
            const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
            if (lastUserMessage) {
                await supabase.from('ai_consultations').insert({
                    user_id: userId,
                    symptoms: lastUserMessage.content,
                    ai_response: aiMessage,
                    status: 'completed',
                })
            }
        }

        return NextResponse.json({
            message: aiMessage,
            usage: response.usage,
        })

    } catch (error) {
        console.error('Chat API Error:', error)
        return NextResponse.json(
            { error: 'Failed to process your request. Please try again.' },
            { status: 500 }
        )
    }
}