import { useState } from 'react'
import fallbackAvatar from '../../assets/lensrent/avatar.png'
import { getAvatarSource } from '../../services/avatarUrl.js'

export default function AccountAvatar({ avatarUrl, alt = '', className = 'size-8' }) {
  const [failedSource, setFailedSource] = useState('')
  const source = getAvatarSource(avatarUrl)
  const displayedSource = failedSource === source ? fallbackAvatar : source

  return (
    <img
      key={displayedSource}
      src={displayedSource}
      className={`${className} rounded-full object-cover`}
      alt={alt}
      onError={() => setFailedSource(source)}
    />
  )
}
