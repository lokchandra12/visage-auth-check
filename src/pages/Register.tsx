
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from '../components/ui/sonner';
import WebcamCapture from '../components/WebcamCapture';
import FaceImageGrid from '../components/FaceImageGrid';
import ProgressBar from '../components/ProgressBar';
import { FaceImage } from '../models/faceTypes';
import { saveUser, getUserByUsername } from '../services/authService';
import { initFaceDetector } from '../services/faceDetectionService';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [capturedFaces, setCapturedFaces] = useState<FaceImage[]>([]);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [usernameError, setUsernameError] = useState<string>('');
  const [registrationStep, setRegistrationStep] = useState<'form' | 'capture'>('form');

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
      startCapturing();
    }
  };

  const startCapturing = useCallback(() => {
    setCapturedFaces([]);
    setIsCapturing(true);
  }, []);

  const stopCapturing = useCallback(() => {
    setIsCapturing(false);
  }, []);

  const handleFaceCapture = useCallback((faceImage: FaceImage) => {
    setCapturedFaces(prev => {
      const newFaces = [...prev, faceImage];
      
      // Stop capturing when we have enough faces
      if (newFaces.length >= requiredFaceCount) {
        setIsCapturing(false);
      }
      
      return newFaces;
    });
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
                    {capturedFaces.length > 0 && capturedFaces.length < requiredFaceCount && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={startCapturing}
                        disabled={isCapturing}
                      >
                        Continue Capturing
                      </Button>
                    )}
                  </div>
                  
                  <WebcamCapture
                    onCapture={handleFaceCapture}
                    isCaptureEnabled={isCapturing}
                    capturingText={`Capturing image ${capturedFaces.length + 1} of ${requiredFaceCount}...`}
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
                disabled={capturedFaces.length < requiredFaceCount}
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
