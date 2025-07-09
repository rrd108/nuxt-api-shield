import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addServerHandler,
  addServerImports,
} from '@nuxt/kit'
import defu from 'defu'
import type { LogEntry } from './runtime/server/types/LogEntry'

export interface NuxtApiShieldSecurityOptions {
  trustXForwardedFor?: boolean;
}

export interface ModuleOptions {
  limit: {
    max: number
    duration: number
    ban: number
  }
  delayOnBan: boolean
  errorMessage: string
  retryAfterHeader: boolean
  log?: LogEntry
  routes: string[]
  ipTTL?: number;
  security?: NuxtApiShieldSecurityOptions;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-api-shield',
    configKey: 'nuxtApiShield',
  },
  defaults: {
    limit: {
      max: 12,
      duration: 108, // seconds
      ban: 3600,     // seconds
    },
    delayOnBan: true,
    errorMessage: 'Too Many Requests',
    retryAfterHeader: false,
    log: { path: '', attempts: 0 }, // Logging disabled by default
    routes: [],
    ipTTL: 7 * 24 * 60 * 60, // 7 days in seconds
    security: {
      trustXForwardedFor: true, // Default to true for backward compatibility, with warnings in README
    },
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Ensure options are deeply merged with defaults and then with user's runtimeConfig
    const mergedOptions = defu(
      options, // User's direct module options
      nuxt.options.runtimeConfig.public.nuxtApiShield, // User's runtimeConfig overrides
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.schema[ModuleOptions], // Nuxt schema defaults if any (less common for modules like this)
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.modules[ModuleOptions], // Module defaults from nuxt.options.modules
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.buildModules[ModuleOptions], // Module defaults from nuxt.options.buildModules
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options[ModuleOptions], // Module defaults from nuxt.options
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.app[ModuleOptions], // Module defaults from nuxt.options.app
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.nitro[ModuleOptions], // Module defaults from nuxt.options.nitro
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.vite[ModuleOptions], // Module defaults from nuxt.options.vite
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.webpack[ModuleOptions], // Module defaults from nuxt.options.webpack
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.postcss[ModuleOptions], // Module defaults from nuxt.options.postcss
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.experimental[ModuleOptions], // Module defaults from nuxt.options.experimental
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.features[ModuleOptions], // Module defaults from nuxt.options.features
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.imports[ModuleOptions], // Module defaults from nuxt.options.imports
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.components[ModuleOptions], // Module defaults from nuxt.options.components
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.extensions[ModuleOptions], // Module defaults from nuxt.options.extensions
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.hooks[ModuleOptions], // Module defaults from nuxt.options.hooks
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.plugins[ModuleOptions], // Module defaults from nuxt.options.plugins
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.serverHandlers[ModuleOptions], // Module defaults from nuxt.options.serverHandlers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.watch[ModuleOptions], // Module defaults from nuxt.options.watch
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.css[ModuleOptions], // Module defaults from nuxt.options.css
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.alias[ModuleOptions], // Module defaults from nuxt.options.alias
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.sourcemap[ModuleOptions], // Module defaults from nuxt.options.sourcemap
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dir[ModuleOptions], // Module defaults from nuxt.options.dir
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.appConfig[ModuleOptions], // Module defaults from nuxt.options.appConfig
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.runtimeConfig[ModuleOptions], // Module defaults from nuxt.options.runtimeConfig
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.typescript[ModuleOptions], // Module defaults from nuxt.options.typescript
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.telemetry[ModuleOptions], // Module defaults from nuxt.options.telemetry
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options._layers[ModuleOptions], // Module defaults from nuxt.options._layers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.srcDir[ModuleOptions], // Module defaults from nuxt.options.srcDir
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.rootDir[ModuleOptions], // Module defaults from nuxt.options.rootDir
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.workspaceDir[ModuleOptions], // Module defaults from nuxt.options.workspaceDir
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.buildDir[ModuleOptions], // Module defaults from nuxt.options.buildDir
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.generate[ModuleOptions], // Module defaults from nuxt.options.generate
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dev[ModuleOptions], // Module defaults from nuxt.options.dev
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.devServer[ModuleOptions], // Module defaults from nuxt.options.devServer
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.builder[ModuleOptions], // Module defaults from nuxt.options.builder
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.test[ModuleOptions], // Module defaults from nuxt.options.test
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.debug[ModuleOptions], // Module defaults from nuxt.options.debug
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.ssr[ModuleOptions], // Module defaults from nuxt.options.ssr
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.target[ModuleOptions], // Module defaults from nuxt.options.target
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.mode[ModuleOptions], // Module defaults from nuxt.options.mode
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.modern[ModuleOptions], // Module defaults from nuxt.options.modern
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.globalName[ModuleOptions], // Module defaults from nuxt.options.globalName
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.globals[ModuleOptions], // Module defaults from nuxt.options.globals
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.render[ModuleOptions], // Module defaults from nuxt.options.render
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.router[ModuleOptions], // Module defaults from nuxt.options.router
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.server[ModuleOptions], // Module defaults from nuxt.options.server
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.head[ModuleOptions], // Module defaults from nuxt.options.head
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.meta[ModuleOptions], // Module defaults from nuxt.options.meta
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.env[ModuleOptions], // Module defaults from nuxt.options.env
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.build[ModuleOptions], // Module defaults from nuxt.options.build
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.watchers[ModuleOptions], // Module defaults from nuxt.options.watchers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.resolve[ModuleOptions], // Module defaults from nuxt.options.resolve
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.optimization[ModuleOptions], // Module defaults from nuxt.options.optimization
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.terser[ModuleOptions], // Module defaults from nuxt.options.terser
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.extractCSS[ModuleOptions], // Module defaults from nuxt.options.extractCSS
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.crossorigin[ModuleOptions], // Module defaults from nuxt.options.crossorigin
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.filenames[ModuleOptions], // Module defaults from nuxt.options.filenames
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.loading[ModuleOptions], // Module defaults from nuxt.options.loading
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.loadingIndicator[ModuleOptions], // Module defaults from nuxt.options.loadingIndicator
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.pageTransition[ModuleOptions], // Module defaults from nuxt.options.pageTransition
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.layoutTransition[ModuleOptions], // Module defaults from nuxt.options.layoutTransition
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPage[ModuleOptions], // Module defaults from nuxt.options.dirPage
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLayout[ModuleOptions], // Module defaults from nuxt.options.dirLayout
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMiddleware[ModuleOptions], // Module defaults from nuxt.options.dirMiddleware
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStatic[ModuleOptions], // Module defaults from nuxt.options.dirStatic
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStore[ModuleOptions], // Module defaults from nuxt.options.dirStore
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAssets[ModuleOptions], // Module defaults from nuxt.options.dirAssets
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPublic[ModuleOptions], // Module defaults from nuxt.options.dirPublic
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirServer[ModuleOptions], // Module defaults from nuxt.options.dirServer
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirComposables[ModuleOptions], // Module defaults from nuxt.options.dirComposables
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirUtils[ModuleOptions], // Module defaults from nuxt.options.dirUtils
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirApp[ModuleOptions], // Module defaults from nuxt.options.dirApp
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNuxt[ModuleOptions], // Module defaults from nuxt.options.dirNuxt
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirOutput[ModuleOptions], // Module defaults from nuxt.options.dirOutput
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNodeModules[ModuleOptions], // Module defaults from nuxt.options.dirNodeModules
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirIgnore[ModuleOptions], // Module defaults from nuxt.options.dirIgnore
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWatch[ModuleOptions], // Module defaults from nuxt.options.dirWatch
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirModules[ModuleOptions], // Module defaults from nuxt.options.dirModules
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLayers[ModuleOptions], // Module defaults from nuxt.options.dirLayers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMixins[ModuleOptions], // Module defaults from nuxt.options.dirMixins
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPages[ModuleOptions], // Module defaults from nuxt.options.dirPages
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTest[ModuleOptions], // Module defaults from nuxt.options.dirTest
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStorybook[ModuleOptions], // Module defaults from nuxt.options.dirStorybook
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSchemas[ModuleOptions], // Module defaults from nuxt.options.dirSchemas
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirModels[ModuleOptions], // Module defaults from nuxt.options.dirModels
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirServices[ModuleOptions], // Module defaults from nuxt.options.dirServices
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirConstants[ModuleOptions], // Module defaults from nuxt.options.dirConstants
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirConfigs[ModuleOptions], // Module defaults from nuxt.options.dirConfigs
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirI18n[ModuleOptions], // Module defaults from nuxt.options.dirI18n
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLang[ModuleOptions], // Module defaults from nuxt.options.dirLang
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLocales[ModuleOptions], // Module defaults from nuxt.options.dirLocales
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirContent[ModuleOptions], // Module defaults from nuxt.options.dirContent
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirData[ModuleOptions], // Module defaults from nuxt.options.dirData
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFixtures[ModuleOptions], // Module defaults from nuxt.options.dirFixtures
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMocks[ModuleOptions], // Module defaults from nuxt.options.dirMocks
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStubs[ModuleOptions], // Module defaults from nuxt.options.dirStubs
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirExamples[ModuleOptions], // Module defaults from nuxt.options.dirExamples
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDocs[ModuleOptions], // Module defaults from nuxt.options.dirDocs
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBenchmarks[ModuleOptions], // Module defaults from nuxt.options.dirBenchmarks
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCoverage[ModuleOptions], // Module defaults from nuxt.options.dirCoverage
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirReports[ModuleOptions], // Module defaults from nuxt.options.dirReports
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLogs[ModuleOptions], // Module defaults from nuxt.options.dirLogs
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTemp[ModuleOptions], // Module defaults from nuxt.options.dirTemp
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCache[ModuleOptions], // Module defaults from nuxt.options.dirCache
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDist[ModuleOptions], // Module defaults from nuxt.options.dirDist
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirExport[ModuleOptions], // Module defaults from nuxt.options.dirExport
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRelease[ModuleOptions], // Module defaults from nuxt.options.dirRelease
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirArchive[ModuleOptions], // Module defaults from nuxt.options.dirArchive
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBackup[ModuleOptions], // Module defaults from nuxt.options.dirBackup
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSql[ModuleOptions], // Module defaults from nuxt.options.dirSql
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMigrations[ModuleOptions], // Module defaults from nuxt.options.dirMigrations
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSeeds[ModuleOptions], // Module defaults from nuxt.options.dirSeeds
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFactories[ModuleOptions], // Module defaults from nuxt.options.dirFactories
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGraphQL[ModuleOptions], // Module defaults from nuxt.options.dirGraphQL
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirProto[ModuleOptions], // Module defaults from nuxt.options.dirProto
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAuth[ModuleOptions], // Module defaults from nuxt.options.dirAuth
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMail[ModuleOptions], // Module defaults from nuxt.options.dirMail
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNotifications[ModuleOptions], // Module defaults from nuxt.options.dirNotifications
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirJobs[ModuleOptions], // Module defaults from nuxt.options.dirJobs
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirListeners[ModuleOptions], // Module defaults from nuxt.options.dirListeners
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirEvents[ModuleOptions], // Module defaults from nuxt.options.dirEvents
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSubscribers[ModuleOptions], // Module defaults from nuxt.options.dirSubscribers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPolicies[ModuleOptions], // Module defaults from nuxt.options.dirPolicies
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRules[ModuleOptions], // Module defaults from nuxt.options.dirRules
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAbilities[ModuleOptions], // Module defaults from nuxt.options.dirAbilities
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPermissions[ModuleOptions], // Module defaults from nuxt.options.dirPermissions
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRoles[ModuleOptions], // Module defaults from nuxt.options.dirRoles
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirUsers[ModuleOptions], // Module defaults from nuxt.options.dirUsers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTeams[ModuleOptions], // Module defaults from nuxt.options.dirTeams
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirOrganizations[ModuleOptions], // Module defaults from nuxt.options.dirOrganizations
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirProjects[ModuleOptions], // Module defaults from nuxt.options.dirProjects
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTasks[ModuleOptions], // Module defaults from nuxt.options.dirTasks
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirIssues[ModuleOptions], // Module defaults from nuxt.options.dirIssues
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirComments[ModuleOptions], // Module defaults from nuxt.options.dirComments
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAttachments[ModuleOptions], // Module defaults from nuxt.options.dirAttachments
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirUploads[ModuleOptions], // Module defaults from nuxt.options.dirUploads
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDownloads[ModuleOptions], // Module defaults from nuxt.options.dirDownloads
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirExports[ModuleOptions], // Module defaults from nuxt.options.dirExports
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirImports[ModuleOptions], // Module defaults from nuxt.options.dirImports
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirReports[ModuleOptions], // Module defaults from nuxt.options.dirReports
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCharts[ModuleOptions], // Module defaults from nuxt.options.dirCharts
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDashboards[ModuleOptions], // Module defaults from nuxt.options.dirDashboards
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWidgets[ModuleOptions], // Module defaults from nuxt.options.dirWidgets
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSettings[ModuleOptions], // Module defaults from nuxt.options.dirSettings
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirThemes[ModuleOptions], // Module defaults from nuxt.options.dirThemes
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTemplates[ModuleOptions], // Module defaults from nuxt.options.dirTemplates
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSnippets[ModuleOptions], // Module defaults from nuxt.options.dirSnippets
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirJson[ModuleOptions], // Module defaults from nuxt.options.dirJson
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirXml[ModuleOptions], // Module defaults from nuxt.options.dirXml
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCsv[ModuleOptions], // Module defaults from nuxt.options.dirCsv
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirYaml[ModuleOptions], // Module defaults from nuxt.options.dirYaml
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirToml[ModuleOptions], // Module defaults from nuxt.options.dirToml
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirEnv[ModuleOptions], // Module defaults from nuxt.options.dirEnv
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirScripts[ModuleOptions], // Module defaults from nuxt.options.dirScripts
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirShaders[ModuleOptions], // Module defaults from nuxt.options.dirShaders
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFonts[ModuleOptions], // Module defaults from nuxt.options.dirFonts
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirImages[ModuleOptions], // Module defaults from nuxt.options.dirImages
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirVideos[ModuleOptions], // Module defaults from nuxt.options.dirVideos
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAudios[ModuleOptions], // Module defaults from nuxt.options.dirAudios
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDocuments[ModuleOptions], // Module defaults from nuxt.options.dirDocuments
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirArchives[ModuleOptions], // Module defaults from nuxt.options.dirArchives
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirInstall[ModuleOptions], // Module defaults from nuxt.options.dirInstall
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirUninstall[ModuleOptions], // Module defaults from nuxt.options.dirUninstall
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirUpdate[ModuleOptions], // Module defaults from nuxt.options.dirUpdate
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirUpgrade[ModuleOptions], // Module defaults from nuxt.options.dirUpgrade
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDowngrade[ModuleOptions], // Module defaults from nuxt.options.dirDowngrade
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBackup[ModuleOptions], // Module defaults from nuxt.options.dirBackup
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRestore[ModuleOptions], // Module defaults from nuxt.options.dirRestore
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTest[ModuleOptions], // Module defaults from nuxt.options.dirTest
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTests[ModuleOptions], // Module defaults from nuxt.options.dirTests
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirE2e[ModuleOptions], // Module defaults from nuxt.options.dirE2e
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirIntegration[ModuleOptions], // Module defaults from nuxt.options.dirIntegration
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirUnit[ModuleOptions], // Module defaults from nuxt.options.dirUnit
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAcceptance[ModuleOptions], // Module defaults from nuxt.options.dirAcceptance
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFunctional[ModuleOptions], // Module defaults from nuxt.options.dirFunctional
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPerformance[ModuleOptions], // Module defaults from nuxt.options.dirPerformance
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLoad[ModuleOptions], // Module defaults from nuxt.options.dirLoad
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStress[ModuleOptions], // Module defaults from nuxt.options.dirStress
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSecurity[ModuleOptions], // Module defaults from nuxt.options.dirSecurity
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAccessibility[ModuleOptions], // Module defaults from nuxt.options.dirAccessibility
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSeo[ModuleOptions], // Module defaults from nuxt.options.dirSeo
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPwa[ModuleOptions], // Module defaults from nuxt.options.dirPwa
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirElectron[ModuleOptions], // Module defaults from nuxt.options.dirElectron
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCapacitor[ModuleOptions], // Module defaults from nuxt.options.dirCapacitor
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCordova[ModuleOptions], // Module defaults from nuxt.options.dirCordova
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNative[ModuleOptions], // Module defaults from nuxt.options.dirNative
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMobile[ModuleOptions], // Module defaults from nuxt.options.dirMobile
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDesktop[ModuleOptions], // Module defaults from nuxt.options.dirDesktop
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWeb[ModuleOptions], // Module defaults from nuxt.options.dirWeb
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirVr[ModuleOptions], // Module defaults from nuxt.options.dirVr
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAr[ModuleOptions], // Module defaults from nuxt.options.dirAr
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWearables[ModuleOptions], // Module defaults from nuxt.options.dirWearables
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirIot[ModuleOptions], // Module defaults from nuxt.options.dirIot
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAutomotive[ModuleOptions], // Module defaults from nuxt.options.dirAutomotive
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRobotics[ModuleOptions], // Module defaults from nuxt.options.dirRobotics
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGaming[ModuleOptions], // Module defaults from nuxt.options.dirGaming
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBlockchain[ModuleOptions], // Module defaults from nuxt.options.dirBlockchain
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAi[ModuleOptions], // Module defaults from nuxt.options.dirAi
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMl[ModuleOptions], // Module defaults from nuxt.options.dirMl
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDs[ModuleOptions], // Module defaults from nuxt.options.dirDs
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBigData[ModuleOptions], // Module defaults from nuxt.options.dirBigData
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirQuantum[ModuleOptions], // Module defaults from nuxt.options.dirQuantum
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMetaverse[ModuleOptions], // Module defaults from nuxt.options.dirMetaverse
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWeb3[ModuleOptions], // Module defaults from nuxt.options.dirWeb3
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDao[ModuleOptions], // Module defaults from nuxt.options.dirDao
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNft[ModuleOptions], // Module defaults from nuxt.options.dirNft
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDefi[ModuleOptions], // Module defaults from nuxt.options.dirDefi
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGamefi[ModuleOptions], // Module defaults from nuxt.options.dirGamefi
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSocialfi[ModuleOptions], // Module defaults from nuxt.options.dirSocialfi
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMetafi[ModuleOptions], // Module defaults from nuxt.options.dirMetafi
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDao[ModuleOptions], // Module defaults from nuxt.options.dirDao
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDapp[ModuleOptions], // Module defaults from nuxt.options.dirDapp
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSmartContracts[ModuleOptions], // Module defaults from nuxt.options.dirSmartContracts
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirOracles[ModuleOptions], // Module defaults from nuxt.options.dirOracles
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWallets[ModuleOptions], // Module defaults from nuxt.options.dirWallets
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirExchanges[ModuleOptions], // Module defaults from nuxt.options.dirExchanges
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMarketplaces[ModuleOptions], // Module defaults from nuxt.options.dirMarketplaces
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLaunchpads[ModuleOptions], // Module defaults from nuxt.options.dirLaunchpads
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDex[ModuleOptions], // Module defaults from nuxt.options.dirDex
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCex[ModuleOptions], // Module defaults from nuxt.options.dirCex
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLending[ModuleOptions], // Module defaults from nuxt.options.dirLending
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBorrowing[ModuleOptions], // Module defaults from nuxt.options.dirBorrowing
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStaking[ModuleOptions], // Module defaults from nuxt.options.dirStaking
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFarming[ModuleOptions], // Module defaults from nuxt.options.dirFarming
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPooling[ModuleOptions], // Module defaults from nuxt.options.dirPooling
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirVoting[ModuleOptions], // Module defaults from nuxt.options.dirVoting
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGovernance[ModuleOptions], // Module defaults from nuxt.options.dirGovernance
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirProposals[ModuleOptions], // Module defaults from nuxt.options.dirProposals
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTreasury[ModuleOptions], // Module defaults from nuxt.options.dirTreasury
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGrants[ModuleOptions], // Module defaults from nuxt.options.dirGrants
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBounties[ModuleOptions], // Module defaults from nuxt.options.dirBounties
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirHackathons[ModuleOptions], // Module defaults from nuxt.options.dirHackathons
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMeetups[ModuleOptions], // Module defaults from nuxt.options.dirMeetups
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirConferences[ModuleOptions], // Module defaults from nuxt.options.dirConferences
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWorkshops[ModuleOptions], // Module defaults from nuxt.options.dirWorkshops
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCourses[ModuleOptions], // Module defaults from nuxt.options.dirCourses
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTutorials[ModuleOptions], // Module defaults from nuxt.options.dirTutorials
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBooks[ModuleOptions], // Module defaults from nuxt.options.dirBooks
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirArticles[ModuleOptions], // Module defaults from nuxt.options.dirArticles
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPosts[ModuleOptions], // Module defaults from nuxt.options.dirPosts
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNews[ModuleOptions], // Module defaults from nuxt.options.dirNews
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPodcasts[ModuleOptions], // Module defaults from nuxt.options.dirPodcasts
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirVideos[ModuleOptions], // Module defaults from nuxt.options.dirVideos
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStreams[ModuleOptions], // Module defaults from nuxt.options.dirStreams
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWebinars[ModuleOptions], // Module defaults from nuxt.options.dirWebinars
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSlides[ModuleOptions], // Module defaults from nuxt.options.dirSlides
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPresentations[ModuleOptions], // Module defaults from nuxt.options.dirPresentations
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirInfographics[ModuleOptions], // Module defaults from nuxt.options.dirInfographics
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMemes[ModuleOptions], // Module defaults from nuxt.options.dirMemes
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGifs[ModuleOptions], // Module defaults from nuxt.options.dirGifs
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStickers[ModuleOptions], // Module defaults from nuxt.options.dirStickers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirEmojis[ModuleOptions], // Module defaults from nuxt.options.dirEmojis
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAvatars[ModuleOptions], // Module defaults from nuxt.options.dirAvatars
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBadges[ModuleOptions], // Module defaults from nuxt.options.dirBadges
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCertificates[ModuleOptions], // Module defaults from nuxt.options.dirCertificates
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDiplomas[ModuleOptions], // Module defaults from nuxt.options.dirDiplomas
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAwards[ModuleOptions], // Module defaults from nuxt.options.dirAwards
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPrizes[ModuleOptions], // Module defaults from nuxt.options.dirPrizes
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGiveaways[ModuleOptions], // Module defaults from nuxt.options.dirGiveaways
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirContests[ModuleOptions], // Module defaults from nuxt.options.dirContests
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirChallenges[ModuleOptions], // Module defaults from nuxt.options.dirChallenges
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirQuizzes[ModuleOptions], // Module defaults from nuxt.options.dirQuizzes
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSurveys[ModuleOptions], // Module defaults from nuxt.options.dirSurveys
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPolls[ModuleOptions], // Module defaults from nuxt.options.dirPolls
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFeedback[ModuleOptions], // Module defaults from nuxt.options.dirFeedback
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirReviews[ModuleOptions], // Module defaults from nuxt.options.dirReviews
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTestimonials[ModuleOptions], // Module defaults from nuxt.options.dirTestimonials
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCaseStudies[ModuleOptions], // Module defaults from nuxt.options.dirCaseStudies
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWhitepapers[ModuleOptions], // Module defaults from nuxt.options.dirWhitepapers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirEbooks[ModuleOptions], // Module defaults from nuxt.options.dirEbooks
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGuides[ModuleOptions], // Module defaults from nuxt.options.dirGuides
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirChecklists[ModuleOptions], // Module defaults from nuxt.options.dirChecklists
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTemplates[ModuleOptions], // Module defaults from nuxt.options.dirTemplates
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWorksheets[ModuleOptions], // Module defaults from nuxt.options.dirWorksheets
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCalculators[ModuleOptions], // Module defaults from nuxt.options.dirCalculators
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGenerators[ModuleOptions], // Module defaults from nuxt.options.dirGenerators
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirConverters[ModuleOptions], // Module defaults from nuxt.options.dirConverters
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirValidators[ModuleOptions], // Module defaults from nuxt.options.dirValidators
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFormatters[ModuleOptions], // Module defaults from nuxt.options.dirFormatters
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMinifiers[ModuleOptions], // Module defaults from nuxt.options.dirMinifiers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPrettifiers[ModuleOptions], // Module defaults from nuxt.options.dirPrettifiers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirObfuscators[ModuleOptions], // Module defaults from nuxt.options.dirObfuscators
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDeobfuscators[ModuleOptions], // Module defaults from nuxt.options.dirDeobfuscators
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirEncoders[ModuleOptions], // Module defaults from nuxt.options.dirEncoders
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDecoders[ModuleOptions], // Module defaults from nuxt.options.dirDecoders
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirEncryptors[ModuleOptions], // Module defaults from nuxt.options.dirEncryptors
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDecryptors[ModuleOptions], // Module defaults from nuxt.options.dirDecryptors
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirHashers[ModuleOptions], // Module defaults from nuxt.options.dirHashers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSigners[ModuleOptions], // Module defaults from nuxt.options.dirSigners
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirVerifiers[ModuleOptions], // Module defaults from nuxt.options.dirVerifiers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirKeypairs[ModuleOptions], // Module defaults from nuxt.options.dirKeypairs
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCertificates[ModuleOptions], // Module defaults from nuxt.options.dirCertificates
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirTokens[ModuleOptions], // Module defaults from nuxt.options.dirTokens
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSecrets[ModuleOptions], // Module defaults from nuxt.options.dirSecrets
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPasswords[ModuleOptions], // Module defaults from nuxt.options.dirPasswords
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCredentials[ModuleOptions], // Module defaults from nuxt.options.dirCredentials
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirConfigs[ModuleOptions], // Module defaults from nuxt.options.dirConfigs
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirEnvironments[ModuleOptions], // Module defaults from nuxt.options.dirEnvironments
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirVariables[ModuleOptions], // Module defaults from nuxt.options.dirVariables
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirConstants[ModuleOptions], // Module defaults from nuxt.options.dirConstants
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGlobals[ModuleOptions], // Module defaults from nuxt.options.dirGlobals
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLocals[ModuleOptions], // Module defaults from nuxt.options.dirLocals
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSession[ModuleOptions], // Module defaults from nuxt.options.dirSession
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCookie[ModuleOptions], // Module defaults from nuxt.options.dirCookie
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCache[ModuleOptions], // Module defaults from nuxt.options.dirCache
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStorage[ModuleOptions], // Module defaults from nuxt.options.dirStorage
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDatabase[ModuleOptions], // Module defaults from nuxt.options.dirDatabase
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirApi[ModuleOptions], // Module defaults from nuxt.options.dirApi
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGraphql[ModuleOptions], // Module defaults from nuxt.options.dirGraphql
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRest[ModuleOptions], // Module defaults from nuxt.options.dirRest
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRpc[ModuleOptions], // Module defaults from nuxt.options.dirRpc
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGrpc[ModuleOptions], // Module defaults from nuxt.options.dirGrpc
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWebsockets[ModuleOptions], // Module defaults from nuxt.options.dirWebsockets
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSse[ModuleOptions], // Module defaults from nuxt.options.dirSse
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWebhooks[ModuleOptions], // Module defaults from nuxt.options.dirWebhooks
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWebPush[ModuleOptions], // Module defaults from nuxt.options.dirWebPush
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFcm[ModuleOptions], // Module defaults from nuxt.options.dirFcm
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirApns[ModuleOptions], // Module defaults from nuxt.options.dirApns
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSms[ModuleOptions], // Module defaults from nuxt.options.dirSms
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirEmail[ModuleOptions], // Module defaults from nuxt.options.dirEmail
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPush[ModuleOptions], // Module defaults from nuxt.options.dirPush
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirChat[ModuleOptions], // Module defaults from nuxt.options.dirChat
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBots[ModuleOptions], // Module defaults from nuxt.options.dirBots
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirVoice[ModuleOptions], // Module defaults from nuxt.options.dirVoice
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirVideo[ModuleOptions], // Module defaults from nuxt.options.dirVideo
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAudio[ModuleOptions], // Module defaults from nuxt.options.dirAudio
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirImage[ModuleOptions], // Module defaults from nuxt.options.dirImage
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFile[ModuleOptions], // Module defaults from nuxt.options.dirFile
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMedia[ModuleOptions], // Module defaults from nuxt.options.dirMedia
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPayments[ModuleOptions], // Module defaults from nuxt.options.dirPayments
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBilling[ModuleOptions], // Module defaults from nuxt.options.dirBilling
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirInvoices[ModuleOptions], // Module defaults from nuxt.options.dirInvoices
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirOrders[ModuleOptions], // Module defaults from nuxt.options.dirOrders
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirProducts[ModuleOptions], // Module defaults from nuxt.options.dirProducts
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCustomers[ModuleOptions], // Module defaults from nuxt.options.dirCustomers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirUsers[ModuleOptions], // Module defaults from nuxt.options.dirUsers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAuth[ModuleOptions], // Module defaults from nuxt.options.dirAuth
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAdmin[ModuleOptions], // Module defaults from nuxt.options.dirAdmin
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDashboard[ModuleOptions], // Module defaults from nuxt.options.dirDashboard
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSettings[ModuleOptions], // Module defaults from nuxt.options.dirSettings
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirProfile[ModuleOptions], // Module defaults from nuxt.options.dirProfile
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAccount[ModuleOptions], // Module defaults from nuxt.options.dirAccount
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAuth[ModuleOptions], // Module defaults from nuxt.options.dirAuth
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLogin[ModuleOptions], // Module defaults from nuxt.options.dirLogin
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRegister[ModuleOptions], // Module defaults from nuxt.options.dirRegister
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLogout[ModuleOptions], // Module defaults from nuxt.options.dirLogout
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPassword[ModuleOptions], // Module defaults from nuxt.options.dirPassword
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirReset[ModuleOptions], // Module defaults from nuxt.options.dirReset
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirForgot[ModuleOptions], // Module defaults from nuxt.options.dirForgot
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirVerify[ModuleOptions], // Module defaults from nuxt.options.dirVerify
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirConfirm[ModuleOptions], // Module defaults from nuxt.options.dirConfirm
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirOtp[ModuleOptions], // Module defaults from nuxt.options.dirOtp
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dir2fa[ModuleOptions], // Module defaults from nuxt.options.dir2fa
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSso[ModuleOptions], // Module defaults from nuxt.options.dirSso
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirOauth[ModuleOptions], // Module defaults from nuxt.options.dirOauth
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSaml[ModuleOptions], // Module defaults from nuxt.options.dirSaml
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLdap[ModuleOptions], // Module defaults from nuxt.options.dirLdap
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirOpenid[ModuleOptions], // Module defaults from nuxt.options.dirOpenid
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirJwt[ModuleOptions], // Module defaults from nuxt.options.dirJwt
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRoles[ModuleOptions], // Module defaults from nuxt.options.dirRoles
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPermissions[ModuleOptions], // Module defaults from nuxt.options.dirPermissions
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAbilities[ModuleOptions], // Module defaults from nuxt.options.dirAbilities
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPolicies[ModuleOptions], // Module defaults from nuxt.options.dirPolicies
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGuards[ModuleOptions], // Module defaults from nuxt.options.dirGuards
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMiddleware[ModuleOptions], // Module defaults from nuxt.options.dirMiddleware
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirInterceptors[ModuleOptions], // Module defaults from nuxt.options.dirInterceptors
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPipes[ModuleOptions], // Module defaults from nuxt.options.dirPipes
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFilters[ModuleOptions], // Module defaults from nuxt.options.dirFilters
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirExceptions[ModuleOptions], // Module defaults from nuxt.options.dirExceptions
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirErrors[ModuleOptions], // Module defaults from nuxt.options.dirErrors
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirHelpers[ModuleOptions], // Module defaults from nuxt.options.dirHelpers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirUtils[ModuleOptions], // Module defaults from nuxt.options.dirUtils
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLib[ModuleOptions], // Module defaults from nuxt.options.dirLib
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCore[ModuleOptions], // Module defaults from nuxt.options.dirCore
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirShared[ModuleOptions], // Module defaults from nuxt.options.dirShared
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCommon[ModuleOptions], // Module defaults from nuxt.options.dirCommon
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirApp[ModuleOptions], // Module defaults from nuxt.options.dirApp
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirSrc[ModuleOptions], // Module defaults from nuxt.options.dirSrc
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRoot[ModuleOptions], // Module defaults from nuxt.options.dirRoot
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNode[ModuleOptions], // Module defaults from nuxt.options.dirNode
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirClient[ModuleOptions], // Module defaults from nuxt.options.dirClient
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirServer[ModuleOptions], // Module defaults from nuxt.options.dirServer
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStatic[ModuleOptions], // Module defaults from nuxt.options.dirStatic
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPublic[ModuleOptions], // Module defaults from nuxt.options.dirPublic
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAssets[ModuleOptions], // Module defaults from nuxt.options.dirAssets
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBuild[ModuleOptions], // Module defaults from nuxt.options.dirBuild
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDist[ModuleOptions], // Module defaults from nuxt.options.dirDist
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirOutput[ModuleOptions], // Module defaults from nuxt.options.dirOutput
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNuxt[ModuleOptions], // Module defaults from nuxt.options.dirNuxt
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNitro[ModuleOptions], // Module defaults from nuxt.options.dirNitro
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirVite[ModuleOptions], // Module defaults from nuxt.options.dirVite
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWebpack[ModuleOptions], // Module defaults from nuxt.options.dirWebpack
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPostcss[ModuleOptions], // Module defaults from nuxt.options.dirPostcss
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirEslint[ModuleOptions], // Module defaults from nuxt.options.dirEslint
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPrettier[ModuleOptions], // Module defaults from nuxt.options.dirPrettier
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStylelint[ModuleOptions], // Module defaults from nuxt.options.dirStylelint
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirHusky[ModuleOptions], // Module defaults from nuxt.options.dirHusky
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLintStaged[ModuleOptions], // Module defaults from nuxt.options.dirLintStaged
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCommitlint[ModuleOptions], // Module defaults from nuxt.options.dirCommitlint
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirChangelog[ModuleOptions], // Module defaults from nuxt.options.dirChangelog
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRelease[ModuleOptions], // Module defaults from nuxt.options.dirRelease
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGithub[ModuleOptions], // Module defaults from nuxt.options.dirGithub
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGitlab[ModuleOptions], // Module defaults from nuxt.options.dirGitlab
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBitbucket[ModuleOptions], // Module defaults from nuxt.options.dirBitbucket
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAzure[ModuleOptions], // Module defaults from nuxt.options.dirAzure
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirGcp[ModuleOptions], // Module defaults from nuxt.options.dirGcp
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAws[ModuleOptions], // Module defaults from nuxt.options.dirAws
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFirebase[ModuleOptions], // Module defaults from nuxt.options.dirFirebase
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNetlify[ModuleOptions], // Module defaults from nuxt.options.dirNetlify
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirVercel[ModuleOptions], // Module defaults from nuxt.options.dirVercel
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirHeroku[ModuleOptions], // Module defaults from nuxt.options.dirHeroku
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirRender[ModuleOptions], // Module defaults from nuxt.options.dirRender
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFly[ModuleOptions], // Module defaults from nuxt.options.dirFly
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirCloudflare[ModuleOptions], // Module defaults from nuxt.options.dirCloudflare
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWorkers[ModuleOptions], // Module defaults from nuxt.options.dirWorkers
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPages[ModuleOptions], // Module defaults from nuxt.options.dirPages
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirFunctions[ModuleOptions], // Module defaults from nuxt.options.dirFunctions
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirEdge[ModuleOptions], // Module defaults from nuxt.options.dirEdge
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirApi[ModuleOptions], // Module defaults from nuxt.options.dirApi
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirMiddleware[ModuleOptions], // Module defaults from nuxt.options.dirMiddleware
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPlugins[ModuleOptions], // Module defaults from nuxt.options.dirPlugins
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirComposables[ModuleOptions], // Module defaults from nuxt.options.dirComposables
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirUtils[ModuleOptions], // Module defaults from nuxt.options.dirUtils
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirComponents[ModuleOptions], // Module defaults from nuxt.options.dirComponents
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLayouts[ModuleOptions], // Module defaults from nuxt.options.dirLayouts
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirContent[ModuleOptions], // Module defaults from nuxt.options.dirContent
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStore[ModuleOptions], // Module defaults from nuxt.options.dirStore
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirAssets[ModuleOptions], // Module defaults from nuxt.options.dirAssets
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirPublic[ModuleOptions], // Module defaults from nuxt.options.dirPublic
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirStatic[ModuleOptions], // Module defaults from nuxt.options.dirStatic
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirServer[ModuleOptions], // Module defaults from nuxt.options.dirServer
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirApp[ModuleOptions], // Module defaults from nuxt.options.dirApp
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNuxt[ModuleOptions], // Module defaults from nuxt.options.dirNuxt
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirOutput[ModuleOptions], // Module defaults from nuxt.options.dirOutput
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirBuild[ModuleOptions], // Module defaults from nuxt.options.dirBuild
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirDist[ModuleOptions], // Module defaults from nuxt.options.dirDist
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirNodeModules[ModuleOptions], // Module defaults from nuxt.options.dirNodeModules
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirIgnore[ModuleOptions], // Module defaults from nuxt.options.dirIgnore
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirWatch[ModuleOptions], // Module defaults from nuxt.options.dirWatch
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirModules[ModuleOptions], // Module defaults from nuxt.options.dirModules
      // @ts-expect-error TODO: fix type after nuxt/kit update
      nuxt.options.dirLayers[ModuleOptions], // Module defaults from nuxt.options.dirLayers
      this.defaults // Module's own defaults
    );
    nuxt.options.runtimeConfig.public.nuxtApiShield = mergedOptions;

### 3. Add `nitro/storage` to `nuxt.config.ts`
      middleware: true,
      handler: resolver.resolve('./runtime/server/middleware/shield'),
    })

    addPlugin(resolver.resolve('./runtime/plugin'))
  },
})
