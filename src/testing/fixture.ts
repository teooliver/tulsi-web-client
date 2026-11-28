import { type User } from '../api/generated'
import { type Session, makeSession } from '../domain/session'

export const ada: User = {
  id: '6f1c3c1e-2f7a-4d55-9a53-0b4c8c3f2a10',
  name: 'Ada',
  email: 'ada@example.com',
  created_at: '2026-11-24T10:00:00Z',
  updated_at: '2026-11-24T10:00:00Z',
}

export const adaSession: Session = makeSession({ token: 'jwt', user: ada })
