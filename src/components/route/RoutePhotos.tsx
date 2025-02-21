import React, { useRef, useState } from 'react';
import { Plus, Camera, Image } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PhotoGallery } from './PhotoGallery';

type RoutePhoto = {
  id: string;
  photo_url: string;
  photo_blob: string | null;
  caption: string;
  order: number;
};

type RoutePhotosProps = {
  routeId: string;
  photos: RoutePhoto[];
  isOwner: boolean;
  onPhotosUpdated: (photos: RoutePhoto[]) => void;
};

const DEFAULT_PHOTO = 'https://source.unsplash.com/random/800x600?road,motorcycle';

export function RoutePhotos({ routeId, photos, isOwner, onPhotosUpdated }: RoutePhotosProps) {
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  async function handlePhotoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadingPhoto(true);
    setPhotoError(null);

    try {
      const maxOrder = photos?.reduce((max, photo) => 
        Math.max(max, photo.order), -1) ?? -1;
      const nextOrder = maxOrder + 1;

      let photoData: { photo_url?: string; photo_blob?: string } = {};

      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error('Photo must be less than 5MB');
        }

        if (!file.type.startsWith('image/')) {
          throw new Error('File must be an image');
        }

        const reader = new FileReader();
        const base64String = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        photoData.photo_blob = base64String;
      } else if (photoUrl) {
        try {
          new URL(photoUrl);
          photoData.photo_url = photoUrl;
        } catch {
          throw new Error('Invalid photo URL');
        }
      } else {
        throw new Error('Please provide either a photo file or URL');
      }

      const { data: newPhoto, error: uploadError } = await supabase
        .from('route_photos')
        .insert([{
          route_id: routeId,
          ...photoData,
          caption: photoCaption,
          order: nextOrder
        }])
        .select()
        .single();

      if (uploadError) throw uploadError;

      onPhotosUpdated([...photos, newPhoto]);
      setPhotoUrl('');
      setPhotoCaption('');
      setShowPhotoForm(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
        <Image className="h-5 w-5 mr-2" />
        {photos?.length || 0} Photos
      </h2>
      {isOwner && (
        <div className="mb-4">
          {!showPhotoForm ? (
            <button
              onClick={() => setShowPhotoForm(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Photo
            </button>
          ) : (
            <form onSubmit={handlePhotoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Photo
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-indigo-50 file:text-indigo-700
                    dark:file:bg-indigo-900 dark:file:text-indigo-200
                    hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Or Add Photo URL
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Caption (optional)
                </label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              {photoError && (
                <p className="text-sm text-red-600">{photoError}</p>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoForm(false);
                    setPhotoUrl('');
                    setPhotoCaption('');
                    setPhotoError(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingPhoto}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-hidden">
        {photos?.length ? (
          photos
            .sort((a, b) => a.order - b.order)
            .slice(0, 4)
            .map((photo, index) => (
              <div
                key={photo.id}
                className="relative cursor-pointer"
                onClick={() => {
                  setSelectedPhotoIndex(index);
                  setGalleryOpen(true);
                }}
              >
                <img
                  src={
                    photo.photo_url || 
                    (photo.photo_blob ? photo.photo_blob : DEFAULT_PHOTO)
                  }
                  alt={photo.caption || 'Route photo'}
                  className="rounded-lg w-full h-48 object-cover bg-gray-100 dark:bg-gray-700"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_PHOTO;
                  }}
                />
                {photo.caption && (
                  <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-sm p-2 rounded-b-lg">
                    {photo.caption}
                  </p>
                )}
              </div>
            )).concat(
              photos.length > 4 ? [(
                <div
                  key="more-photos"
                  className="relative cursor-pointer bg-black bg-opacity-75 flex items-center justify-center h-48 rounded-lg"
                  onClick={() => {
                    setSelectedPhotoIndex(4);
                    setGalleryOpen(true);
                  }}
                >
                  <span className="text-white text-xl font-semibold">
                    +{photos.length - 4} more
                  </span>
                </div>
              )] : []
            )
        ) : (
          <img
            src={DEFAULT_PHOTO}
            alt="Generic road photo"
            className="rounded-lg col-span-2 w-full h-48 object-cover"
          />
        )}
      </div>
      <PhotoGallery
        photos={photos || []}
        isOpen={galleryOpen}
        initialPhotoIndex={selectedPhotoIndex}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  );
}