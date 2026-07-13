const { validationResult, body } = require('express-validator')

function handleValidation(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  next()
}

const validateEmail = body('email')
  .isEmail()
  .withMessage('Valid email required')
  .normalizeEmail()

const validatePassword = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters')

module.exports = { handleValidation, validateEmail, validatePassword }
