import type { BootstrapConfig, Framework } from '../../../../types/index.js';
export function backendConfig(framework: Framework): BootstrapConfig {
  const rust = framework === 'axum' || framework === 'hyper';
  return {
    version: '1.0.0',
    project: {
      name: 'chatify.stack',
      description: 'Native regression',
      author: 'dev',
      codeowners: false,
    },
    stack: {
      languages: ['typescript', rust ? 'rust' : 'golang'],
      packageManager: 'yarn',
      monorepo: true,
      useMakefiles: false,
      frameworks: [framework, 'react-vite', 'vitest'],
      tools: [],
      agents: [],
    },
    workspace: {
      apps: [
        { name: 'api', language: rust ? 'rust' : 'golang', framework, kind: 'backend' },
        { name: 'web', language: 'typescript', framework: 'react-vite', kind: 'web' },
      ],
      packages: rust ? [{ name: 'contracts', language: 'rust', framework, kind: 'library' }] : [],
    },
    architecture: {
      pattern: 'hexagonal',
      folderOrganization: 'module-based',
      fileNaming: 'snake_case',
      testOrganization: 'dedicated-tests',
      strictBoundaries: true,
      pathAliases: true,
      barrelExports: true,
      exampleModule: false,
    },
  };
}
