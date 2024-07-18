type Package = {
    name: string;
    version: string;
    scope: 'dev' | 'regular';
};
declare const packages: Record<string, Package>;

export { packages };
