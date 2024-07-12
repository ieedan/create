import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['src/index', 'src/prompts', 'src/template-files', 'src/util'],
	failOnWarn: false,
	declaration: true,
	clean: true,
	outDir: '.',
});
