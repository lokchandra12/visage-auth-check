
import React from 'react';
import { FaceImage } from '../models/faceTypes';

interface FaceImageGridProps {
  images: FaceImage[];
  title: string;
}

const FaceImageGrid: React.FC<FaceImageGridProps> = ({ images, title }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-lg font-medium mb-2">{title} ({images.length})</h3>
      <div className="grid grid-cols-5 gap-2">
        {images.map((image, index) => (
          <div 
            key={index} 
            className="relative aspect-square border rounded overflow-hidden bg-muted flex items-center justify-center"
          >
            {image.data ? (
              <img 
                src={image.data} 
                alt={`Face ${index + 1}`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-xs text-gray-400">Empty</div>
            )}
          </div>
        ))}
        
        {/* Add empty placeholders if less than 10 images */}
        {Array.from({ length: Math.max(0, 10 - images.length) }).map((_, index) => (
          <div 
            key={`placeholder-${index}`} 
            className="aspect-square border border-dashed rounded bg-gray-50 flex items-center justify-center"
          >
            <div className="text-xs text-gray-400">Empty</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaceImageGrid;
