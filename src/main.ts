import { Schema } from 'effect'
import { Runtime, type Update } from 'foldkit'
import { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'

import styles from './main.module.css'

// MODEL

export const Model = Schema.Struct({})
export type Model = typeof Model.Type

// MESSAGE

export const Message = defineMessageUnion({})
export type Message = typeof Message.Type

// UPDATE

export const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {})

// INIT

export const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: {},
})

// VIEW

export const view = (_model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'Tulsi',
  body: h.main(
    [h.Class(styles.page)],
    [
      h.h1([h.Class(styles.title)], ['Tulsi']),
      h.p([h.Class(styles.tagline)], ['Organise your Tasks.']),
    ],
  ),
})
