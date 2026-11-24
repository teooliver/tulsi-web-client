import { Runtime } from 'foldkit'

import { Api } from './api/client'
import { Flags, flags, init } from './main'
import { Message } from './message'
import { Model } from './model'
import { update } from './update'
import { view } from './view'

const application = Runtime.makeApplication({
  Model,
  Flags,
  init,
  update,
  view,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
  resources: Api.layer,
  devTools: {
    Message,
  },
})

Runtime.run(application, { flags })
