import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['src/index.ts', 'src/prompts.ts', 'src/template-files.ts', 'src/util.ts'],
	failOnWarn: false,
	declaration: true,
	clean: true,
	outDir: '.',
});
