"use client";

import { useState, useEffect } from "react";
import { ControlPanel } from "./control-panel";
import { DisplayArea } from "./display-area";
import { useAuthContext } from "../auth-provider";
import { useImageGeneration } from "@/lib/hooks/useImageGeneration";
import { toast } from "sonner";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

type DisplayState = "initial" | "generating" | "success" | "error";

export function Workbench() {
  const { user, token, setShowSigninModal, loading: authLoading } = useAuthContext();
  const { 
    state, 
    result, 
    error, 
    progress,
    generateTextToImage, 
    generateImageToImage, 
    reset 
  } = useImageGeneration(token);

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [displayState, setDisplayState] = useState<DisplayState>("initial");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState(user?.credits || 0);

  // 更新用户积分
  useEffect(() => {
    if (user) {
      setRemainingCredits(user.credits);
    }
  }, [user]);

  // 同步生成状态
  useEffect(() => {
    switch (state) {
      case "generating":
        setDisplayState("generating");
        break;
      case "success":
        setDisplayState("success");
        setGeneratedImage(result?.imageUrl || null);
        setRemainingCredits(result?.remainingCredits || remainingCredits);
        break;
      case "error":
        setDisplayState("error");
        if (error) {
          toast.error(error.message);
          if (error.code === "AUTH_REQUIRED") {
            setShowSigninModal(true);
          }
        }
        break;
      case "idle":
        setDisplayState("initial");
        setGeneratedImage(null);
        break;
    }
  }, [state, result, error, setShowSigninModal]);

  const handleGenerate = async () => {
    if (!user) {
      toast.error("请先登录");
      setShowSigninModal(true);
      return;
    }

    if (!prompt.trim()) {
      toast.error("请输入提示词");
      return;
    }

    // 检查积分
    const cost = uploadedImages.length > 0 ? 15 : 10;
    if (user.credits < cost) {
      toast.error(`积分不足！需要 ${cost} 积分，当前 ${user.credits} 积分`);
      return;
    }

    reset();

    if (uploadedImages.length > 0) {
      // 图生图模式
      const firstImage = uploadedImages[0];
      // 创建一个简单的方式上传图片并获取 URL
      // 这里我们使用一个简单的 base64 转换来模拟上传
      const base64Url = firstImage.preview;
      await generateImageToImage(base64Url, prompt, {
        strength: 0.7,
        width: 512,
        height: 512,
        steps: 10,
      });
    } else {
      // 文生图模式
      await generateTextToImage(prompt, {
        width: 512,
        height: 512,
        steps: 10,
      });
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `pixel-alchemy-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToGallery = () => {
    if (!generatedImage) return;
    // 在实际应用中，这会保存到用户的图库
    toast.success("图像已保存到您的图库！");
  };

  // 如果未登录，显示登录提示
  if (!user && !authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold">请先登录</h2>
          <p className="mb-4 text-muted-foreground">登录后才能使用图像生成功能</p>
          <button
            onClick={() => setShowSigninModal(true)}
            className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 text-white"
          >
            立即登录
          </button>
        </div>
      </div>
    );
  }

  // 如果正在加载认证状态
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <ControlPanel
        prompt={prompt}
        onPromptChange={setPrompt}
        style={style}
        onStyleChange={setStyle}
        images={uploadedImages}
        onImagesChange={setUploadedImages}
        onGenerate={handleGenerate}
        isGenerating={displayState === "generating"}
        credits={remainingCredits}
        user={user}
      />
      <DisplayArea
        state={displayState}
        generatedImage={generatedImage}
        progress={progress}
        onDownload={handleDownload}
        onSaveToGallery={handleSaveToGallery}
      />
    </div>
  );
}
