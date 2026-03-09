import { create } from 'zustand'

export type BackgroundPreset =
  | 'dark-mode-pro'
  | 'psychedelic'
  | 'cyberpunk'
  | 'aurora-gradient'
  | 'vaporwave'
  | 'space-cosmos'
  | 'ocean-deep'
  | 'japanese-sakura'
  | 'stained-glass'
  | 'terminal-cli'
  | 'pop-art'
  | 'nature-eco'

export interface BackgroundPresetInfo {
  id: BackgroundPreset
  label: string
  preview: string // CSS gradient for the preview swatch
}

export const BACKGROUND_PRESETS: BackgroundPresetInfo[] = [
  {
    id: 'dark-mode-pro',
    label: 'Dark Mode Pro',
    preview: 'linear-gradient(135deg, #0f172a, #1e293b)',
  },
  {
    id: 'psychedelic',
    label: 'Psychedelic',
    preview: 'linear-gradient(135deg, #1a0a2e, #ff6ec7, #39ff14)',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    preview: 'linear-gradient(135deg, #050510, #00f0ff, #ff00aa)',
  },
  {
    id: 'aurora-gradient',
    label: 'Aurora Gradient',
    preview: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb, #4facfe)',
  },
  {
    id: 'vaporwave',
    label: 'Vaporwave',
    preview: 'linear-gradient(135deg, #1a0033, #2d0052, #01cdfe)',
  },
  {
    id: 'space-cosmos',
    label: 'Space Cosmos',
    preview: 'linear-gradient(135deg, #0b0b1a, #0a0520, #7c4dff)',
  },
  {
    id: 'ocean-deep',
    label: 'Ocean Deep',
    preview: 'linear-gradient(135deg, #0a1628, #051020, #00e5ff)',
  },
  {
    id: 'japanese-sakura',
    label: 'Sakura',
    preview: 'linear-gradient(135deg, #fdf5f7, #f8eaef, #c87793)',
  },
  {
    id: 'stained-glass',
    label: 'Stained Glass',
    preview: 'linear-gradient(135deg, #1a1520, #ffbf00, #0f52ba, #9b111e)',
  },
  {
    id: 'terminal-cli',
    label: 'Terminal',
    preview: 'linear-gradient(135deg, #010409, #0d1117, #00ff41)',
  },
  {
    id: 'pop-art',
    label: 'Pop Art',
    preview: 'linear-gradient(135deg, #ffffff, #ff1744, #2979ff, #ffd600)',
  },
  {
    id: 'nature-eco',
    label: 'Nature Eco',
    preview: 'linear-gradient(135deg, #f5f3ed, #4a7c59, #8b9467)',
  },
]

interface BackgroundStore {
  preset: BackgroundPreset
  hydrated: boolean
  setPreset: (preset: BackgroundPreset) => void
  hydrate: () => void
}

const DEFAULT_PRESET: BackgroundPreset = 'dark-mode-pro'

export const useBackgroundStore = create<BackgroundStore>((set) => ({
  preset: DEFAULT_PRESET,
  hydrated: false,
  setPreset: (preset) => {
    localStorage.setItem('background-preset', preset)
    set({ preset })
  },
  hydrate: () => {
    const saved = localStorage.getItem('background-preset')
    if (saved && BACKGROUND_PRESETS.some((p) => p.id === saved)) {
      set({ preset: saved as BackgroundPreset, hydrated: true })
    } else {
      set({ hydrated: true })
    }
  },
}))
