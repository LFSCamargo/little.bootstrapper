import fs from 'node:fs/promises';
import path from 'node:path';
import type { BootstrapConfig, WorkspaceEntry } from '../../types/index.js';

export async function scaffoldNativeModule(
  root: string,
  name: string,
  config: BootstrapConfig,
  entry: WorkspaceEntry,
): Promise<string[]> {
  const bucket = config.workspace.apps.includes(entry) ? 'apps' : 'packages';
  const relative = `${bucket}/${entry.name}`;
  const dir = path.join(root, relative);
  let identifier = name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  if (
    !/^[a-z]/.test(identifier) ||
    [
      'type',
      'mod',
      'self',
      'crate',
      'super',
      'pub',
      'fn',
      'use',
      'struct',
      'enum',
      'match',
      'impl',
      'trait',
      'async',
      'await',
      'break',
      'default',
      'func',
      'interface',
      'select',
      'case',
      'defer',
      'go',
      'map',
      'chan',
      'else',
      'goto',
      'package',
      'switch',
      'const',
      'fallthrough',
      'if',
      'range',
      'continue',
      'for',
      'import',
      'return',
      'var',
    ].includes(identifier)
  )
    identifier = `module_${identifier}`;
  const folder =
    config.architecture.pattern === 'hexagonal'
      ? 'domain'
      : config.architecture.pattern === 'clean'
        ? 'use_cases'
        : config.architecture.pattern === 'vertical-slice'
          ? 'features'
          : config.architecture.pattern === 'layered'
            ? 'services'
            : 'modules';
  const created: string[] = [];
  if (entry.language === 'rust') {
    const moduleDir = path.join(dir, 'src', folder);
    await fs.mkdir(moduleDir, { recursive: true });
    const file = `${identifier}.rs`;
    if (
      await fs.stat(path.join(moduleDir, file)).then(
        () => true,
        (error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
          return false;
        },
      )
    )
      throw new Error(`Module already exists: ${name}`);
    const serviceName = `${config.project.name}-${entry.name}`;
    const content =
      name === 'health'
        ? `use shared_contracts::HealthResponse;\nuse std::sync::OnceLock;\nuse std::time::Instant;\n\nstatic STARTED: OnceLock<Instant> = OnceLock::new();\n\npub fn health_payload() -> HealthResponse {\n    HealthResponse {\n        status: "ok".into(),\n        service: "${serviceName}".into(),\n        version: "0.1.0".into(),\n        timestamp: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),\n        uptime_seconds: STARTED.get_or_init(Instant::now).elapsed().as_secs_f64(),\n    }\n}\n\n#[cfg(test)]\nmod tests {\n    use super::*;\n    #[test]\n    fn health_payload_matches_contract() {\n        let payload = health_payload();\n        assert_eq!(payload.status, "ok");\n        assert_eq!(payload.service, "${serviceName}");\n    }\n}\n`
        : `pub fn execute() -> &'static str { "${name}" }\n\n#[cfg(test)]\nmod tests {\n    #[test]\n    fn executes_generated_module() { assert_eq!(super::execute(), "${name}"); }\n}\n`;
    await fs.writeFile(path.join(moduleDir, file), content);
    const mod = path.join(moduleDir, 'mod.rs');
    const old = await fs.readFile(mod, 'utf8').catch(() => '');
    const declaration = `pub mod ${identifier};`;
    if (!old.includes(declaration)) await fs.writeFile(mod, old + '\n' + declaration + '\n');
    const main = path.join(dir, 'src', bucket === 'apps' ? 'main.rs' : 'lib.rs');
    const original = await fs.readFile(main, 'utf8');
    if (!original.includes(`mod ${folder};`))
      await fs.writeFile(main, `pub mod ${folder};\n` + original);
    created.push(
      `${relative}/src/${folder}/${file}`,
      `${relative}/src/${folder}/mod.rs`,
      `${relative}/src/${path.basename(main)}`,
    );
  } else {
    const moduleDir = path.join(dir, 'internal', folder, identifier);
    await fs.mkdir(moduleDir, { recursive: true });
    if (
      await fs.stat(path.join(moduleDir, `${identifier}.go`)).then(
        () => true,
        (error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
          return false;
        },
      )
    )
      throw new Error(`Module already exists: ${name}`);
    const serviceName = `${config.project.name}-${entry.name}`;
    const goContent =
      name === 'health'
        ? `package ${identifier}\n\nimport "time"\n\ntype HealthResponse struct {\n\tStatus string \`json:"status"\`\n\tService string \`json:"service"\`\n\tVersion string \`json:"version"\`\n\tTimestamp string \`json:"timestamp"\`\n\tUptimeSeconds float64 \`json:"uptimeSeconds"\`\n}\n\nvar startedAt = time.Now()\n\nfunc HealthPayload() HealthResponse {\n\treturn HealthResponse{Status: "ok", Service: "${serviceName}", Version: "0.1.0", Timestamp: time.Now().UTC().Format(time.RFC3339), UptimeSeconds: time.Since(startedAt).Seconds()}\n}\n`
        : `package ${identifier}\n\nfunc Execute() string { return "${name}" }\n`;
    const goTest =
      name === 'health'
        ? `package ${identifier}\nimport "testing"\nfunc TestHealthPayload(t *testing.T) { p := HealthPayload(); if p.Status != "ok" || p.Service != "${serviceName}" { t.Fatalf("invalid health: %+v", p) } }\n`
        : `package ${identifier}\nimport "testing"\nfunc TestExecute(t *testing.T) { if Execute() != "${name}" { t.Fatal("incorrect generated behavior") } }\n`;
    await fs.writeFile(path.join(moduleDir, `${identifier}.go`), goContent);
    await fs.writeFile(path.join(moduleDir, `${identifier}_test.go`), goTest);
    created.push(
      `${relative}/internal/${folder}/${identifier}/${identifier}.go`,
      `${relative}/internal/${folder}/${identifier}/${identifier}_test.go`,
    );
  }
  return created;
}
