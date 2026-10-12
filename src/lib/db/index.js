import { HAS_SUPABASE } from '../config.js'
import { localDb } from './local.js'

/**
 * Data layer switch. Supabase when keys exist and the user did not pick guest
 * mode; otherwise localStorage. Supabase is lazy-loaded so guest builds stay light.
 */
let remote = null

export function isGuestMode() {
  try { return !HAS_SUPABASE || localStorage.getItem('zoot.guest') === '1' } catch { return true }
}

export function setGuestMode(on) {
  try { on ? localStorage.setItem('zoot.guest', '1') : localStorage.removeItem('zoot.guest') } catch {}
}

export async function getDb() {
  if (isGuestMode()) return localDb
  if (!remote) {
    const { createRemoteDb } = await import('./remote.js')
    remote = createRemoteDb()
  }
  return remote
}
