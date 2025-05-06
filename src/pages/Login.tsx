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
  
  // Increased matching threshold (0.92 = 92%) for more strict verification
  const matchThreshold = 0.92;

  // Add a flag for suspicious verification attempts
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const maxFailedAttempts = 3;
  
  // Add a new state for tracking if face detection is in progress
  const [isFaceDetectionActive, setIsFaceDetectionActive] = useState<boolean>(false);

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
    
    // Reset failed attempts when username changes
    setFailedAttempts(0);
    
    // Load the user's registered face images
    setRegisteredFaces(existingUser.faceImages);
    setUsernameError('');
    return true;
  };

  const handleStartVerification = () => {
    if (validateUsername()) {
      setLoginStep('verification');
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

    // Check if too many failed attempts
    if (failedAttempts >= maxFailedAttempts) {
      toast.error('Too many failed verification attempts. Please try again later.');
      resetVerification();
      return;
    }

    try {
      setIsVerifying(true);
      const verificationResults = [];
      const minimumSimilarities = []; // Track the highest similarity score for each captured face
      
      // For each captured face, find its best match among registered faces
      for (let i = 0; i < capturedFaces.length; i++) {
        // Compare current captured face with all registered faces
        const similarities = await Promise.all(
          registeredFaces.map(async (registeredFace) => {
            return await compareFaces(capturedFaces[i], registeredFace);
          })
        );
        
        // Find the best match for this captured face
        const bestMatchSimilarity = Math.max(...similarities);
        verificationResults.push(bestMatchSimilarity);
        minimumSimilarities.push(bestMatchSimilarity);
        
        setVerificationProgress(Math.round(((i + 1) / capturedFaces.length) * 100));
      }
      
      // Calculate average similarity score
      const averageSimilarity = verificationResults.reduce((sum, score) => sum + score, 0) / verificationResults.length;
      
      // Find the lowest similarity score (the weakest match)
      const lowestSimilarity = Math.min(...minimumSimilarities);
      
      console.log(`Face verification complete:
        - Average similarity: ${averageSimilarity.toFixed(2)}
        - Lowest similarity: ${lowestSimilarity.toFixed(2)}
        - Threshold: ${matchThreshold}`);
      
      // More strict verification: Both average AND lowest similarity must meet thresholds
      if (averageSimilarity >= matchThreshold && lowestSimilarity >= 0.85) {
        toast.success('Face verification successful!');
        // Set current user and navigate to dashboard
        setCurrentUser(username);
        navigate('/dashboard');
      } else {
        setFailedAttempts(prev => prev + 1);
        const remainingAttempts = maxFailedAttempts - failedAttempts - 1;
        
        if (remainingAttempts > 0) {
          toast.error(`Face verification failed. ${remainingAttempts} attempts remaining.`);
        } else {
          toast.error('Face verification failed. This is your last attempt.');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Helper function to compare two face images
  const compareFaces = async (face1: FaceImage, face2: FaceImage) => {
    try {
      // Use the existing compareWithRegisteredFaces function but with individual faces
      return await compareWithRegisteredFaces(face1, [face2]);
    } catch (error) {
      console.error('Error comparing faces:', error);
      return 0; // Return 0 similarity on error
    }
  };

  const resetVerification = () => {
    setCapturedFaces([]);
    setLoginStep('form');
    setVerificationProgress(0);
  };

  const handleManualFaceDetection = useCallback(async () => {
    if (!modelLoaded || isVerifying) return;
    
    // Validate username
    if (!validateUsername()) {
      toast.error("Please enter a valid username first");
      return;
    }

    try {
      setIsVerifying(true);
      setCapturedFaces([]);
      
      const webcamElement = document.querySelector('video');
      const canvasElement = document.querySelector('canvas');
      
      if (!webcamElement || !canvasElement) {
        toast.error("Camera not ready");
        setIsVerifying(false);
        return;
      }

      toast.info("Starting to capture 10 face images...");
      setIsFaceDetectionActive(true);
      
      // Take 10 pictures automatically with improved quality checks
      for (let i = 0; i < requiredFaceCount; i++) {
        if (i > 0) {
          // Add a small delay between captures
          await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay for better captures
        }
        
        const faceImage = await captureImage(webcamElement, canvasElement);
        
        // Check if face was properly detected
        if (faceImage && faceImage.faceDescriptor && faceImage.faceDescriptor.length > 0) {
          setCapturedFaces(prev => [...prev, faceImage]);
          setVerificationProgress(Math.round(((i + 1) / requiredFaceCount) * 100));
          toast.info(`Captured image ${i + 1} of ${requiredFaceCount}`);
        } else {
          toast.error(`No face detected. Please face the camera.`);
          i--; // Retry this image
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait longer before retry
        }
      }
      
      toast.success("All face images captured!");
      
      // Verify the faces against registered faces using the same improved algorithm
      // as in handleVerifyFaces
      const verificationResults = [];
      const minimumSimilarities = [];
      
      for (let i = 0; i < capturedFaces.length; i++) {
        const similarities = await Promise.all(
          registeredFaces.map(async (registeredFace) => {
            return await compareFaces(capturedFaces[i], registeredFace);
          })
        );
        
        const bestMatchSimilarity = Math.max(...similarities);
        verificationResults.push(bestMatchSimilarity);
        minimumSimilarities.push(bestMatchSimilarity);
        
        setVerificationProgress(Math.round(((i + 1) / capturedFaces.length) * 100));
      }
      
      // Calculate average similarity score
      const averageSimilarity = verificationResults.reduce((sum, score) => sum + score, 0) / verificationResults.length;
      
      // Find the lowest similarity score
      const lowestSimilarity = Math.min(...minimumSimilarities);
      
      console.log(`Face verification complete:
        - Average similarity: ${averageSimilarity.toFixed(2)}
        - Lowest similarity: ${lowestSimilarity.toFixed(2)}
        - Threshold: ${matchThreshold}`);
      
      if (averageSimilarity >= matchThreshold && lowestSimilarity >= 0.85) {
        toast.success('Face verification successful!');
        // Set current user and navigate to dashboard
        setCurrentUser(username);
        navigate('/dashboard');
      } else {
        setFailedAttempts(prev => prev + 1);
        const remainingAttempts = maxFailedAttempts - failedAttempts - 1;
        
        if (remainingAttempts > 0) {
          toast.error(`Face verification failed. ${remainingAttempts} attempts remaining.`);
        } else {
          toast.error('Face verification failed. This is your last attempt.');
        }
      }
      
    } catch (error) {
      console.error('Face detection error:', error);
      toast.error('Failed to detect face. Please try again.');
    } finally {
      setIsVerifying(false);
      setIsFaceDetectionActive(false);
    }
  }, [username, modelLoaded, registeredFaces, isVerifying, requiredFaceCount, capturedFaces, navigate, matchThreshold, validateUsername, failedAttempts]);

  // Helper function to capture an image
  const captureImage = async (videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) => {
    const { captureFace } = await import('../services/faceDetectionService');
    return captureFace(videoElement, canvasElement);
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
                      Please ensure you're in a well-lit area with your face clearly visible.
                    </p>
                  </div>
                  
                  {/* New Detect Face button */}
                  <Button 
                    onClick={handleManualFaceDetection}
                    disabled={!modelLoaded || !username.trim() || failedAttempts >= maxFailedAttempts}
                    className="w-full"
                    variant="secondary"
                  >
                    Detect Face
                  </Button>
                  
                  {failedAttempts >= maxFailedAttempts && (
                    <p className="text-sm text-red-500 text-center">
                      Too many failed attempts. Please try again later or contact support.
                    </p>
                  )}
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
                        isCaptureEnabled={isCapturing || isFaceDetectionActive}
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
                disabled={!modelLoaded || failedAttempts >= maxFailedAttempts}
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
                disabled={capturedFaces.length < requiredFaceCount || isVerifying || failedAttempts >= maxFailedAttempts}
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
