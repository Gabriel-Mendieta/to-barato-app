import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'src/shared/theme/tokens.ts');
const outputPath = path.join(root, 'src/shared/theme/tailwind-tokens.cjs');
const source = fs.readFileSync(sourcePath, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
  fileName: sourcePath,
});

const runtimeModule = new Module(sourcePath);
runtimeModule.filename = sourcePath;
runtimeModule.paths = Module._nodeModulePaths(root);
runtimeModule._compile(outputText, sourcePath);

const { colors, darkColors, spacing, radii, typography } = runtimeModule.exports;
const generated = `// Generated from src/shared/theme/tokens.ts. Do not edit manually.
module.exports = ${JSON.stringify(
  { colors, darkColors, spacing, radii, typography },
  null,
  2
)};
`;
fs.writeFileSync(outputPath, generated);
