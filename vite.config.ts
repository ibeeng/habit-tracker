import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// GitHub Pages project site → served under /habit-tracker/
// Android (Capacitor) serves from the web root → APP_BASE=./ for relative paths
const BASE = process.env.APP_BASE ?? '/habit-tracker/'

/** preload the latin subset of the app font so FCP paints in the right face */
function preloadFont(): Plugin {
  return {
    name: 'rootine-preload-font',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const latin = Object.keys(bundle).find((f) => /jetbrains-mono-latin-wght.*\.woff2$/.test(f))
      if (!latin) return
      const href = `${BASE}${latin}`
      const html = Object.values(bundle).find(
        (c): c is import('rollup').OutputAsset =>
          c.type === 'asset' && c.fileName.endsWith('.html'),
      )
      if (!html) return
      const tag = `<link rel="preload" as="font" type="font/woff2" href="${href}" crossorigin>`
      html.source = html.source.replace('</head>', `  ${tag}\n  </head>`)
    },
  }
}

/** inject the built asset list into sw.js so offline reloads get the JS/CSS too.
 * public/ is copied after generateBundle, so the file is patched in closeBundle. */
function precacheManifest(): Plugin {
  let files: string[] = []
  return {
    name: 'rootine-sw-precache',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      files = Object.keys(bundle)
        .filter((f) => f !== 'sw.js' && !f.endsWith('.map'))
        .map((f) => `./${f}`)
    },
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js')
      if (!fs.existsSync(swPath)) {
        this.warn('sw.js not found — skipping precache injection')
        return
      }
      const src = fs.readFileSync(swPath, 'utf8')
      const line = `self.__ROOTINE_PRECACHE = ${JSON.stringify(files)}\n`
      fs.writeFileSync(swPath, line + src.replace(/^self\.__ROOTINE_PRECACHE = .*\n/m, ''))
    },
  }
}

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss(), preloadFont(), precacheManifest()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // keep react/date-fns in stable chunks so app updates don't re-download them
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (id.includes('date-fns')) return 'dates'
          if (id.includes('lucide-react')) return 'icons'
        },
      },
    },
  },
})
