# Test monorepo for issue
https://github.com/microsoft/vscode-eslint/issues/1796

## Setup
- `pnpm install`

## Problem description
The ESLint extension stops linting newly opened files once it has been restarted manually with command 'ESLint: Restart ESLint Server'.

### Steps to reproduce
- Open the monorepo in VSCode
- Open `packages/pkg-a/src/hello-a-1.ts` => Linting works (unused variable error)
- Also open `packages/pkg-a/src/hello-a-2.ts` => Linting works (in both files)
- Close `hello-a-2.ts`
- Execute command 'ESLint: Restart ESLint Server'
- Linting is still working in the already opened file `hello-a-1.ts`
- Open `hello-a-2.ts` => Linting does not work.
- Keep both files open and execute command 'ESLint: Restart ESLint Server'
- Linting works in both opened files
- Close one or both of the files and open any (other) file => Linting does not work

### Notes
- After a manual restart, when modifying and saving `eslint.config.js`, all opened files are checked. However, this only works for already opened files.

## Environment
- VSCode: 1.89.1
- ESLint extension: v3.0.7
- Node: 22.2.0
- ESLint: 9.3.0
