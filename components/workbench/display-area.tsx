"use client";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Download, FolderPlus, Sparkles, Wand2 } from "lucide-react";
import Image from "next/image";

type DisplayState = "initial" | "generating" | "success";

interface DisplayAreaProps {
  state: DisplayState;
  generatedImage: string | null;
  remainingTime: number;
  onDownload: () => void;
  onSaveToGallery: () => void;
}

export function DisplayArea({
  state,
  generatedImage,
  remainingTime,
  onDownload,
  onSaveToGallery,
}: DisplayAreaProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
      {state === "initial" && <InitialState />}
      {state === "generating" && <GeneratingState remainingTime={remainingTime} />}
      {state === "success" && generatedImage && (
        <SuccessState
          imageUrl={generatedImage}
          onDownload={onDownload}
          onSaveToGallery={onSaveToGallery}
        />
      )}
    </main>
  );
}

function InitialState() {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-md">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
        <Wand2 className="size-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        准备开始创作
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        在左侧输入你的创意提示词，选择喜欢的风格，
        <br />
        点击「生成图像」按钮，见证AI的魔法
      </p>
      <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
        <Sparkles className="size-4 text-primary" />
        <span>支持中英文提示词</span>
      </div>
    </div>
  );
}

function GeneratingState({ remainingTime }: { remainingTime: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-30 animate-pulse" />
        <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          <Spinner className="size-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        AI正在创作中
      </h3>
      <p className="text-muted-foreground mb-4">
        正在将你的想象力转化为视觉艺术...
      </p>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
        <span className="text-muted-foreground">预计剩余时间：</span>
        <span className="font-mono font-semibold text-foreground">
          {remainingTime}秒
        </span>
      </div>
    </div>
  );
}

function SuccessState({
  imageUrl,
  onDownload,
  onSaveToGallery,
}: {
  imageUrl: string;
  onDownload: () => void;
  onSaveToGallery: () => void;
}) {
  return (
    <div className="flex flex-col items-center w-full max-w-2xl">
      <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-border shadow-2xl shadow-purple-500/10">
        <Image
          src={imageUrl}
          alt="AI生成的图像"
          fill
          className="object-contain bg-black/50"
        />
      </div>
      <div className="flex gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onDownload}
          className="gap-2"
        >
          <Download className="size-4" />
          下载图像
        </Button>
        <Button
          onClick={onSaveToGallery}
          className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
        >
          <FolderPlus className="size-4" />
          保存到图库
        </Button>
      </div>
    </div>
  );
}
