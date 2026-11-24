import { expect, given, role, scene, text } from 'foldkit/scene'
import { describe, test } from 'vitest'

import { type Model, update, view } from './main'

const initialModel: Model = {}

describe('view', () => {
  test('renders the Tulsi heading and tagline', () => {
    scene(
      { update, view },
      given(initialModel),
      expect(role('heading', { name: 'Tulsi' })).toExist(),
      expect(text('Organise your Tasks.')).toExist(),
    )
  })
})
