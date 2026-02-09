'use client'

import {
  type BackgroundPreset,
  BACKGROUND_PRESETS,
  useBackgroundStore,
} from '@/hooks/background'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Palette } from 'lucide-react'

export const BackgroundSelector = () => {
  const { preset, setPreset } = useBackgroundStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          title="背景を変更"
        >
          <Palette className="w-5 h-5 text-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>背景テーマ</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={preset}
          onValueChange={(value) => setPreset(value as BackgroundPreset)}
        >
          {BACKGROUND_PRESETS.map((bg) => (
            <DropdownMenuRadioItem
              key={bg.id}
              value={bg.id}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div
                className="w-5 h-5 rounded-full shrink-0 border border-border"
                style={{ background: bg.preview }}
              />
              <span>{bg.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
