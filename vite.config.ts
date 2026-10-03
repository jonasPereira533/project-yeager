import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Vite 8 usa rolldown: manualChunks só aceita a forma de função e a opção
// canônica é build.rolldownOptions (rollupOptions continua como alias
// depreciado).
export default defineConfig({
  plugins: [vue()],
  build: {
    rolldownOptions: {
      output: {
        // Separa vendors em chunks estáveis. Isto não reduz o total de bytes,
        // mas evita que uma mudança em qualquer arquivo do app invalide o
        // cache do Firebase e do CodeMirror/sql.js no navegador.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](firebase|@firebase|@grpc|vuefire)[\\/]/.test(id)) {
            return 'firebase'
          }
          if (/[\\/]node_modules[\\/](sql\.js|codemirror|@codemirror|@lezer)/.test(id)) {
            return 'sql-editor'
          }
          return undefined
        },
      },
    },
    // Com os vendors separados, o maior chunk é o do Firebase (~700 kB), que é
    // o piso deste projeto: ele é carregado no boot porque o VueFire é
    // instalado antes do mount.
    chunkSizeWarningLimit: 800,
  },
})