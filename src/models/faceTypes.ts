
export interface FaceDetection {
  box: {
    xMin: number;
    yMin: number;
    width: number;
    height: number;
  };
  landmarks?: Array<[number, number]>;
  confidence: number;
}

export interface FaceImage {
  data: string; // Base64 image data
  detection?: FaceDetection;
  timestamp: number;
}

export interface UserAuth {
  username: string;
  faceImages: FaceImage[];
}
