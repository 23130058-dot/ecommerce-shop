const WORKSPACE_STORAGE_PREFIX = 'lensrent.settings.workspace'
const VALID_WORKSPACES = new Set(['OWNER', 'RENTER'])

function storageKey(user) {
  const identity = user?.id ?? user?.email ?? 'anonymous'
  return `${WORKSPACE_STORAGE_PREFIX}.${String(identity).trim().toLowerCase()}`
}

export function getWorkspacePreference(user) {
  const workspace = window.localStorage.getItem(storageKey(user))
  return VALID_WORKSPACES.has(workspace) ? workspace : null
}

export function saveWorkspacePreference(user, workspace) {
  if (!VALID_WORKSPACES.has(workspace)) return
  const key = storageKey(user)
  window.localStorage.setItem(key, workspace)
  window.dispatchEvent(new CustomEvent('lensrent-workspace-changed', { detail: { key, workspace } }))
}

export function getWorkspacePreferenceKey(user) {
  return storageKey(user)
}
