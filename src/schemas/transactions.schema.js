import { z } from 'zod'

export const createTransactionSchema = z.object({
    description: z.string().trim().min(1),
    amount: z.number().positive(),
    category: z.string().trim().min(1),
    type: z.enum(['income', 'expense']),
    nano_id: z.string().trim().min(1)
})

export const patchTransactionSchema = z.object({
    description: z.string().trim().min(1),
    amount: z.number().positive(),
    category: z.string().trim().min(1),
    type: z.enum(['income', 'expense']),
    nano_id: z.string().trim().min(1)
})