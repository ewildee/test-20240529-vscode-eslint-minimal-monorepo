import type { TSESLint } from '@typescript-eslint/utils';
import type { ConfigWithExtends } from 'typescript-eslint';

export type Options = {
  /**
   * Patterns of directories to be treated as workspaces.
   * 
   * @default ['packages/*']
   */
  workspaces: string[];
  
  /**
   * Patterns of directories to be treated as Svelte workspaces,
   * to which specific Svelte/TypeScript rules/overrides are applied.
   * 
   * These workspaces are also merged into `workspaces`.
   */
  svelteWorkspaces?: string[];
  
  /**
   * The current working directory.
   *
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Additional configuration overrides.
   */
  configs?: ConfigWithExtends[];
}

/**
 * Our default ESLint configuration.
 */
export function config(options: Options): Promise<TSESLint.FlatConfig.ConfigArray>;
