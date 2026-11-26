import { ggPlugin } from '@gglib/vite-plugin'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type UserConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

/**
 * Class names survive the build: the scene tree labels engine objects by their class name. The minifier keeps them,
 * functions are still shortened. The bundler's `keepNames` (functions and classes alike) is not needed: it renames no
 * class to avoid a collision.
 */
const keepClassNames = {
  minify: {
    compress: { keepNames: { function: false, class: true } },
    mangle: { keepNames: { function: false, class: true } },
  },
} satisfies NonNullable<NonNullable<UserConfig['build']>['rolldownOptions']>['output']

/**
 * Three configurations:
 * - dev server (`vite`): proxies the nwbt api, cross origin isolation headers for SharedArrayBuffer
 * - app build (`vite build`): the standalone app in dist/app, zipped into tools/bin/viewer.zip for nwbt to serve at `/`
 * - lib build (`vite build --mode=lib`): two entries in dist/lib, with a relative base so that workers, assets and
 *   public files resolve next to the modules, wherever the host serves them:
 *   - `nw-viewer.module.js`: the engine (no UI, src/index.ts)
 *   - `nw-viewer-app.module.js`: the app with its tools (src/app.tsx), styles in `nw-viewer-app.css`
 */
export default defineConfig(({ command, mode, isPreview }) => {
  const common: UserConfig = {
    resolve: {
      // the components of tweak-ui and of the viewer must share one reactive runtime
      dedupe: ['solid-js'],
    },
    worker: {
      format: 'es',
    },
    plugins: [
      solidPlugin(),
      ggPlugin({
        files: ['src/**/*.wgsl.ts'],
      }),
    ],
  }

  if (command === 'serve' && !isPreview) {
    return {
      ...common,
      server: {
        // HTTPS for access from other machines: WebGPU needs a secure context, plain http only counts on localhost.
        // NW_VIEWER_TLS_DIR is a directory with cert.pem and key.pem, e.g. the nwbt certificate (E:/nw-buddy/.nwbt/tls)
        https: process.env.NW_VIEWER_TLS_DIR
          ? {
              cert: fs.readFileSync(path.join(process.env.NW_VIEWER_TLS_DIR, 'cert.pem')),
              key: fs.readFileSync(path.join(process.env.NW_VIEWER_TLS_DIR, 'key.pem')),
            }
          : undefined,
        proxy: {
          '/levels': 'http://localhost:8000',
          '/files': 'http://localhost:8000',
          // asset id -> file path (content/assetIds.ts)
          '/assets': 'http://localhost:8000',
          // the asset browser api; a regex, a plain '/browse' prefix would also catch the app route /browser
          '^/browse/': 'http://localhost:8000',
          // character data: the animation set of a skeleton (commands/serve/get_character.go)
          '^/characters/': 'http://localhost:8000',
          '/nwbt': {
            target: 'http://localhost:8000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/nwbt/, ''),
          },
        },
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'credentialless',
        },
      },
    }
  }

  if (mode === 'lib') {
    return {
      ...common,
      base: './',
      build: {
        outDir: 'dist/lib',
        assetsDir: '',
        sourcemap: true,
        // one stylesheet for the app and the chunks it loads (monaco), linked by the mount (src/app.tsx). Lib mode
        // inlines its fonts (811 kB, 337 kB gzip)
        cssCodeSplit: false,
        lib: {
          entry: {
            'nw-viewer': 'src/index.ts',
            'nw-viewer-app': 'src/app.tsx',
          },
          formats: ['es'],
          fileName: (_, entryName) => `${entryName}.module.js`,
          cssFileName: 'nw-viewer-app',
        },
        rolldownOptions: {
          output: keepClassNames,
          onwarn(warning, warn) {
            if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
              return
            }
            warn(warning)
          },
        },
      },
    }
  }

  return {
    ...common,
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
    },
    build: {
      // production build for nwbt, no sourcemaps
      outDir: 'dist/app',
      assetsDir: '',
      sourcemap: false,
      rolldownOptions: {
        output: keepClassNames,
      },
    },
  }
})
