import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'index',
  ],
  failOnWarn: false,
  declaration: true,
  clean: true,
})