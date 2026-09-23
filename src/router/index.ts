import {createRouter, createWebHistory} from "vue-router";


const routes = [
    { path: '/', name:'main-page',component: ()=> import('../views/main-page.vue')},
    { path: '/cases', name:'case-page',component: ()=> import('../views/case-page.vue')},
    { path: '/solution', name:'solution-page',component: ()=> import('../views/solution-page.vue')},

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router