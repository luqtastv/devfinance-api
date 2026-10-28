
export function validateBody(schema) {
    return (req, res, next) => {
        const results = schema.safeParse(req.body)
        if (results) {
            next();
        } else {
            res.status(400).json({ message: 'Validate error'})
        }
    }
}

export function validatePatch(schema) {
    return (req, res, next) => {
        const partialSchema = schema.partial()
        const results = partialSchema.safeParse(req.body)

        if (results.success) {
            req.body = results.data
            next()
        } else {
            res.status(400).json({
                message: 'Validation error',
                errors: results.error.issues
            })
        }
    }
}