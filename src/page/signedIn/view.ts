import { Match } from 'effect'
import { Submodel } from 'foldkit'

import { Button } from '@foldkit/ui'

import { homeRouter } from '../../route'
import { notFoundView } from '../notFound'
import { Message } from './message'
import { Model } from './model'
import styles from './view.module.css'

export const view = Submodel.defineView<Model, Message>((model, h) =>
  h.div(
    [],
    [
      h.header(
        [h.Class(styles.header)],
        [
          h.p([h.Class(styles.brand)], ['Tulsi']),
          h.div(
            [h.Class(styles.account)],
            [
              h.span([], [`Signed in as ${model.session.user.email}`]),
              Button.view(
                {
                  onClick: Message.ClickedSignOut(),
                  toView: attributes =>
                    h.button(
                      [...attributes.button, h.Class(styles.signOut)],
                      ['Sign out'],
                    ),
                },
                h,
              ),
            ],
          ),
        ],
      ),
      h.main(
        [h.Class(styles.main)],
        [
          Match.value(model.route).pipe(
            Match.tagsExhaustive({
              Home: () =>
                h.h1(
                  [h.Class(styles.welcome)],
                  [`Welcome, ${model.session.user.name}.`],
                ),
              NotFound: ({ path }) =>
                notFoundView(path, homeRouter(), 'Go home', h),
            }),
          ),
        ],
      ),
    ],
  ),
)
