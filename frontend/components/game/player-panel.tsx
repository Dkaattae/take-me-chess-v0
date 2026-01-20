"use client"

import type { Player } from '@/lib/chess/types'
import { cn } from '@/lib/utils'
import { Bot, User, Crown } from 'lucide-react'

interface PlayerPanelProps {
  player: Player
  pieceCount: number
  isCurrentTurn: boolean
  isTop?: boolean
}

export function PlayerPanel({ player, pieceCount, isCurrentTurn, isTop }: PlayerPanelProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 w-full max-w-[480px]",
        isCurrentTurn 
          ? "bg-primary/10 border-2 border-primary shadow-lg" 
          : "bg-muted/50 border-2 border-transparent",
        isTop && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div 
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-md border-2",
          player.color === 'white' 
            ? "bg-[var(--piece-white)] border-border" 
            : "bg-[var(--piece-black)] border-border"
        )}
      >
        {player.isBot ? (
          player.avatar ? (
            <span className="text-2xl">{player.avatar}</span>
          ) : (
            <Bot className={cn(
              "w-7 h-7",
              player.color === 'white' ? "text-foreground" : "text-primary-foreground"
            )} />
          )
        ) : (
          <User className={cn(
            "w-7 h-7",
            player.color === 'white' ? "text-foreground" : "text-primary-foreground"
          )} />
        )}
      </div>
      
      {/* Player info */}
      <div className={cn("flex-1", isTop && "text-right")}>
        <div className="flex items-center gap-2">
          {isTop && isCurrentTurn && (
            <Crown className="w-4 h-4 text-primary animate-pulse" />
          )}
          <span className="font-semibold text-lg text-foreground">
            {player.name}
          </span>
          {!isTop && isCurrentTurn && (
            <Crown className="w-4 h-4 text-primary animate-pulse" />
          )}
          {player.isBot && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">
              Bot
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={cn(
            "w-3 h-3 rounded-full border",
            player.color === 'white' ? "bg-[var(--piece-white)]" : "bg-[var(--piece-black)]"
          )} />
          <span>{player.color === 'white' ? 'White' : 'Black'}</span>
          <span className="mx-1">•</span>
          <span className="font-medium">{pieceCount} pieces left</span>
        </div>
      </div>
      
      {/* Turn indicator */}
      {isCurrentTurn && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary hidden sm:inline">Your turn</span>
        </div>
      )}
    </div>
  )
}
