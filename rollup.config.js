import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// build 結束後將 src/ui/ 底下所有檔案複製到 dist/，保留相對路徑結構
const copyUiPlugin = () => ({
  name: 'copy-ui',
  closeBundle() {
    const srcDir = path.resolve(__dirname, 'src/ui')
    const destDir = path.resolve(__dirname, 'dist')

    const copyRecursive = (src, dest) => {
      fs.mkdirSync(dest, { recursive: true })
      for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)
        if (entry.isDirectory()) {
          copyRecursive(srcPath, destPath)
        } else {
          fs.copyFileSync(srcPath, destPath)
        }
      }
    }

    copyRecursive(srcDir, destDir)
    console.log('✔ src/ui → dist/ copied')
  },
})

// 防止 entry point 被 tree-shake 砍掉
// GAS 不 export 任何東西，但需要保留所有 function 定義
const noTreeShakingPlugin = () => ({
  name: 'no-treeshaking',
  resolveId(id, importer) {
    if (!importer) return { id: path.resolve(id), moduleSideEffects: 'no-treeshake' }
    return null
  },
})

export default {
  input: 'src/server/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'esm', // 沒有 export，最終不會產生 import/export 語句
  },
  plugins: [
    noTreeShakingPlugin(),
    alias({ entries: [{ find: '@', replacement: path.resolve(__dirname, 'src') }] }),
    nodeResolve(),
    typescript({ tsconfig: './tsconfig.json' }),
    copyUiPlugin(),
  ],
}
