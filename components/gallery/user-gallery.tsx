"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GalleryCard } from "./gallery-card"

// Mock data for demonstration
const initialImages = [
  { id: "1", src: "/gallery/image-1.jpg", alt: "赛博朋克城市" },
  { id: "2", src: "/gallery/image-2.jpg", alt: "精灵森林" },
  { id: "3", src: "/gallery/image-3.jpg", alt: "抽象艺术" },
  { id: "4", src: "/gallery/image-4.jpg", alt: "宇航员" },
  { id: "5", src: "/gallery/image-5.jpg", alt: "浮世绘海浪" },
  { id: "6", src: "/gallery/image-6.jpg", alt: "超现实风景" },
  { id: "7", src: "/gallery/image-7.jpg", alt: "水彩花卉" },
  { id: "8", src: "/gallery/image-8.jpg", alt: "机械龙" },
]

export function UserGallery() {
  const [images, setImages] = useState(initialImages)

  const handleDownload = (id: string) => {
    const image = images.find(img => img.id === id)
    if (image) {
      const link = document.createElement("a")
      link.href = image.src
      link.download = `pixel-alchemy-${image.alt}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleDelete = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const handleUpload = () => {
    // In a real app, this would open a file picker
    alert("上传功能将在此处实现")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            我的创作
          </h1>
          <Button
            onClick={handleUpload}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4" />
            上传新作品
          </Button>
        </div>

        {/* Gallery Grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <GalleryCard
                key={image.id}
                id={image.id}
                src={image.src}
                alt={image.alt}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-foreground">暂无作品</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              开始创作或上传你的第一张作品
            </p>
            <Button
              onClick={handleUpload}
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="h-4 w-4" />
              上传新作品
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
