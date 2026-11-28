import { Effect, Redacted, Schema, String } from 'effect'
import { Command, Submodel, type Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Api, ApiError, toApiError } from '../../../api/client'
import { Password, emptyPassword, makePassword } from '../../../domain/password'
import { Session, makeSession } from '../../../domain/session'
import { signInRouter } from '../../../route'
import {
  formErrorView,
  formStyles,
  submitButtonView,
  textFieldView,
} from '../../../ui/form'
import {
  NETWORK_ERROR,
  Submission,
  UNEXPECTED_ERROR,
  isSubmitting,
} from '../submission'

// MODEL

export const Model = Schema.Struct({
  name: Schema.String,
  email: Schema.String,
  password: Password,
  submission: Submission,
})
export type Model = typeof Model.Type

export const initModel = (): Model => ({
  name: '',
  email: '',
  password: emptyPassword(),
  submission: Submission.Idle(),
})

// MESSAGE

export const Message = defineMessageUnion({
  UpdatedName: { value: Schema.String },
  UpdatedEmail: { value: Schema.String },
  UpdatedPassword: { value: Password },
  SubmittedForm: {},
  SucceededRegister: { session: Session },
  FailedRegister: { error: ApiError },
})
export type Message = typeof Message.Type

// OUT MESSAGE

export const OutMessage = defineMessageUnion({
  SucceededRegister: { session: Session },
})
export type OutMessage = typeof OutMessage.Type

// COMMAND

export const Register = Command.define('Register', {
  args: { name: Schema.String, email: Schema.String, password: Password },
  messages: [Message.SucceededRegister, Message.FailedRegister],
  execute: ({ name, email, password }) =>
    Effect.gen(function* () {
      const api = yield* Api
      const response = yield* api.anonymous.register({
        payload: { name, email, password: Redacted.value(password) },
      })
      return Message.SucceededRegister({ session: makeSession(response) })
    }).pipe(
      Effect.catch(error =>
        Effect.map(toApiError(error), apiError =>
          Message.FailedRegister({ error: apiError }),
        ),
      ),
    ),
})

// UPDATE

const canSubmit = (model: Model): boolean =>
  String.isNonEmpty(String.trim(model.name)) &&
  String.isNonEmpty(String.trim(model.email)) &&
  String.isNonEmpty(Redacted.value(model.password)) &&
  !isSubmitting(model.submission)

export type UpdateReturn = Update.ReturnWithOutMessage<
  Model,
  Message,
  OutMessage,
  Api
>

export const update = (model: Model, message: Message) =>
  Message.match<UpdateReturn>(message, {
    UpdatedName: ({ value }) => ({
      model: modifyFields(model, { name: () => value }),
    }),

    UpdatedEmail: ({ value }) => ({
      model: modifyFields(model, { email: () => value }),
    }),

    UpdatedPassword: ({ value }) => ({
      model: modifyFields(model, { password: () => value }),
    }),

    SubmittedForm: () => {
      if (!canSubmit(model)) {
        return { model }
      }
      return {
        model: modifyFields(model, {
          submission: () => Submission.Submitting(),
        }),
        commands: [
          Register({
            name: String.trim(model.name),
            email: String.trim(model.email),
            password: model.password,
          }),
        ],
      }
    },

    SucceededRegister: ({ session }) => ({
      model: initModel(),
      outMessage: OutMessage.SucceededRegister({ session }),
    }),

    FailedRegister: ({ error }) => ({
      model: modifyFields(model, {
        submission: () => Submission.Failed({ error }),
      }),
    }),
  })

// VIEW

const errorMessage = (error: ApiError): string =>
  ApiError.match(error, {
    Conflict: () => 'That email is already registered.',
    BadRequest: ({ message }) => message,
    NetworkError: () => NETWORK_ERROR,
    Unauthorized: () => UNEXPECTED_ERROR,
    NotFound: () => UNEXPECTED_ERROR,
    ServerError: () => UNEXPECTED_ERROR,
    InvalidResponse: () => UNEXPECTED_ERROR,
  })

export const view = Submodel.defineView<Model, Message>((model, h) =>
  h.section(
    [h.Class(formStyles.card)],
    [
      h.h1([h.Class(formStyles.title)], ['Register']),
      h.form(
        [h.Class(formStyles.form), h.OnSubmit(Message.SubmittedForm())],
        [
          Submission.match(model.submission, {
            Failed: ({ error }) => formErrorView(errorMessage(error), h),
            Idle: () => h.empty,
            Submitting: () => h.empty,
          }),
          textFieldView(
            {
              id: 'name',
              label: 'Name',
              type: 'text',
              autocomplete: 'name',
              value: model.name,
              onInput: value => Message.UpdatedName({ value }),
            },
            h,
          ),
          textFieldView(
            {
              id: 'email',
              label: 'Email',
              type: 'email',
              autocomplete: 'email',
              value: model.email,
              onInput: value => Message.UpdatedEmail({ value }),
            },
            h,
          ),
          textFieldView(
            {
              id: 'password',
              label: 'Password',
              type: 'password',
              autocomplete: 'new-password',
              value: Redacted.value(model.password),
              onInput: value =>
                Message.UpdatedPassword({ value: makePassword(value) }),
            },
            h,
          ),
          submitButtonView(
            isSubmitting(model.submission) ? 'Registering…' : 'Register',
            !canSubmit(model),
            h,
          ),
        ],
      ),
      h.p(
        [h.Class(formStyles.footer)],
        [
          'Already registered? ',
          h.a([h.Href(signInRouter()), h.Class(formStyles.link)], ['Sign in']),
        ],
      ),
    ],
  ),
)
