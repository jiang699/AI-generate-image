"use client";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, FolderPlus, Sparkles, Wand2, AlertCircle, RefreshCw } from "lucide-react";
import Image from "next/image";

type DisplayState = "initial" | "generating" | "success" | "error";

interface DisplayAreaProps {
  state: DisplayState;
  generatedImage: string | null;
  progress: number;
  onDownload: () => void;
  onSaveToGallery: () => void;
  onRetry?: () => void;
}

export function DisplayArea({
  state,
  generatedImage,
  progress,
  onDownload,
  onSaveToGallery,
  onRetry,
}: DisplayAreaProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
      {state === "initial" && <InitialState />}
      {state === "generating" && <GeneratingState progress={progress} />}
      {state === "success" && generatedImage && (
        <SuccessState
          imageUrl={generatedImage}
          onDownload={onDownload}
          onSaveToGallery={onSaveToGallery}
        />
      )}
      {state === "error" && <ErrorState onRetry={onRetry} />}
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

function GeneratingState({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-md">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-30 animate-pulse" />
        <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          <Spinner className="size-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        AI正在创作中
      </h3>
      <p className="text-muted-foreground mb-6">
        正在将你的想象力转化为视觉艺术...
      </p>
      <div className="w-full">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">生成进度</span>
          <span className="font-mono font-semibold text-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
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

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-md">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-red-500/20 mb-6">
        <AlertCircle className="size-10 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        生成失败
      </h3>
      <p className="text-muted-foreground leading-relaxed mb-6">
        图像生成过程中出现错误，请检查您的网络连接和提示词。
        <br />
        如果问题持续存在，请稍后重试。
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
        >
          <RefreshCw className="size-4" />
          重新生成
        </Button>
      )}
    </div>
  );
}
