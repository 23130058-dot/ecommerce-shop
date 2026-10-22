import { useEffect, useState } from 'react'
import { getAccountProfile } from '../services/accountApi.js'
import { getStoredAuth, updateStoredUser } from '../services/authApi.js'

export default function useCurrentAccount() {
  const [auth, setAuth] = useState(() => getStoredAuth())

  useEffect(() => {
    const syncAuth = () => setAuth(getStoredAuth())
    window.addEventListener('lensrent-auth-changed', syncAuth)
    window.addEventListener('storage', syncAuth)
    return () => {
      window.removeEventListener('lensrent-auth-changed', syncAuth)
      window.removeEventListener('storage', syncAuth)
    }
  }, [])

  useEffect(() => {
    const accessToken = auth?.accessToken
    if (!accessToken) return undefined

    let mounted = true
    getAccountProfile()
      .then((profile) => {
        if (!mounted || getStoredAuth()?.accessToken !== accessToken) return
        updateStoredUser({
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          avatarUrl: profile.avatarUrl,
        })
        setAuth((current) => current?.accessToken === accessToken
          ? {
              ...current,
              user: {
                ...current.user,
                fullName: profile.fullName,
                email: profile.email,
                phone: profile.phone,
                avatarUrl: profile.avatarUrl,
              },
            }
          : current)
      })
      .catch(() => {})

    return () => { mounted = false }
  }, [auth?.accessToken])

  return { auth, setAuth }
}
