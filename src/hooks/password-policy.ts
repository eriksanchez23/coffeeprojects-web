import { type CollectionBeforeOperationHook, ValidationError } from 'payload'

/** Minimum length of a panel password: long passphrases beat complexity rules, and 12+ resists offline guessing. */
export const MIN_PASSWORD_LENGTH = 12

const OPERATIONS = new Set(['create', 'update', 'resetPassword'])

/**
 * Rejects a new password shorter than MIN_PASSWORD_LENGTH whenever one is set: account creation (including the first
 * user), a profile/password change and a password reset. Existing passwords keep working until they are changed.
 */
export const enforcePasswordPolicy: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (!OPERATIONS.has(operation)) return args
  const password = (args as { data?: { password?: unknown } }).data?.password
  if (typeof password === 'string' && password.length > 0 && password.length < MIN_PASSWORD_LENGTH) {
    const message =
      req?.i18n?.language === 'en'
        ? `The password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
        : `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    throw new ValidationError({ collection: 'users', errors: [{ message, path: 'password' }] })
  }
  return args
}
