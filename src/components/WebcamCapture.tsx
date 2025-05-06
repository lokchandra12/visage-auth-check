
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { detectFace, captureFace } from '../services/faceDetectionService';
import { FaceDetection, FaceImage } from '../models/faceTypes';
import { Button } from './ui/button';

interface WebcamCaptureProps {
  onCapture: (faceImage: FaceImage) => void;
  isCaptureEnabled: boolean;
  capturingText?: string;
  readyText?: string;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCapture,
  isCaptureEnabled,
  capturingText = "Capturing Face...",
  readyText = "Face Detected. Ready to capture."
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceBounds, setFaceBounds] = useState<FaceDetection | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(true);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("Starting camera...");

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  const detectFaceInFrame = useCallback(async () => {
    if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const face = await detectFace(video);
      
      if (face && face.confidence > 0.8) {
        setFaceBounds(face);
        setMessage(readyText);
      } else {
        setFaceBounds(null);
        setMessage("No face detected. Please position your face in the camera.");
      }
    }
  }, [readyText]);

  useEffect(() => {
    let detectionInterval: number;

    if (isDetecting) {
      detectionInterval = window.setInterval(detectFaceInFrame, 100);
    }

    return () => {
      clearInterval(detectionInterval);
    };
  }, [isDetecting, detectFaceInFrame]);

  const handleCameraReady = () => {
    setCameraReady(true);
    setMessage("Camera ready. Please position your face in the frame.");
  };

  const captureFaceImage = useCallback(async () => {
    if (
      webcamRef.current && 
      webcamRef.current.video && 
      canvasRef.current &&
      faceBounds && 
      faceBounds.confidence > 0.8
    ) {
      const video = webcamRef.current.video;
      setMessage(capturingText);
      
      const faceImage = await captureFace(video, canvasRef.current);
      if (faceImage) {
        onCapture(faceImage);
      }
    }
  }, [faceBounds, onCapture, capturingText]);

  useEffect(() => {
    if (isCaptureEnabled && faceBounds && faceBounds.confidence > 0.8) {
      captureFaceImage();
    }
  }, [isCaptureEnabled, faceBounds, captureFaceImage]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="camera-box bg-black">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          onUserMedia={handleCameraReady}
          mirrored
          className="w-full h-auto"
        />
        
        {faceBounds && (
          <div 
            className="face-overlay"
            style={{
              left: `${(faceBounds.box.xMin / 640) * 100}%`,
              top: `${(faceBounds.box.yMin / 480) * 100}%`,
              width: `${(faceBounds.box.width / 640) * 100}%`,
              height: `${(faceBounds.box.height / 480) * 100}%`
            }}
          />
        )}
        
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full opacity-0"
        />
      </div>
      
      <div className="mt-4 text-center">
        <p className={`text-sm ${faceBounds ? 'text-green-600' : 'text-amber-600'}`}>
          {message}
        </p>
      </div>
      
      <canvas 
        ref={canvasRef} 
        className="hidden"
      />
    </div>
  );
};

export default WebcamCapture;
