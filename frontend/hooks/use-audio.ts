"use client"

import { useCallback, useEffect, useRef, useState } from 'react'

type SoundType = 'move' | 'capture' | 'takeme' | 'background'

// Web Audio API-based sound generation for lightweight audio
export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isBackgroundPlaying, setIsBackgroundPlaying] = useState(false)
  const backgroundOscillatorRef = useRef<OscillatorNode | null>(null)
  const backgroundGainRef = useRef<GainNode | null>(null)
  
  // Initialize audio context on first interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])
  
  // Play a simple tone (for sound effects)
  const playTone = useCallback((
    frequency: number, 
    duration: number, 
    type: OscillatorType = 'sine',
    volume: number = 0.3
  ) => {
    if (isMuted) return
    
    try {
      const ctx = initAudioContext()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (e) {
      console.log('[v0] Audio playback error:', e)
    }
  }, [isMuted, initAudioContext])
  
  // Play sound effects
  const playSound = useCallback((sound: SoundType) => {
    if (isMuted) return
    
    switch (sound) {
      case 'move':
        // Light "tap" sound - short high frequency
        playTone(800, 0.1, 'sine', 0.2)
        setTimeout(() => playTone(600, 0.05, 'sine', 0.15), 50)
        break
        
      case 'capture':
        // More dramatic capture sound
        playTone(400, 0.15, 'square', 0.25)
        setTimeout(() => playTone(300, 0.1, 'square', 0.2), 80)
        setTimeout(() => playTone(200, 0.15, 'sine', 0.15), 150)
        break
        
      case 'takeme':
        // Playful "Take Me!" sound - ascending notes
        playTone(523, 0.15, 'sine', 0.3) // C5
        setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 120) // E5
        setTimeout(() => playTone(784, 0.2, 'sine', 0.35), 240) // G5
        break
        
      case 'background':
        // Background music would be more complex
        // For simplicity, we'll just toggle the state
        break
    }
  }, [isMuted, playTone])
  
  // Simple background melody using oscillators
  const startBackgroundMusic = useCallback(() => {
    if (isMuted || isBackgroundPlaying) return
    
    try {
      const ctx = initAudioContext()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      
      // Create a very soft ambient sound
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      
      // LFO for gentle volume modulation
      lfo.frequency.setValueAtTime(0.5, ctx.currentTime)
      lfoGain.gain.setValueAtTime(0.02, ctx.currentTime)
      lfo.connect(lfoGain)
      lfoGain.connect(gainNode.gain)
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(220, ctx.currentTime) // A3 - soft ambient tone
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime) // Very quiet
      
      oscillator.start()
      lfo.start()
      
      backgroundOscillatorRef.current = oscillator
      backgroundGainRef.current = gainNode
      setIsBackgroundPlaying(true)
    } catch (e) {
      console.log('[v0] Background music error:', e)
    }
  }, [isMuted, isBackgroundPlaying, initAudioContext])
  
  const stopBackgroundMusic = useCallback(() => {
    if (backgroundOscillatorRef.current && backgroundGainRef.current) {
      try {
        const ctx = audioContextRef.current
        if (ctx) {
          backgroundGainRef.current.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
          setTimeout(() => {
            backgroundOscillatorRef.current?.stop()
            backgroundOscillatorRef.current = null
            backgroundGainRef.current = null
          }, 500)
        }
      } catch {
        // Oscillator might already be stopped
      }
      setIsBackgroundPlaying(false)
    }
  }, [])
  
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        stopBackgroundMusic()
      }
      return !prev
    })
  }, [stopBackgroundMusic])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBackgroundMusic()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [stopBackgroundMusic])
  
  return {
    playSound,
    isMuted,
    toggleMute,
    startBackgroundMusic,
    stopBackgroundMusic,
    isBackgroundPlaying
  }
}
