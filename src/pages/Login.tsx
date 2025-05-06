
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
import { getUserByUsername, setCurrentUser } from '../services/authService';
import { initFaceDetector, compareWithRegisteredFaces } from '../services/faceDetectionService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [capturedFaces, setCapturedFaces] = useState<FaceImage[]>([]);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [usernameError, setUsernameError] = useState<string>('');
  const [loginStep, setLoginStep] = useState<'form' | 'verification'>('form');
  const [registeredFaces, setRegisteredFaces] = useState<FaceImage[]>([]);
  const [verificationProgress, setVerificationProgress] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Number of face images needed for verification
  const requiredFaceCount = 10;
  
  // Matching threshold (0.8 = 80%)
  const matchThreshold = 0.8;
  
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
    if (!existingUser) {
      setUsernameError('Username not found');
      return false;
    }
    
    // Load the user's registered face images
    setRegisteredFaces(existingUser.faceImages);
    setUsernameError('');
    return true;
  };

  const handleStartVerification = () => {
    if (validateUsername()) {
      setLoginStep('verification');
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

  const handleVerifyFaces = async () => {
    if (capturedFaces.length < requiredFaceCount) {
      toast.error(`Need ${requiredFaceCount} face images for verification`);
      return;
    }

    try {
      setIsVerifying(true);
      const verificationResults = [];
      
      for (let i = 0; i < capturedFaces.length; i++) {
        const similarity = await compareWithRegisteredFaces(
          capturedFaces[i],
          registeredFaces
        );
        
        verificationResults.push(similarity);
        setVerificationProgress(Math.round(((i + 1) / capturedFaces.length) * 100));
      }
      
      // Calculate average similarity score
      const averageSimilarity = verificationResults.reduce((sum, score) => sum + score, 0) / verificationResults.length;
      
      console.log(`Face verification complete, Average similarity: ${averageSimilarity.toFixed(2)}`);
      
      if (averageSimilarity >= matchThreshold) {
        toast.success('Face verification successful!');
        // Set current user and navigate to dashboard
        setCurrentUser(username);
        navigate('/dashboard');
      } else {
        toast.error('Face verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resetVerification = () => {
    setCapturedFaces([]);
    setLoginStep('form');
    setVerificationProgress(0);
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Face Authentication Login</CardTitle>
          <CardDescription>
            Sign in using your face
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
              {loginStep === 'form' ? (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium">
                      Username
                    </label>
                    <Input
                      id="username"
                      placeholder="Enter your username"
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
                      After entering your username, we'll verify your identity with facial recognition.
                      Please ensure you're in a well-lit area.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Face Verification</h3>
                    {capturedFaces.length > 0 && capturedFaces.length < requiredFaceCount && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={startCapturing}
                        disabled={isCapturing || isVerifying}
                      >
                        Continue Capturing
                      </Button>
                    )}
                  </div>
                  
                  {isVerifying ? (
                    <div className="flex flex-col items-center py-8">
                      <div className="w-full max-w-md mb-4">
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Verifying faces...</span>
                          <span>{verificationProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${verificationProgress}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-center text-sm text-muted-foreground">
                        Comparing captured faces to registered profile...
                      </p>
                    </div>
                  ) : (
                    <>
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
                          title="Verification Face Images" 
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {loginStep === 'form' ? (
            <>
              <Button
                variant="outline"
                onClick={() => navigate('/register')}
              >
                Register New User
              </Button>
              <Button
                onClick={handleStartVerification}
                disabled={!modelLoaded}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={resetVerification}
                disabled={isVerifying}
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyFaces}
                disabled={capturedFaces.length < requiredFaceCount || isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Verify My Face'}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
