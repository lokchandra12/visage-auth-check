
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import WebcamCapture from '../WebcamCapture';
import FaceImageGrid from '../FaceImageGrid';
import ProgressBar from '../ProgressBar';
import { FaceImage } from '../../models/faceTypes';

interface FaceCaptureSectionProps {
  capturedFaces: FaceImage[];
  onFaceCapture: (faceImage: FaceImage) => void;
  onReset: () => void;
  onSubmit: () => void;
  requiredFaceCount: number;
  isTakingPictures: boolean;
  setIsTakingPictures: (value: boolean) => void;
  handleManualCapture: () => Promise<void>;
}

const FaceCaptureSection: React.FC<FaceCaptureSectionProps> = ({
  capturedFaces,
  onFaceCapture,
  onReset,
  onSubmit,
  requiredFaceCount,
  isTakingPictures,
  setIsTakingPictures,
  handleManualCapture
}) => {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Face Authentication Registration</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Face Capture</h3>
          </div>
          
          <WebcamCapture
            onCapture={onFaceCapture}
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
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onReset}
        >
          Reset
        </Button>
        <Button
          onClick={onSubmit}
          disabled={capturedFaces.length < requiredFaceCount || isTakingPictures}
        >
          Complete Registration
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FaceCaptureSection;
