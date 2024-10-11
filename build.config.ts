import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['src/index', 'src/util', 'src/packages', 'src/types'],
	declaration: true,
	clean: true,
});
