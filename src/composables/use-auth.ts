
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { useCurrentUser } from 'vuefire'

export function useAuth() {
    const user = useCurrentUser()
    const auth = getAuth()
    const provider = new GoogleAuthProvider()

    async function loginWithGoogle() {
        try {
            await signInWithPopup(auth, provider)
        } catch (error) {
            console.error('Erro ao fazer login com Google:', error)
        }
    }

    async function logout() {
        try {
            await signOut(auth)
        } catch (error) {
            console.error('Erro ao fazer logout:', error)
        }
    }

    return { user, loginWithGoogle, logout }
}