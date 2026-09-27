import { createApp } from 'vue'
import { VueFire, VueFireAuth } from 'vuefire'
import './base.css'
import App from './App.vue'
import router from './router'
import { app as firebaseApp } from './firebase'

const app = createApp(App)

app.use(router)
app.use(VueFire, {
    firebaseApp,
    modules: [VueFireAuth()],
})

app.mount('#app')