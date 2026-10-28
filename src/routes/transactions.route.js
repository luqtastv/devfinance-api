import { Router } from 'express';
import {
    getAllTransactions,
    createTransaction,

    // fetch/summary
    generateSummary,

    // fetch/:id
    getTransactionById,
    patchTransaction,
    deleteTransaction,
} from '../controllers/transactions.controllers.js';
import { validateBody, validatePatch } from '../middlewares/validate-functions.js';
import {
    createTransactionSchema,
    patchTransactionSchema
} from '../schemas/transactions.schema.js'

export const router = Router();

router.route('/transactions')
    .get(getAllTransactions)
    .post(validateBody(createTransactionSchema), createTransaction) 

router.route('/transactions/summary')
    .get(generateSummary)

router.route('/transactions/:id')
    .get(getTransactionById)
    .patch(validatePatch(patchTransactionSchema), patchTransaction)
    .delete(deleteTransaction)
