
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FaceImage } from '../models/faceTypes';
import { saveUser, getUserByUsername } from '../services/authService';
import { initFaceDetector, captureFace } from '../services/faceDetectionService';

export const useFaceRegistration = (requiredFaceCount = 10) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [capturedFaces, setCapturedFaces] = useState<FaceImage[]>([]);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [usernameError, setUsernameError] = useState<string>('');
  const [registrationStep, setRegistrationStep] = useState<'form' | 'capture'>('form');
  const [isTakingPictures, setIsTakingPictures] = useState<boolean>(false);
  
  // Initialize face detection model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await initFaceDetector();
        setModelLoaded(true);
      } catch (error) {
        console.error('Failed to load the face detection model:', error);
        toast.error('Failed to load face detection. Please refresh and try again.');
      }
    };
    
    loadModel();
  }, []);

  const handleStartCapture = useCallback(() => {
    setRegistrationStep('capture');
  }, []);

  const handleFaceCapture = useCallback((faceImage: FaceImage) => {
    setCapturedFaces(prev => [...prev, faceImage]);
  }, []);

  const handleSubmitRegistration = useCallback(() => {
    if (capturedFaces.length < requiredFaceCount) {
      toast.error(`Need ${requiredFaceCount} face images for registration`);
      return;
    }

    try {
      // Save user with face images
      saveUser({
        username,
        faceImages: capturedFaces
      });
      
      toast.success('Registration successful!');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register. Please try again.');
    }
  }, [capturedFaces, username, requiredFaceCount, navigate]);

  const resetRegistration = useCallback(() => {
    setCapturedFaces([]);
    setRegistrationStep('form');
  }, []);

  const handleManualCapture = useCallback(async () => {
    if (isTakingPictures) return;

    setIsTakingPictures(true);
    setCapturedFaces([]); // Reset previously captured faces
    
    // Take 10 pictures with a small delay between each
    try {
      const webcamElement = document.querySelector('video');
      const canvasElement = document.querySelector('canvas');
      
      if (!webcamElement || !canvasElement) {
        toast.error("Camera not ready");
        setIsTakingPictures(false);
        return;
      }

      toast.info("Starting to take 10 pictures...");
      
      for (let i = 0; i < requiredFaceCount; i++) {
        if (i > 0) {
          // Add a small delay between captures
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const faceImage = await captureFace(
          webcamElement as HTMLVideoElement, 
          canvasElement as HTMLCanvasElement
        );
        
        if (faceImage) {
          handleFaceCapture(faceImage);
          toast.info(`Captured picture ${i + 1} of ${requiredFaceCount}`);
        } else {
          toast.error(`Failed to capture picture ${i + 1}. Please try again.`);
          i--; // Try again for this picture
        }
      }
      
      toast.success("All pictures captured successfully!");
    } catch (error) {
      console.error("Error during manual capture:", error);
      toast.error("Failed to capture images. Please try again.");
    } finally {
      setIsTakingPictures(false);
    }
  }, [isTakingPictures, requiredFaceCount, handleFaceCapture]);

  return {
    username,
    setUsername,
    capturedFaces,
    isCapturing,
    modelLoaded,
    usernameError,
    setUsernameError,
    registrationStep,
    isTakingPictures,
    setIsTakingPictures,
    requiredFaceCount,
    handleStartCapture,
    handleFaceCapture,
    handleSubmitRegistration,
    resetRegistration,
    handleManualCapture
  };
};
