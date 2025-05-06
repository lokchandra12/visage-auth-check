
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { detectFace, captureFace } from '../services/faceDetectionService';
import { FaceDetection, FaceImage } from '../models/faceTypes';
import { Button } from './ui/button';
import { Camera } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (faceImage: FaceImage) => void;
  isCaptureEnabled: boolean;
  capturingText?: string;
  readyText?: string;
  onManualCapture?: () => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCapture,
  isCaptureEnabled,
  capturingText = "Capturing Face...",
  readyText = "Face Detected. Ready to capture.",
  onManualCapture
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceBounds, setFaceBounds] = useState<FaceDetection | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(true);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("Starting camera...");
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

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
      canvasRef.current
    ) {
      const video = webcamRef.current.video;
      setIsCapturing(true);
      setMessage(capturingText);
      
      const faceImage = await captureFace(video, canvasRef.current);
      if (faceImage) {
        onCapture(faceImage);
      }
      
      setIsCapturing(false);
    }
  }, [onCapture, capturingText]);

  useEffect(() => {
    if (isCaptureEnabled && faceBounds && faceBounds.confidence > 0.8) {
      captureFaceImage();
    }
  }, [isCaptureEnabled, faceBounds, captureFaceImage]);

  const handleManualCapture = () => {
    if (onManualCapture) {
      onManualCapture();
    }
  };

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
            className="face-overlay absolute border-2 border-green-500"
            style={{
              left: `${(faceBounds.box.xMin / 640) * 100}%`,
              top: `${(faceBounds.box.yMin / 480) * 100}%`,
              width: `${(faceBounds.box.width / 640) * 100}%`,
              height: `${(faceBounds.box.height / 480) * 100}%`
            }}
          />
        )}
      </div>
      
      <div className="mt-4 text-center w-full">
        <p className={`text-sm ${faceBounds ? 'text-green-600' : 'text-amber-600'}`}>
          {message}
        </p>
        
        {onManualCapture && (
          <Button 
            onClick={handleManualCapture} 
            className="mt-4" 
            disabled={isCapturing}
          >
            <Camera className="mr-2" />
            Take 10 Pictures
          </Button>
        )}
      </div>
      
      <canvas 
        ref={canvasRef} 
        className="hidden"
      />
    </div>
  );
};

export default WebcamCapture;
