'use client'

import { useAvatar } from '@/hooks/avatar'
import { CameraControls, Environment, Float } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

import type React from 'react'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { MathUtils } from 'three'
import { Avatar } from './avatar'
import { Menus } from './menus'
import { MessagesList } from './messages-list'
import { StateIndicator } from './state-indicator'

const locationStyles = {
  default: {
    boardPosition: 'top-4 left-4 md:top-[150px] md:left-[8%]',
    avatarPosition: [2, -3, -2.3] as [number, number, number],
    avatarScale: 3,
    avatarRotation: MathUtils.degToRad(135),
  },
}

type CameraPositionKey = 'default' | 'loading' | 'speaking'

const CAMERA_POSITIONS: Record<CameraPositionKey, [number, number, number]> = {
  default: [0, 0, 0],
  loading: [0, 0, 0],
  speaking: [0, 0, 0],
}

const CAMERA_ZOOMS: Record<CameraPositionKey, number> = {
  default: 0.8,
  loading: 0.8,
  speaking: 0.8,
}

export interface Message {
  id: number
  question: string
  answer?: {
    response: string
    conversationType: string
    title?: string
    description?: string
  }
}

const CameraManager: React.FC<{ reduceMotion: boolean }> = ({ reduceMotion }) => {
  const controls = useRef<CameraControls>(null)

  useEffect(() => {
    if (controls.current) {
      controls.current.setPosition(...CAMERA_POSITIONS.default, !reduceMotion)
      controls.current.zoomTo(CAMERA_ZOOMS.default, !reduceMotion)
    }
  }, [reduceMotion])

  return <CameraControls ref={controls} minZoom={0.5} maxZoom={3} enabled={false} />
}

const Canvas3D: React.FC<{
  children: React.ReactNode
  fallback?: React.ReactNode
  reduceMotion: boolean
  performanceMode: boolean
}> = ({ children, fallback, reduceMotion, performanceMode }) => {
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-4">{'3Dコンテンツを読み込めませんでした。デバイスの制限による可能性があります。'}</p>
          {fallback}
        </div>
      </div>
    )
  }

  return (
    <Canvas
      onError={handleError}
      camera={{
        position: [0, 0, 0],
        fov: 80,
      }}
      performance={{
        min: performanceMode ? 0.2 : 0.5,
        debounce: performanceMode ? 200 : 100,
      }}
    >
      <CameraManager reduceMotion={reduceMotion} />
      <Suspense fallback={null}>
        <Float
          speed={reduceMotion ? 0 : 0.5}
          floatIntensity={reduceMotion ? 0 : 0.2}
          rotationIntensity={reduceMotion ? 0 : 0.1}
        >
          <Environment preset="sunset" />
          <ambientLight intensity={0.8} color="warm" />
          {children}
        </Float>
      </Suspense>
    </Canvas>
  )
}

const StatusAnnouncer: React.FC<{ loading: boolean; speaking: boolean }> = ({ loading, speaking }) => {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {loading && 'AIアバターがリクエストについて考えています'}
      {speaking && 'AIアバターが回答を準備しています'}
    </div>
  )
}

const useIntersectionObserver = (elementRef: React.RefObject<HTMLElement>) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.1 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return isVisible
}

export const Chat: React.FC = () => {
  // Avatar state
  const avatar = useAvatar((state) => state.avatar)
  const loading = useAvatar((state) => state.loading)
  const currentMessage = useAvatar((state) => state.currentMessage)

  // Accessibility: Detect user preferences
  const [reduceMotion, setReduceMotion] = useState(false)
  const [performanceMode, setPerformanceMode] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const is3DVisible = useIntersectionObserver(containerRef as React.RefObject<HTMLElement>)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)

    // Performance mode detection (low-end devices)
    const connection = (navigator as any).connection
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      setPerformanceMode(true)
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const currentStyle = locationStyles.default
  const boardBackground = 'bg-card/95 backdrop-blur-sm border-border'

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" aria-label="AIアバターインターフェース">
      <StatusAnnouncer loading={loading} speaking={!!currentMessage} />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded"
      >
        {'メインコンテンツにスキップ'}
      </a>

      {/* 3D Canvas - Only load when visible and not in performance mode */}
      {is3DVisible && !performanceMode && (
        <div className="absolute inset-0 pointer-events-none">
          <Canvas3D
            reduceMotion={reduceMotion}
            performanceMode={performanceMode}
            fallback={
              <button
                onClick={() => setPerformanceMode(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                {'3Dアバターを読み込む'}
              </button>
            }
          >
            <Avatar
              avatar={avatar}
              key={avatar}
              position={currentStyle.avatarPosition}
              scale={currentStyle.avatarScale}
              rotation-y={currentStyle.avatarRotation}
            />
          </Canvas3D>
        </div>
      )}

      {/* Performance mode fallback */}
      {performanceMode && (
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 max-w-sm">
            <p className="text-sm text-foreground mb-2">{'パフォーマンス向上のため3Dアバターを無効化'}</p>
            <button
              onClick={() => setPerformanceMode(false)}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              {'とにかく有効にする'}
            </button>
          </div>
        </div>
      )}

      {/* 2D UI Overlay */}
      <div className="relative z-10 pointer-events-none">
        {/* Information Board/Messages Area */}
        <div
          id="main-content"
          className={`absolute ${currentStyle.boardPosition} transition-all ${reduceMotion ? '' : 'duration-700'} pointer-events-auto z-20`}
        >
          <div className="relative max-w-md md:max-w-lg lg:max-w-xl">
            <div className={`${boardBackground} rounded-lg border-4 md:border-8 shadow-2xl`}>
              <MessagesList />
            </div>
          </div>
        </div>

        {/* Avatar Spotlight/Indicator - Respects reduced motion */}
        {(currentMessage || loading) && (
          <div className="absolute bottom-[15%] right-[15%] md:right-[20%] pointer-events-none">
            <div
              className={`w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-r from-blue-400/20 to-green-400/20 backdrop-blur-sm border-2 border-blue-400/40 ${reduceMotion ? '' : 'animate-pulse'}`}
            >
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-r from-blue-300/10 to-green-300/10 ${reduceMotion ? '' : 'animate-ping'}`}
              />
            </div>
          </div>
        )}

        {/* Input Area - Enhanced for accessibility */}
        <div className="absolute bottom-4 left-4 flex justify-center pointer-events-auto z-50">
          <div className="w-full max-w-2xl">
            <Menus />
          </div>
        </div>

        {/* Camera zoom effect overlay - Respects motion preferences */}
        <div
          className={`absolute inset-0 pointer-events-none transition-all ${reduceMotion ? '' : 'duration-1000'} ${
            loading ? 'bg-black/10' : currentMessage ? 'bg-black/5' : 'bg-transparent'
          }`}
        />
      </div>

      {/* State Indicator - Shows current processing state */}
      <StateIndicator />
    </div>
  )
}
