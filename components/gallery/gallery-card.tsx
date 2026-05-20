"use client"

import Image from "next/image"
import { Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface GalleryCardProps {
  id: string
  src: string
  alt: string
  onDownload: (id: string) => void
  onDelete: (id: string) => void
}

export function GalleryCard({ id, src, alt, onDownload, onDelete }: GalleryCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/50 p-0 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
      <div className="relative aspect-square">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex gap-3 pb-6">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
              onClick={() => onDownload(id)}
            >
              <Download className="h-5 w-5" />
              <span className="sr-only">下载图片</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-red-500/80 hover:text-white"
              onClick={() => onDelete(id)}
            >
              <Trash2 className="h-5 w-5" />
              <span className="sr-only">删除图片</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
