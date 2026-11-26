import fs from 'node:fs/promises';
import path from 'node:path';

export async function scaffoldHexagonalBackend(
  dir: string,
  language: 'rust' | 'golang',
  module: string,
  source: string,
  test?: string,
): Promise<string[]> {
  if (language === 'rust') {
    for (const folder of ['adapters', 'domain', 'ports'])
      await fs.mkdir(path.join(dir, 'src', folder), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'src/adapters/http.rs'),
      source.replace('#[tokio::main]\nasync fn main()', 'pub async fn serve()'),
    );
    await fs.writeFile(path.join(dir, 'src/adapters/mod.rs'), 'pub mod http;\n');
    await fs.writeFile(path.join(dir, 'src/domain/mod.rs'), '// Business modules belong here.\n');
    await fs.writeFile(
      path.join(dir, 'src/ports/mod.rs'),
      '// Define domain-facing interfaces here.\n',
    );
    await fs.writeFile(
      path.join(dir, 'src/main.rs'),
      'pub mod adapters;\npub mod domain;\npub mod ports;\n\n#[tokio::main]\nasync fn main() -> Result<(), Box<dyn std::error::Error>> { adapters::http::serve().await }\n',
    );
    return [
      'src/main.rs',
      'src/adapters/http.rs',
      'src/adapters/mod.rs',
      'src/domain/mod.rs',
      'src/ports/mod.rs',
    ];
  }
  const adapter = path.join(dir, 'internal/adapters/http');
  await fs.mkdir(adapter, { recursive: true });
  await fs.writeFile(
    path.join(adapter, 'server.go'),
    source.replace('package main', 'package httpadapter').replace('func main()', 'func Serve()'),
  );
  await fs.writeFile(
    path.join(adapter, 'server_test.go'),
    (test ?? '').replace('package main', 'package httpadapter'),
  );
  await fs.writeFile(
    path.join(dir, 'main.go'),
    `package main\nimport httpadapter "${module}/internal/adapters/http"\nfunc main() { httpadapter.Serve() }\n`,
  );
  await fs.rm(path.join(dir, 'main_test.go'), { force: true });
  return ['main.go', 'internal/adapters/http/server.go', 'internal/adapters/http/server_test.go'];
}
