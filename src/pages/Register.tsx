
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import WebcamCapture from '../components/WebcamCapture';
import FaceImageGrid from '../components/FaceImageGrid';
import ProgressBar from '../components/ProgressBar';
import { FaceImage } from '../models/faceTypes';
import { saveUser, getUserByUsername } from '../services/authService';
import { initFaceDetector, captureFace } from '../services/faceDetectionService';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [capturedFaces, setCapturedFaces] = useState<FaceImage[]>([]);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [usernameError, setUsernameError] = useState<string>('');
  const [registrationStep, setRegistrationStep] = useState<'form' | 'capture'>('form');
  const [isTakingPictures, setIsTakingPictures] = useState<boolean>(false);

  // Number of face images needed for registration
  const requiredFaceCount = 10;
  
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

  const validateUsername = () => {
    if (!username.trim()) {
      setUsernameError('Username is required');
      return false;
    }
    
    const existingUser = getUserByUsername(username);
    if (existingUser) {
      setUsernameError('Username already exists');
      return false;
    }
    
    setUsernameError('');
    return true;
  };

  const handleStartCapture = () => {
    if (validateUsername()) {
      setRegistrationStep('capture');
    }
  };

  const handleFaceCapture = useCallback((faceImage: FaceImage) => {
    setCapturedFaces(prev => [...prev, faceImage]);
  }, []);

  const handleSubmitRegistration = () => {
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
  };

  const resetRegistration = () => {
    setCapturedFaces([]);
    setRegistrationStep('form');
  };

  const handleManualCapture = async () => {
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
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Face Authentication Registration</CardTitle>
          <CardDescription>
            Create an account secured by your face
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!modelLoaded ? (
            <div className="flex flex-col items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Loading face detection model...
              </p>
            </div>
          ) : (
            <>
              {registrationStep === 'form' ? (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium">
                      Username
                    </label>
                    <Input
                      id="username"
                      placeholder="Enter a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={usernameError ? "border-red-500" : ""}
                    />
                    {usernameError && (
                      <p className="text-sm text-red-500">{usernameError}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      We'll capture 10 images of your face for secure authentication.
                      Please ensure you're in a well-lit area and position your face
                      clearly in the camera frame.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Face Capture</h3>
                  </div>
                  
                  <WebcamCapture
                    onCapture={handleFaceCapture}
                    isCaptureEnabled={isCapturing}
                    capturingText="Capturing your face..."
                    onManualCapture={handleManualCapture}
                  />
                  
                  <ProgressBar
                    current={capturedFaces.length}
                    total={requiredFaceCount}
                    label="Face Images Captured"
                  />
                  
                  {capturedFaces.length > 0 && (
                    <FaceImageGrid 
                      images={capturedFaces} 
                      title="Captured Face Images" 
                    />
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {registrationStep === 'form' ? (
            <>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
              <Button
                onClick={handleStartCapture}
                disabled={!modelLoaded}
              >
                Start Face Capture
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={resetRegistration}
              >
                Reset
              </Button>
              <Button
                onClick={handleSubmitRegistration}
                disabled={capturedFaces.length < requiredFaceCount || isTakingPictures}
              >
                Complete Registration
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
