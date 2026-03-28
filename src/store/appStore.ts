import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  LocationState,
  SunPosition,
  SunTimes,
  DeviceOrientationState,
  ActiveTab,
  LocationBookmark,
} from './types'

interface AppStore {
  location: LocationState
  sunPosition: SunPosition | null
  sunTimes: SunTimes | null
  deviceOrientation: DeviceOrientationState
  activeTab: ActiveTab
  plannerDate: number // stored as timestamp for persistence
  isOnline: boolean
  bookmarks: LocationBookmark[]

  setLocation: (loc: LocationState) => void
  setSunPosition: (pos: SunPosition) => void
  setSunTimes: (times: SunTimes) => void
  setDeviceOrientation: (state: Partial<DeviceOrientationState>) => void
  setActiveTab: (tab: ActiveTab) => void
  setPlannerDate: (date: Date) => void
  setOnline: (online: boolean) => void
  addBookmark: (bookmark: LocationBookmark) => void
  removeBookmark: (id: string) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      location: { coords: null, label: '', source: null },
      sunPosition: null,
      sunTimes: null,
      deviceOrientation: {
        heading: null,
        isSupported: false,
        permissionState: 'prompt',
      },
      activeTab: 'dashboard',
      plannerDate: (() => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        d.setHours(12, 0, 0, 0)
        return d.getTime()
      })(),
      isOnline: navigator.onLine,
      bookmarks: [],

      setLocation: (loc) => set({ location: loc }),
      setSunPosition: (pos) => set({ sunPosition: pos }),
      setSunTimes: (times) => set({ sunTimes: times }),
      setDeviceOrientation: (state) =>
        set((s) => ({ deviceOrientation: { ...s.deviceOrientation, ...state } })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setPlannerDate: (date) => set({ plannerDate: date.getTime() }),
      setOnline: (online) => set({ isOnline: online }),
      addBookmark: (bookmark) =>
        set((s) => ({ bookmarks: [...s.bookmarks.filter((b) => b.id !== bookmark.id), bookmark] })),
      removeBookmark: (id) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
    }),
    {
      name: 'sunchaser-store',
      partialize: (state) => ({
        location: state.location,
        plannerDate: state.plannerDate,
        bookmarks: state.bookmarks,
      }),
    }
  )
)
