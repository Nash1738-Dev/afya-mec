import Dexie from 'dexie'

const db = new Dexie('DigitalMEC')
db.version(1).stores({
  sessions: '++id, synced, createdAt',
})

export const saveSessionOffline = async (sessionData) => {
  try {
    const id = await db.sessions.add({
      data: sessionData,
      synced: 0,
      createdAt: new Date().toISOString()
    })
    return { success: true, localId: id }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getPendingSessions = async () => {
  try {
    return await db.sessions.where('synced').equals(0).toArray()
  } catch {
    return []
  }
}

export const markSynced = async (localId) => {
  try {
    await db.sessions.update(localId, { synced: 1 })
  } catch {}
}

export const getPendingCount = async () => {
  try {
    return await db.sessions.where('synced').equals(0).count()
  } catch {
    return 0
  }
}

export const syncPendingSessions = async () => {
  try {
    const all = await db.sessions.toArray()
    const pending = all.filter(s => !s.synced || s.synced === 0)
    if (pending.length === 0) return 0
    let synced = 0
    for (const item of pending) {
      try {
        const response = await fetch('http://localhost:8000/api/visits/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        })
        if (response.ok) {
          await db.sessions.update(item.id, { synced: 1 })
          synced++
        } else {
          const err = await response.text()
          console.error('Sync error:', err)
          break
        }
      } catch (e) {
        console.error('Network error during sync:', e)
        break
      }
    }
    return synced
  } catch (e) {
    console.error('Sync failed:', e)
    return 0
  }
}

export default db