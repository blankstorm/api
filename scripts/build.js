import { context } from 'esbuild';
import { parseArgs } from 'node:util';
import { execSync } from 'node:child_process';

const { values: flags } = parseArgs({
	options: {
		watch: { short: 'w', type: 'boolean', default: false },
		types: { short: 't', type: 'boolean', default: false },
	},
});

const ctx = await context({
	entryPoints: ['src/index.ts'],
	outfile: 'dist/api.js',
	format: 'esm',
	platform: 'neutral',
	keepNames: true,
	sourcemap: true,
	bundle: true,
	minify: true,
	plugins: [
		{
			name: 'types',
			setup() {
				if (flags.types) {
					execSync('npx tsc -p tsconfig.json --emitDeclarationOnly');
				}
			},
		},
	],
});

if (flags.watch) {
	console.log('Watching...');
	await ctx.watch();
} else {
	await ctx.rebuild();
	await ctx.dispose();
}
