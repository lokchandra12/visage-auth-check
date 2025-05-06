
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';
import { FaceDetection, FaceImage } from '../models/faceTypes';

// Initialize TensorFlow.js and the face detector
let detector: faceDetection.FaceDetector | null = null;

export const initFaceDetector = async (): Promise<void> => {
  await tf.ready();
  console.log("TensorFlow.js loaded:", tf.getBackend());
  
  // Load the MediaPipe face detector model
  const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
  const detectorConfig = {
    runtime: 'tfjs' as const,
    refineLandmarks: true,
    maxFaces: 1
  };
  
  detector = await faceDetection.createDetector(model, detectorConfig);
  console.log("Face detector loaded");
};

export const detectFace = async (videoElement: HTMLVideoElement): Promise<FaceDetection | null> => {
  if (!detector) {
    console.log("Detector not initialized, initializing now...");
    await initFaceDetector();
  }
  
  try {
    const predictions = await detector!.estimateFaces(videoElement);
    
    if (predictions.length > 0) {
      const face = predictions[0];
      const box = face.box;
      
      // Use a fallback pattern to handle different versions of the API
      // Different models may return confidence under different property names
      const confidenceScore = 
        // @ts-ignore - Handle potential property differences in model versions
        face.scoreConfidence || face.probability || face.score || 0;
      
      return {
        box: {
          xMin: box.xMin,
          yMin: box.yMin,
          width: box.width,
          height: box.height
        },
        landmarks: face.keypoints?.map(kp => [kp.x, kp.y]) || [],
        confidence: confidenceScore
      };
    }
  } catch (error) {
    console.error("Error detecting face:", error);
  }
  
  return null;
};

export const captureFace = async (
  videoElement: HTMLVideoElement, 
  canvasElement: HTMLCanvasElement
): Promise<FaceImage | null> => {
  const face = await detectFace(videoElement);
  
  if (!face || face.confidence < 0.8) {
    return null;
  }
  
  const context = canvasElement.getContext('2d');
  if (!context) return null;
  
  // Match canvas size to video
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  
  // Draw only the face region to the canvas
  const { box } = face;
  const padding = 20;
  
  // Create a new canvas just for the face
  const faceCanvas = document.createElement('canvas');
  const faceContext = faceCanvas.getContext('2d');
  if (!faceContext) return null;
  
  faceCanvas.width = box.width + padding * 2;
  faceCanvas.height = box.height + padding * 2;
  
  // Draw the face region to the face canvas with padding
  faceContext.drawImage(
    videoElement,
    box.xMin - padding, 
    box.yMin - padding,
    box.width + padding * 2, 
    box.height + padding * 2,
    0, 
    0,
    box.width + padding * 2, 
    box.height + padding * 2
  );
  
  // Draw full image to the main canvas for display
  context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  
  // Convert face canvas to data URL
  const dataUrl = faceCanvas.toDataURL('image/jpeg', 0.8);
  
  return {
    data: dataUrl,
    detection: face,
    timestamp: Date.now()
  };
};

export const compareImageSimilarity = async (
  image1: FaceImage,
  image2: FaceImage
): Promise<number> => {
  // In a real implementation, this would use facial embedding vectors
  // and compute similarity using cosine similarity or Euclidean distance
  
  // For this demo, we'll use a simple placeholder that returns a random
  // but biased similarity score between 0.6 and 1.0
  const baseSimilarity = 0.6;
  const randomComponent = Math.random() * 0.4;
  
  return baseSimilarity + randomComponent;
};

// Compare a face with an array of face images and return the average similarity
export const compareWithRegisteredFaces = async (
  newFace: FaceImage,
  registeredFaces: FaceImage[]
): Promise<number> => {
  if (registeredFaces.length === 0) return 0;
  
  const similarities = await Promise.all(
    registeredFaces.map(regFace => compareImageSimilarity(newFace, regFace))
  );
  
  // Calculate average similarity
  const sum = similarities.reduce((acc, val) => acc + val, 0);
  return sum / similarities.length;
};
