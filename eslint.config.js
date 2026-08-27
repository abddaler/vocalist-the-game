// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Изоляция ядра (раздел 3 мастер-документа).
 * core/ — чистая симуляция: ноль импортов из phaser, game/, ui/, platform/.
 * Ловим и алиасы (@game/...), и относительные побеги (../../game/...).
 */
const CORE_FORBIDDEN = [
  { group: ['phaser', 'phaser/*'], message: 'core/ — чистая симуляция: Phaser здесь запрещён.' },
  { group: ['@game/*', '**/game/**'], message: 'core/ не имеет права знать о слое game/.' },
  { group: ['@ui/*', '**/ui/**'], message: 'core/ не имеет права знать о слое ui/.' },
  {
    group: ['@platform/*', '**/platform/**'],
    message: 'core/ не имеет права знать о слое platform/ (SaveAdapter, InputController).',
  },
  { group: ['@sim/*', '**/sim/**'], message: 'core/ не зависит от headless-симулятора.' },
];

/** Вся случайность — только через сидированный ГПСЧ из core/rng (раздел 3). */
const NO_MATH_RANDOM = {
  selector: "MemberExpression[object.name='Math'][property.name='random']",
  message: 'Math.random() запрещён. Используй сидированный ГПСЧ из core/rng.',
};

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-restricted-syntax': ['error', NO_MATH_RANDOM],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': 'off',
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: CORE_FORBIDDEN }],
    },
  },
  {
    // data/ — декларативный контент, тоже не должен тянуть движок.
    files: ['src/data/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['phaser', 'phaser/*'], message: 'data/ — чистые данные, без Phaser.' },
            { group: ['@game/*', '@ui/*'], message: 'data/ не зависит от слоёв отображения.' },
          ],
        },
      ],
    },
  },
);
