import { existsSync, readFileSync, rmSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

function inlineXiangqiSvgAssets(): Plugin {
  const svgPrefix = '@xiangqi-svg/'
  const resolvedSvgPrefix = '\0xiangqi-svg:'

  return {
    name: 'inline-xiangqi-svg-assets',
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
        this.error(`Missing Xiangqi SVG asset: ${fileName}`)
      }

      this.addWatchFile(svgPath)

      const svgDataUri = `data:image/svg+xml;base64,${readFileSync(svgPath).toString('base64')}`
      return `export default ${JSON.stringify(svgDataUri)}`
    },
  }
}

function emitStandaloneHtml() {
  return {
    name: 'emit-standalone-xiangqi-html',
    closeBundle() {
      const distIndex = resolve(__dirname, 'dist/index.html')
      const distTarget = resolve(__dirname, 'dist/xiangqi.html')

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

// https://vite.dev/config/
export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [inlineXiangqiSvgAssets(), react(), tailwindcss(), viteSingleFile(), emitStandaloneHtml()],
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    chunkSizeWarningLimit: 2000,
  },
})
