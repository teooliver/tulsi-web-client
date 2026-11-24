import { Html, HtmlBuilder } from 'foldkit/html'

import { formStyles } from '../ui/form'

export const notFoundView = <Message>(
  path: string,
  backLinkHref: string,
  backLinkText: string,
  h: HtmlBuilder<Message>,
): Html =>
  h.section(
    [h.Class(formStyles.card)],
    [
      h.h1([h.Class(formStyles.title)], ['Page not found']),
      h.p([], [`Nothing lives at "${path}".`]),
      h.a([h.Href(backLinkHref), h.Class(formStyles.link)], [backLinkText]),
    ],
  )
