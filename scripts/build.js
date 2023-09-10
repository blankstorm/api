import { context } from 'esbuild';
import { parseArgs } from 'node:util';
import { execSync } from 'node:child_process';
import { rmSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';

const { values: options } = parseArgs({
	options: {
		watch: { short: 'w', type: 'boolean', default: false },
		preserve: { short: 'p', type: 'boolean', default: false },
		out: { short: 'o', type: 'string', default: 'dist' },
	},
});

function updateImports(filePath) {
	const content = readFileSync(filePath, 'utf-8');
	const updatedContent = content.replace(/(\s*import\s+[^'"]+\s+from\s+['"])([^'"]+)(['"])/g, '$1$2.js$3');
	writeFileSync(filePath, updatedContent);
}

// Function to recursively update imports in a directory
function updateImportsInDirectory(directory) {
	for(const file of readdirSync(directory)){
		const filePath = path.join(directory, file);
		if (statSync(filePath).isFile() && filePath.endsWith('.js')) {
			updateImports(filePath);
		} else if (statSync(filePath).isDirectory()) {
			updateImportsInDirectory(filePath);
		}
	}
}

const ctx = await context({
	entryPoints: ['src/index.ts'],
	outfile: path.join(options.out, 'api.js'),
	format: 'esm',
	platform: 'neutral',
	keepNames: true,
	sourcemap: true,
	bundle: true,
	minify: true,
	plugins: [
		{
			name: 'types',
			setup(build) {
				build.onStart(() => {
					if (!options.preserve) {
						rmSync(options.out, { force: true, recursive: true });
					}
				});
				build.onEnd(() => {
					try {
						execSync('npx tsc -p tsconfig.json --outDir ' + options.out);
						updateImportsInDirectory(options.out);
					} catch (error) {
						console.error(error);
					}
				});
			},
		},
	],
});

if (options.watch) {
	console.log('Watching...');
	await ctx.watch();
} else {
	await ctx.rebuild();
	await ctx.dispose();
}
