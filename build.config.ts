import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['src/index', 'src/util', 'src/packages', 'src/types'],
	failOnWarn: false,
	declaration: true,
	clean: true,
});
