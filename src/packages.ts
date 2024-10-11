type Package = { name: string; version: string; scope: 'dev' | 'regular' };

// Packages are kept here so that keeping track of versioning is easier

const packages = {
	arktype: {
		name: 'arktype',
		scope: 'regular',
		version: '^2.0.0-beta.0',
	},
	joi: {
		name: 'joi',
		scope: 'regular',
		version: '^17.13.3',
	},
	'@exodus/schemasafe': {
		name: '@exodus/schemasafe',
		scope: 'regular',
		version: '^1.3.0',
	},
	superstruct: {
		name: 'superstruct',
		scope: 'regular',
		version: '^2.0.2',
	},
	'@sinclair/typebox': {
		name: '@sinclair/typebox',
		scope: 'regular',
		version: '^0.32.34',
	},
	valibot: {
		name: 'valibot',
		scope: 'regular',
		version: '^0.36.0',
	},
	'@vinejs/vine': {
		name: '@vinejs/vine',
		scope: 'regular',
		version: '^2.1.0',
	},
	yup: {
		name: 'yup',
		scope: 'regular',
		version: '^1.4.0',
	},
	'tailwind-variants': {
		name: 'tailwind-variants',
		scope: 'regular',
		version: '^0.2.1',
	},
	clsx: {
		name: 'clsx',
		scope: 'regular',
		version: '^2.1.1',
	},
	'tailwind-merge': {
		name: 'tailwind-merge',
		scope: 'regular',
		version: '^2.4.0',
	},
	'lucide-svelte': {
		name: 'lucide-svelte',
		scope: 'regular',
		version: '^0.412.0',
	},
	'svelte-radix': {
		name: 'svelte-radix',
		scope: 'regular',
		version: '^1.1.0',
	},
	'sveltekit-adapter-iis': {
		name: 'sveltekit-adapter-iis',
		scope: 'dev',
		version: '^1.2.5',
	},
	'@vercel/analytics': {
		name: '@vercel/analytics',
		scope: 'dev',
		version: '^1.3.1',
	},
	'@vercel/speed-insights': {
		name: '@vercel/speed-insights',
		scope: 'dev',
		version: '^1.0.12',
	},
	'@auth/sveltekit': {
		name: '@auth/sveltekit',
		scope: 'regular',
		version: '^1.4.1',
	},
	'drizzle-orm': {
		name: 'drizzle-orm',
		scope: 'regular',
		version: '^0.32.0',
	},
	'@xata.io/client': {
		name: '@xata.io/client',
		scope: 'regular',
		version: '^0.30.0',
	},
	pg: {
		name: 'pg',
		scope: 'regular',
		version: '^8.12.0',
	},
	'@xata.io/kysely': {
		name: '@xata.io/kysely',
		scope: 'regular',
		version: '^0.2.0',
	},
	kysely: {
		name: 'kysely',
		scope: 'regular',
		version: '^0.27.4',
	},
	dotenv: {
		name: 'dotenv',
		scope: 'regular',
		version: '^16.4.5',
	},
	'sveltekit-superforms': {
		name: 'sveltekit-superforms',
		scope: 'regular',
		version: '^2.16.0',
	},
	zod: {
		name: 'zod',
		scope: 'regular',
		version: '^3.23.8',
	},
	'@threlte/core': {
		name: '@threlte/core',
		scope: 'regular',
		version: '^7.3.1',
	},
	three: {
		name: 'three',
		scope: 'regular',
		version: '^0.166.1',
	},
	'@types/three': {
		name: '@types/three',
		scope: 'dev',
		version: '^0.166.0',
	},
	'@threlte/extras': {
		name: '@threlte/extras',
		scope: 'regular',
		version: '^8.11.4',
	},
	'@threlte/gltf': {
		name: '@threlte/gltf',
		scope: 'regular',
		version: '^2.0.3',
	},
	'@threlte/rapier': {
		name: '@threlte/rapier',
		scope: 'regular',
		version: '^2.0.1',
	},
	'@threlte/theatre': {
		name: '@threlte/theatre',
		scope: 'regular',
		version: '^2.1.8',
	},
	'@threlte/xr': {
		name: '@threlte/xr',
		scope: 'regular',
		version: '^0.1.4',
	},
	'@threlte/flex': {
		name: '@threlte/flex',
		scope: 'regular',
		version: '^1.0.3',
	},
	typescript: {
		name: 'typescript',
		scope: 'dev',
		version: '^5.6.2',
	},
	unbuild: {
		name: 'unbuild',
		scope: 'dev',
		version: '^2.0.0',
	},
	'@types/fs-extra': {
		name: '@types/fs-extra',
		scope: 'dev',
		version: '^11.2.0',
	},
	prettier: {
		name: 'prettier',
		scope: 'dev',
		version: '^3.3.3',
	},
	'drizzle-kit': {
		name: 'drizzle-kit',
		scope: 'dev',
		version: '^0.23.0',
	},
	'@libsql/client': {
		name: '@libsql/client',
		scope: 'regular',
		version: '^0.7.0',
	},
	vitest: {
		name: 'vitest',
		scope: 'dev',
		version: '^2.1.1',
	},
	'@changesets/cli': {
		name: '@changesets/cli',
		scope: 'dev',
		version: '^2.27.8',
	},
	'@types/node': {
		name: '@types/node',
		scope: 'dev',
		version: '^22.5.5',
	},
	'@biomejs/biome': {
		name: '@biomejs/biome',
		scope: 'dev',
		version: '1.9.1',
	},
} satisfies Record<string, Package>;

const pkgs = packages as Record<keyof typeof packages, Package>;

export { pkgs as packages };
