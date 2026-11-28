import { Html, HtmlBuilder } from 'foldkit/html'

import { Button, Input } from '@foldkit/ui'

import styles from './form.module.css'

export { styles as formStyles }

type TextFieldConfig<Message> = Readonly<{
  id: string
  label: string
  type: 'text' | 'email' | 'password'
  autocomplete: string
  value: string
  onInput: (value: string) => Message
}>

export const textFieldView = <Message>(
  config: TextFieldConfig<Message>,
  h: HtmlBuilder<Message>,
): Html =>
  Input.view(
    {
      id: config.id,
      name: config.id,
      type: config.type,
      value: config.value,
      onInput: config.onInput,
      toView: attributes =>
        h.div(
          [h.Class(styles.field)],
          [
            h.label(
              [...attributes.label, h.Class(styles.label)],
              [config.label],
            ),
            h.input([
              ...attributes.input,
              h.Autocomplete(config.autocomplete),
              h.Class(styles.input),
            ]),
          ],
        ),
    },
    h,
  )

export const submitButtonView = <Message>(
  label: string,
  isDisabled: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  Button.view(
    {
      type: 'submit',
      isDisabled,
      toView: attributes =>
        h.button([...attributes.button, h.Class(styles.button)], [label]),
    },
    h,
  )

export const formErrorView = <Message>(
  message: string,
  h: HtmlBuilder<Message>,
): Html => h.p([h.Role('alert'), h.Class(styles.error)], [message])
