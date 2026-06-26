import { defineConfig } from 'orval'

const inputTarget =
  process.env.ORVAL_SWAGGER_URL ?? 'http://localhost:8080/api-docs/openapi.json'

export default defineConfig({
  petstore: {
    input: inputTarget,
    output: {
      target: './generated/api-types.ts',
      client: 'fetch',
    },
  },
})
