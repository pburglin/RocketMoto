import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Photo = {
  id: string;
  photo_url: string;
  photo_blob: string | null;
  caption: string;
};

type PhotoGalleryProps = {
  photos: Photo[];
  isOpen: boolean;
  initialPhotoIndex: number;
  onClose: () => void;
};

export function PhotoGallery({ photos, isOpen, initialPhotoIndex, onClose }: PhotoGalleryProps) {
  if (!isOpen) return null;

  const [currentIndex, setCurrentIndex] = useState(initialPhotoIndex);
  const currentPhoto = photos[currentIndex];
  const photoUrl = currentPhoto.photo_url || currentPhoto.photo_blob;

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  }, [handlePrevious, handleNext, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300"
      >
        <X className="h-8 w-8" />
      </button>

      <button
        onClick={handlePrevious}
        className="absolute left-4 text-white hover:text-gray-300"
      >
        <ChevronLeft className="h-12 w-12" />
      </button>

      <div className="relative max-w-7xl mx-auto px-4">
        <img
          src={photoUrl}
          alt={currentPhoto.caption || 'Route photo'}
          className="max-h-[90vh] max-w-full object-contain"
        />
        {currentPhoto.caption && (
          <p className="absolute bottom-4 left-0 right-0 text-center text-white text-lg">
            {currentPhoto.caption}
          </p>
        )}
        <p className="absolute top-4 left-0 right-0 text-center text-white text-lg">
          {currentIndex + 1} of {photos.length}
        </p>
      </div>

      <button
        onClick={handleNext}
        className="absolute right-4 text-white hover:text-gray-300"
      >
        <ChevronRight className="h-12 w-12" />
      </button>
    </div>
  );
}