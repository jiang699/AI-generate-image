import { Wand2, Users, Palette } from "lucide-react"

const features = [
  {
    icon: Wand2,
    title: "无限创意文生图",
    description: "输入任何文字描述，AI即刻理解你的创意意图，生成高质量的图像作品。支持多种艺术风格和场景。",
  },
  {
    icon: Users,
    title: "惊人的角色一致性",
    description: "独创的角色锁定技术，确保同一角色在不同场景中保持一致的外观特征，非常适合创作连续性内容。",
  },
  {
    icon: Palette,
    title: "一键智能风格迁移",
    description: "上传任意参考图片，AI自动分析并提取其艺术风格，一键应用到你的创作中，轻松实现风格统一。",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            强大的创作能力
          </h2>
          <p className="text-lg text-muted-foreground">
            Pixel Alchemy 配备了最先进的AI模型，为你提供专业级的图像生成体验
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all hover:border-purple-500/30 hover:bg-card/80"
            >
              {/* Icon */}
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <feature.icon className="h-6 w-6 text-purple-400" />
              </div>

              {/* Content */}
              <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

              {/* Hover glow effect */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
