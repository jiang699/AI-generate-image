"use client";

import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { ImageUpload } from "./image-upload";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface ControlPanelProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  style: string;
  onStyleChange: (value: string) => void;
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const STYLE_OPTIONS = [
  { value: "photorealistic", label: "超写实摄影" },
  { value: "anime", label: "日系动漫" },
  { value: "oil-painting", label: "油画风格" },
  { value: "watercolor", label: "水彩插画" },
  { value: "cyberpunk", label: "赛博朋克" },
  { value: "fantasy", label: "奇幻艺术" },
  { value: "minimalist", label: "极简主义" },
  { value: "3d-render", label: "3D渲染" },
];

export function ControlPanel({
  prompt,
  onPromptChange,
  style,
  onStyleChange,
  images,
  onImagesChange,
  onGenerate,
  isGenerating,
}: ControlPanelProps) {
  return (
    <aside className="w-80 shrink-0 bg-secondary/50 border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">创作控制台</h2>
        <p className="text-xs text-muted-foreground mt-1">
          输入提示词，释放你的创意
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            提示词 <span className="text-primary">*</span>
          </label>
          <Textarea
            placeholder="描述你想要生成的图像...&#10;&#10;例如：一只戴着宇航员头盔的橘猫，漂浮在星空中，周围环绕着彩色星云，超高清，8K细节"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            className="min-h-32 resize-none bg-background/50"
          />
          <p className="text-xs text-muted-foreground">
            提示词越详细，生成效果越精准
          </p>
        </div>

        {/* Image Upload */}
        <ImageUpload images={images} onImagesChange={onImagesChange} />

        {/* Style Select */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            生成风格
          </label>
          <Select value={style} onValueChange={onStyleChange}>
            <SelectTrigger className="w-full bg-background/50">
              <SelectValue placeholder="选择风格" />
            </SelectTrigger>
            <SelectContent>
              {STYLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generate Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={onGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/25"
        >
          <Sparkles className="size-5" />
          {isGenerating ? "生成中..." : "生成图像"}
        </Button>
      </div>
    </aside>
  );
}
