// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // Your custom configs here
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn', // ou 'error' si vous préférez une erreur plutôt qu'un avertissement
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-unused-vars': [ // Règle de base JavaScript, si @typescript-eslint/no-unused-vars n'est pas active partout
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  }
})
