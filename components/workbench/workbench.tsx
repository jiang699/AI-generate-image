"use client";

import { useState, useEffect, useCallback } from "react";
import { ControlPanel } from "./control-panel";
import { DisplayArea } from "./display-area";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

type DisplayState = "initial" | "generating" | "success";

// Demo generated images for simulation
const DEMO_IMAGES = [
  "/gallery/image-1.jpg",
  "/gallery/image-2.jpg",
  "/gallery/image-3.jpg",
  "/gallery/image-4.jpg",
  "/gallery/image-5.jpg",
  "/gallery/image-6.jpg",
  "/gallery/image-7.jpg",
  "/gallery/image-8.jpg",
];

export function Workbench() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [displayState, setDisplayState] = useState<DisplayState>("initial");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Countdown timer during generation
  useEffect(() => {
    if (displayState !== "generating" || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [displayState, remainingTime]);

  const handleGenerate = useCallback(() => {
    setDisplayState("generating");
    setRemainingTime(5);

    // Simulate AI generation
    setTimeout(() => {
      const randomImage = DEMO_IMAGES[Math.floor(Math.random() * DEMO_IMAGES.length)];
      setGeneratedImage(randomImage);
      setDisplayState("success");
    }, 5000);
  }, []);

  const handleDownload = useCallback(() => {
    if (!generatedImage) return;
    
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `pixel-alchemy-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedImage]);

  const handleSaveToGallery = useCallback(() => {
    // In a real app, this would save to user's gallery
    alert("图像已保存到您的图库！");
  }, []);

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
      />
      <DisplayArea
        state={displayState}
        generatedImage={generatedImage}
        remainingTime={remainingTime}
        onDownload={handleDownload}
        onSaveToGallery={handleSaveToGallery}
      />
    </div>
  );
}
