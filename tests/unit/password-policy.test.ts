import { ValidationError } from 'payload'
import { describe, expect, it } from 'vitest'
import { Users } from '@/collections/Users'
import { enforcePasswordPolicy, MIN_PASSWORD_LENGTH } from '@/hooks/password-policy'

const run = (operation: string, password: unknown, language = 'es') =>
  enforcePasswordPolicy({ args: { data: { email: 'a@b.es', password } }, operation, req: { i18n: { language } } } as never)

describe('panel password policy', () => {
  it('rejects short passwords on create, update and reset, in the admin language', () => {
    for (const op of ['create', 'update', 'resetPassword']) expect(() => run(op, 'corta-123')).toThrow(ValidationError)
    const fieldMessage = (fn: () => unknown) => {
      try {
        fn()
      } catch (e) {
        return (e as ValidationError).data.errors[0]?.message
      }
    }
    expect(fieldMessage(() => run('create', 'x'.repeat(MIN_PASSWORD_LENGTH - 1)))).toBe('La contraseña debe tener al menos 12 caracteres.')
    expect(fieldMessage(() => run('create', 'short', 'en'))).toBe('The password must be at least 12 characters long.')
  })

  it('accepts long enough passwords and updates that do not set one', () => {
    expect(() => run('create', 'x'.repeat(MIN_PASSWORD_LENGTH))).not.toThrow()
    expect(() => run('update', undefined)).not.toThrow()
    expect(() => run('update', '')).not.toThrow()
    // Logging in with an older, shorter password still works.
    expect(() => run('login', 'corta')).not.toThrow()
  })

  it('is wired into the users collection', () => {
    expect(Users.hooks?.beforeOperation).toContain(enforcePasswordPolicy)
  })
})
