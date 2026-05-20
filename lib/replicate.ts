import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

interface TextToImageInput {
  prompt: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
}

interface ImageToImageInput extends TextToImageInput {
  image: string;
  strength?: number;
}

// 文生图
export async function generateTextToImage(input: TextToImageInput) {
  const model = process.env.REPLICATE_MODEL || 'stability-ai/stable-diffusion';
  const version = process.env.REPLICATE_MODEL_VERSION;
  
  const output = await replicate.run(
    version ? `${model}:${version}` : model,
    {
      input: {
        prompt: input.prompt,
        width: input.width || 1024,
        height: input.height || 1024,
        num_inference_steps: input.num_inference_steps || 30,
        guidance_scale: input.guidance_scale || 7.5,
        seed: input.seed || undefined,
      },
    }
  );
  
  return output;
}

// 图生图
export async function generateImageToImage(input: ImageToImageInput) {
  const model = process.env.REPLICATE_MODEL || 'stability-ai/stable-diffusion';
  const version = process.env.REPLICATE_MODEL_VERSION;
  
  const output = await replicate.run(
    version ? `${model}:${version}` : model,
    {
      input: {
        prompt: input.prompt,
        image: input.image,
        strength: input.strength || 0.7,
        width: input.width || 1024,
        height: input.height || 1024,
        num_inference_steps: input.num_inference_steps || 30,
        guidance_scale: input.guidance_scale || 7.5,
        seed: input.seed || undefined,
      },
    }
  );
  
  return output;
}

// 风格迁移
export async function generateStyleTransfer(
  contentImage: string,
  styleImage: string,
  styleStrength: number = 0.8
) {
  // 使用支持风格迁移的模型
  const output = await replicate.run(
    'salesforce/blip:2e1dddc8621f72155f24cf2a1f5db37d91e42630665930b55b6c304812911a52',
    {
      input: {
        content_image: contentImage,
        style_image: styleImage,
        style_strength: styleStrength,
      },
    }
  );
  
  return output;
}
