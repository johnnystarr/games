import { existsSync, readFileSync, rmSync, renameSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const projectRoot = dirname(fileURLToPath(import.meta.url))
const sharedCardsRoot = resolve(projectRoot, '../lib/cards')

function emitStandaloneHtml(outputName: string): Plugin {
  return {
    name: 'emit-standalone-freecell-html',
    closeBundle() {
      const distIndex = resolve(__dirname, 'dist/index.html')
      const distTarget = resolve(__dirname, `dist/${outputName}.html`)

      if (!existsSync(distIndex)) {
        return
      }

      if (existsSync(distTarget)) {
        rmSync(distTarget)
      }

      renameSync(distIndex, distTarget)
    },
  }
}

function inlineLocalSvgAssets(): Plugin {
  const svgPrefix = '@freecell-svg/'
  const resolvedSvgPrefix = '\0freecell-svg:'

  return {
    name: 'inline-freecell-svg-assets',
    resolveId(source) {
      if (!source.startsWith(svgPrefix)) {
        return null
      }

      return `${resolvedSvgPrefix}${source.slice(svgPrefix.length)}`
    },
    load(id) {
      if (!id.startsWith(resolvedSvgPrefix)) {
        return null
      }

      const fileName = id.slice(resolvedSvgPrefix.length)
      const svgPath = resolve(__dirname, 'public', 'svgs', fileName)

      if (!existsSync(svgPath)) {
        this.error(`Missing FreeCell SVG asset: ${fileName}`)
      }

      this.addWatchFile(svgPath)

      const svgDataUri = `data:image/svg+xml;base64,${readFileSync(svgPath).toString('base64')}`
      return `export default ${JSON.stringify(svgDataUri)}`
    },
  }
}

export default defineConfig({
  base: './',
  publicDir: false,
  resolve: {
    alias: {
      '@cards': sharedCardsRoot,
      react: resolve(projectRoot, 'node_modules/react'),
      'react/jsx-runtime': resolve(projectRoot, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': resolve(projectRoot, 'node_modules/react/jsx-dev-runtime.js'),
    },
  },
  server: {
    fs: {
      allow: [resolve(projectRoot, '..')],
    },
  },
  plugins: [inlineLocalSvgAssets(), react(), tailwindcss(), viteSingleFile(), emitStandaloneHtml('freecell')],
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    chunkSizeWarningLimit: 2000,
  },
})