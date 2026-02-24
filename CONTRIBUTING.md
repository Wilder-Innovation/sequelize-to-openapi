# Contributing to sequelize-to-openapi

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js >= 16
- npm >= 8

### Setup

```bash
git clone https://github.com/your-org/sequelize-to-openapi.git
cd sequelize-to-openapi
npm install
```

### Running Tests

```bash
npm test
```

Tests use [Vitest](https://vitest.dev/) and run against a real in-memory SQLite database.

### Building

```bash
npm run build
```

This compiles TypeScript to both ESM (`dist/esm/`) and CommonJS (`dist/cjs/`) outputs.

### Linting / Type Checking

```bash
npm run lint
```

---

## Project Structure

```
src/
├── index.ts        Main export + public API
├── convert.ts      Core model → schema conversion
├── datatypes.ts    Sequelize DataType → OpenAPI mapping
├── validations.ts  Sequelize validate:{} → OpenAPI constraints
└── types.ts        TypeScript interfaces
tests/
├── setup.ts        Shared Sequelize SQLite instance
├── basic.test.ts   Core conversion behaviour
├── datatypes.test.ts  All DataType mappings
├── options.test.ts    Options API tests
└── validations.test.ts  Validation extraction tests
```

---

## How to Contribute

### Reporting Bugs

Open an issue describing:
1. What you did
2. What you expected
3. What actually happened
4. Minimal reproduction code

### Adding a New DataType Mapping

1. Add the mapping in `src/datatypes.ts` (the `switch` in `mapDataType()`)
2. Add a test in `tests/datatypes.test.ts`
3. Update the mapping table in `README.md`

### Adding a New Validation Mapping

1. Add the rule in `src/validations.ts` (the `for...of` in `applyValidations()`)
2. Add a test in `tests/validations.test.ts`
3. Update the validation table in `README.md`

---

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Add tests for new behaviour
- Run `npm test` and `npm run lint` before submitting
- Update `README.md` if the public API changes
- Use conventional commit messages: `feat:`, `fix:`, `docs:`, `test:`, `chore:`

---

## Code Style

- TypeScript strict mode is enabled
- `4-space` indentation
- Prefer explicit types over inference for public API surfaces
- Keep functions small and focused

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
