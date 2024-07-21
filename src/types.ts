export type SveltekitTemplateState = {
	installedDependencies: boolean;
	addedProviders: string[];
	usingDatabase?: 'turso' | 'xata';
	shadcnSvelteConfig: {
		style: 'default' | 'new-york';
	};
};
