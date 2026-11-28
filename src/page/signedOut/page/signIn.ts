import { Effect, Redacted, Schema, String } from 'effect'
import { Command, Submodel, type Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Api, ApiError, toApiError } from '../../../api/client'
import { Password, emptyPassword, makePassword } from '../../../domain/password'
import { Session, makeSession } from '../../../domain/session'
import { registerRouter } from '../../../route'
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
  email: Schema.String,
  password: Password,
  submission: Submission,
})
export type Model = typeof Model.Type

export const initModel = (): Model => ({
  email: '',
  password: emptyPassword(),
  submission: Submission.Idle(),
})

// MESSAGE

export const Message = defineMessageUnion({
  UpdatedEmail: { value: Schema.String },
  UpdatedPassword: { value: Password },
  SubmittedForm: {},
  SucceededSignIn: { session: Session },
  FailedSignIn: { error: ApiError },
})
export type Message = typeof Message.Type

// OUT MESSAGE

export const OutMessage = defineMessageUnion({
  SucceededSignIn: { session: Session },
})
export type OutMessage = typeof OutMessage.Type

// COMMAND

export const SignIn = Command.define('SignIn', {
  args: { email: Schema.String, password: Password },
  messages: [Message.SucceededSignIn, Message.FailedSignIn],
  execute: ({ email, password }) =>
    Effect.gen(function* () {
      const api = yield* Api
      const response = yield* api.anonymous.login({
        payload: { email, password: Redacted.value(password) },
      })
      return Message.SucceededSignIn({ session: makeSession(response) })
    }).pipe(
      Effect.catch(error =>
        Effect.map(toApiError(error), apiError =>
          Message.FailedSignIn({ error: apiError }),
        ),
      ),
    ),
})

// UPDATE

const canSubmit = (model: Model): boolean =>
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
          SignIn({ email: String.trim(model.email), password: model.password }),
        ],
      }
    },

    SucceededSignIn: ({ session }) => ({
      model: initModel(),
      outMessage: OutMessage.SucceededSignIn({ session }),
    }),

    FailedSignIn: ({ error }) => ({
      model: modifyFields(model, {
        submission: () => Submission.Failed({ error }),
      }),
    }),
  })

// VIEW

const errorMessage = (error: ApiError): string =>
  ApiError.match(error, {
    Unauthorized: () => 'Incorrect email or password.',
    BadRequest: ({ message }) => message,
    NetworkError: () => NETWORK_ERROR,
    NotFound: () => UNEXPECTED_ERROR,
    Conflict: () => UNEXPECTED_ERROR,
    ServerError: () => UNEXPECTED_ERROR,
    InvalidResponse: () => UNEXPECTED_ERROR,
  })

export const view = Submodel.defineView<Model, Message>((model, h) =>
  h.section(
    [h.Class(formStyles.card)],
    [
      h.h1([h.Class(formStyles.title)], ['Sign in']),
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
              autocomplete: 'current-password',
              value: Redacted.value(model.password),
              onInput: value =>
                Message.UpdatedPassword({ value: makePassword(value) }),
            },
            h,
          ),
          submitButtonView(
            isSubmitting(model.submission) ? 'Signing in…' : 'Sign in',
            !canSubmit(model),
            h,
          ),
        ],
      ),
      h.p(
        [h.Class(formStyles.footer)],
        [
          'New to Tulsi? ',
          h.a(
            [h.Href(registerRouter()), h.Class(formStyles.link)],
            ['Register'],
          ),
        ],
      ),
    ],
  ),
)
