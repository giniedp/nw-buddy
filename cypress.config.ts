import { defineConfig } from 'cypress'
import webpack from 'webpack'
import env from './env'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'

export default defineConfig({
  projectId: 'aa2aza',
  video: false,
  videosFolder: 'apps/cypress/videos',
  screenshotOnRunFailure: false,
  screenshotsFolder: 'apps/cypress/screenshots',
  downloadsFolder: 'apps/cypress/downloads',
  fixturesFolder: 'apps/cypress/fixtures',
  supportFolder: 'apps/cypress/support',

  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'apps/cypress/support/index.ts',
    specPattern: 'apps/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  component: {
    supportFolder: 'apps/cypress/support',
    supportFile: 'apps/cypress/support/component.ts',
    indexHtmlFile: 'apps/cypress/support/component.html',
    specPattern: '**/*.cy.ts',
    setupNodeEvents(on, config) {
      // require('@cypress/code-coverage/task')(on, config)
      // return config
      // implement node event listeners here
    },
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
      webpackConfig: {
        module: {
          rules: [
            {
              test: /\.css$/,
              use: ['style-loader', 'css-loader'],
            },
            {
              test: /\.ttf$/,
              use: ['file-loader'],
            }
          ]
        },
        plugins: [
          new webpack.DefinePlugin({
            __VERSION__: JSON.stringify(env.VERSION),
            __NW_USE_PTR__: JSON.stringify(env.NW_USE_PTR),
            __NW_DATA_URL__: JSON.stringify(env.nwData.assetPath(env.NW_USE_PTR)),
            __NW_DEPLOY_URL__: JSON.stringify(''),
          }),
          new MonacoWebpackPlugin({
            languages: ['json', 'typescript', 'javascript'],
          }),
        ],
      },
    },
  },
})
