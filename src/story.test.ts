import { Command, given, model, story } from 'foldkit/story'
import { describe, expect, test } from 'vitest'

import { init, update } from './main'

describe('update', () => {
  test('init starts with an empty Model and no Commands', () => {
    const init_ = init()

    story(
      update,
      given(init_.model),
      Command.expectNone(),
      model(model => {
        expect(model).toEqual({})
      }),
    )
  })
})
