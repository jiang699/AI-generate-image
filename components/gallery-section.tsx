"use client"

import Image from "next/image"

const galleryImages = [
  {
    src: "/gallery/image-1.jpg",
    alt: "赛博朋克风格的未来城市",
    height: "tall",
  },
  {
    src: "/gallery/image-2.jpg",
    alt: "梦幻森林中的精灵",
    height: "medium",
  },
  {
    src: "/gallery/image-3.jpg",
    alt: "抽象艺术作品",
    height: "short",
  },
  {
    src: "/gallery/image-4.jpg",
    alt: "宇宙星空中的宇航员",
    height: "medium",
  },
  {
    src: "/gallery/image-5.jpg",
    alt: "日式浮世绘风格的海浪",
    height: "tall",
  },
  {
    src: "/gallery/image-6.jpg",
    alt: "超现实主义风景",
    height: "short",
  },
  {
    src: "/gallery/image-7.jpg",
    alt: "水彩风格的花卉",
    height: "medium",
  },
  {
    src: "/gallery/image-8.jpg",
    alt: "机械龙的概念设计",
    height: "tall",
  },
]

const heightClasses = {
  tall: "row-span-2",
  medium: "row-span-1",
  short: "row-span-1",
}

export function GallerySection() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            用户精选作品
          </h2>
          <p className="text-lg text-muted-foreground">
            探索由 Pixel Alchemy 社区创作的精彩作品，见证AI的无限创造力
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl"
            >
              <div 
                className={`relative ${
                  image.height === "tall" 
                    ? "aspect-[3/4]" 
                    : image.height === "medium" 
                    ? "aspect-square" 
                    : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="text-sm font-medium">{image.alt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
