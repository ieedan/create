<div align="center">
  <img src="https://github.com/user-attachments/assets/5b77a29a-7a9f-4f45-bb9a-1a2810963bcd">
</div>

# @iedan/create

Project templates to quickly spin up projects the way I like to build them.

To install a template run:

```bash
npx @iedan/create
```

## Templates

### SvelteKit

A starter project for **SvelteKit**.

```bash
npx @iedan/create -t sveltekit
```

Comes installed with:

-   [TailwindCSS](https://tailwindcss.com/) (CSS)
-   [shadcn-svelte](https://www.shadcn-svelte.com/) (UI) (Now Configurable!)
-   [mode-watcher](https://github.com/svecosystem/mode-watcher) (light/dark mode)
-   [prettier](https://prettier.io/) Formatting
-   [eslint](https://eslint.org/) Linting

And allows you to choose to add:

#### Deployment Environments

-   Auto
-   [Vercel](https://kit.svelte.dev/docs/adapter-vercel)
-   [IIS](https://github.com/abaga129/sveltekit-adapter-iis)

#### Authentication

-   [Auth.js](https://authjs.dev/)

#### Database

-   [Xata](https://xata.io/)
    -   With [Drizzle](https://orm.drizzle.team/)
    -   Or [Kysely](https://kysely.dev/)
-   [Turso](https://turso.tech/)
    -   With [Drizzle](https://orm.drizzle.team/)

#### Other Features

-   [threlte](https://threlte.xyz/)
-   [sveltekit-superforms](https://superforms.rocks/)

### template-factory

A project template to get you started creating your own project templates with [template-factory-js](https://github.com/ieedan/template-factory-js).

```bash
npx @iedan/create -t template-factory
```

### ts-package

A project template to get you started creating a npm package with TypeScript.

#### Features

-   [biome](https://biomejs.dev/)
-   [changesets](https://github.com/changesets/changesets)
-   [vitest](https://vitest.dev/)
-   [ts-blocks](https://github.com/ieedan/ts-blocks)

## Development

To test the cli run:

```
npm run start
```
