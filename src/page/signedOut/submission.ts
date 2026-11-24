import { defineTaggedUnion } from 'foldkit/schema'

import { ApiError } from '../../api/client'

export const Submission = defineTaggedUnion({
  Idle: {},
  Submitting: {},
  Failed: { error: ApiError },
})
export type Submission = typeof Submission.Type

export const isSubmitting = (submission: Submission): boolean =>
  submission._tag === 'Submitting'

export const UNEXPECTED_ERROR = 'Something went wrong. Please try again.'
export const NETWORK_ERROR =
  "Can't reach Tulsi right now. Check your connection and try again."
