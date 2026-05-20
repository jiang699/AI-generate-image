"use client";

import { useState, useCallback } from 'react';

export interface GenerationResult {
  id: string;
  status: 'completed' | 'failed';
  prompt: string;
  imageUrl: string | null;
  creditsUsed: number;
  remainingCredits: number;
}

export interface GenerationError {
  code: string;
  message: string;
}

export type GenerationState = 'idle' | 'generating' | 'success' | 'error';

export function useImageGeneration(token: string | null) {
  const [state, setState] = useState<GenerationState>('idle');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<GenerationError | null>(null);
  const [progress, setProgress] = useState(0);

  const generateTextToImage = useCallback(async (prompt: string, settings?: {
    width?: number;
    height?: number;
    steps?: number;
    guidance?: number;
    seed?: number;
  }) => {
    if (!token) {
      setError({ code: 'AUTH_REQUIRED', message: '请先登录' });
      setState('error');
      return;
    }

    setState('generating');
    setError(null);
    setProgress(0);

    // 模拟进度
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 500);

    try {
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          width: settings?.width || 512,
          height: settings?.height || 512,
          steps: settings?.steps || 10,
          guidance: settings?.guidance || 7.5,
          seed: settings?.seed,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (data.success) {
        setResult({
          id: data.data.id,
          status: data.data.status,
          prompt: data.data.prompt,
          imageUrl: data.data.imageUrl,
          creditsUsed: data.data.creditsUsed,
          remainingCredits: data.data.remainingCredits,
        });
        setState('success');
      } else {
        setError(data.error);
        setState('error');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setError({
        code: 'INTERNAL_ERROR',
        message: '网络错误，请稍后重试',
      });
      setState('error');
    }
  }, [token]);

  const generateImageToImage = useCallback(async (
    imageUrl: string,
    prompt: string,
    settings?: {
      strength?: number;
      width?: number;
      height?: number;
      steps?: number;
      guidance?: number;
      seed?: number;
    }
  ) => {
    if (!token) {
      setError({ code: 'AUTH_REQUIRED', message: '请先登录' });
      setState('error');
      return;
    }

    setState('generating');
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 500);

    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrl,
          prompt,
          strength: settings?.strength || 0.7,
          width: settings?.width || 512,
          height: settings?.height || 512,
          steps: settings?.steps || 10,
          guidance: settings?.guidance || 7.5,
          seed: settings?.seed,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (data.success) {
        setResult({
          id: data.data.id,
          status: data.data.status,
          prompt: data.data.prompt,
          imageUrl: data.data.imageUrl,
          creditsUsed: data.data.creditsUsed,
          remainingCredits: data.data.remainingCredits,
        });
        setState('success');
      } else {
        setError(data.error);
        setState('error');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setError({
        code: 'INTERNAL_ERROR',
        message: '网络错误，请稍后重试',
      });
      setState('error');
    }
  }, [token]);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    state,
    result,
    error,
    progress,
    generateTextToImage,
    generateImageToImage,
    reset,
  };
}
