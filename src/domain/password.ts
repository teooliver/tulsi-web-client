import { Redacted, Schema } from 'effect'

const PASSWORD_LABEL = 'password'

export const Password = Schema.Redacted(Schema.String, {
  label: PASSWORD_LABEL,
  disallowJsonEncode: true,
})
export type Password = typeof Password.Type

export const makePassword = (value: string): Password =>
  Redacted.make(value, { label: PASSWORD_LABEL })

export const emptyPassword = (): Password => makePassword('')
