import { create } from 'zustand'

export type TabKey = 'timeline' | 'checklist' | 'report' | 'postvisit' | 'medication' | 'visitpack'

interface TabState {
  activeTab: TabKey
  setActiveTab: (tab: TabKey) => void
}

export const useTabStore = create<TabState>((set) => ({
  activeTab: 'timeline',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))