import { context } from 'esbuild';
import { parseArgs } from 'node:util';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

const { values: options } = parseArgs({
	options: {
		watch: { short: 'w', type: 'boolean', default: false },
		preserve: { short: 'p', type: 'boolean', default: false },
		out: { short: 'o', type: 'string', default: 'dist' }
	},
});

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
					if(!options.preserve) {
						rmSync(options.out, { force: true, recursive: true });
					}
				});
				build.onEnd(() => {
					execSync('npx tsc -p tsconfig.json --outDir ' + options.out);
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
