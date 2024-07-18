type SveltekitTemplateState = {
    installedDependencies: boolean;
    addedProviders: string[];
    usingDatabase?: 'turso' | 'xata';
};

export type { SveltekitTemplateState };
