import fallbackAvatar from '../assets/lensrent/avatar.png'
import { API_BASE_URL } from './authApi.js'

export function getAvatarSource(avatarUrl) {
  if (!avatarUrl) return fallbackAvatar
  return avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}${avatarUrl}`
}
