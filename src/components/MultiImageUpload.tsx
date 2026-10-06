'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Bars3Icon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface MultiImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  maxImages?: number;
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  value,
  onChange,
  className = "",
  maxImages = 10
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const images = value.filter((image) => image.trim().length > 0);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'cloths');
    formData.append('cloud_name', 'djrdmqjir');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/djrdmqjir/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed maxImages
    if (images.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select only image files');
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Must be less than 5MB`);
          continue;
        }

        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(file);
        
        newImages.push(cloudinaryUrl);
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files to Cloudinary');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };





  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length || fromIndex === toIndex) return;

    const reorderedImages = [...images];
    const [movedImage] = reorderedImages.splice(fromIndex, 1);
    reorderedImages.splice(toIndex, 0, movedImage);
    onChange(reorderedImages);
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex !== null) {
      moveImage(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className={`flex min-h-28 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center transition-colors ${images.length >= maxImages || isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50'}`}>
        {isUploading ? (
          <div className="mb-2 h-7 w-7 animate-spin rounded-full border-b-2 border-indigo-600" />
        ) : (
          <PhotoIcon className="mb-2 h-7 w-7 text-gray-400" />
        )}
        <span className="text-sm font-medium text-gray-700">
          {isUploading ? 'Uploading images...' : 'Click to upload product images'}
        </span>
        <span className="mt-1 text-xs text-gray-500">
          Select multiple files · PNG/JPG/GIF up to 5MB · Max {maxImages} images
        </span>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={isUploading || images.length >= maxImages}
        />
      </label>

      {images.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-gray-500">
            Drag images to set their display order. The first image is the product cover.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image, index) => (
              <div
                key={`${image}-${index}`}
                draggable={!isUploading}
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(index);
                }}
                onDragEnd={() => setDraggedIndex(null)}
                className={`group relative aspect-square overflow-hidden rounded-lg border bg-gray-100 ${
                  draggedIndex === index ? 'border-indigo-500 opacity-50' : 'border-gray-200'
                } ${isUploading ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}`}
              >
                <Image
                  src={image}
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 160px"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-2 text-white">
                  <span className="flex items-center gap-1 text-xs font-semibold">
                    <Bars3Icon className="h-4 w-4" />
                    {index === 0 ? 'Cover' : `Image ${index + 1}`}
                  </span>
                  <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs">{index + 1}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Move image ${index + 1} earlier`}
                      onClick={() => moveImage(index, index - 1)}
                      disabled={index === 0 || isUploading}
                      className="rounded bg-white/90 p-1 text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move image ${index + 1} later`}
                      onClick={() => moveImage(index, index + 1)}
                      disabled={index === images.length - 1 || isUploading}
                      className="rounded bg-white/90 p-1 text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove image ${index + 1}`}
                    onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}
                    disabled={isUploading}
                    className="rounded bg-red-600 p-1 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">{images.length} of {maxImages} images used</p>
    </div>
  );
};

export default MultiImageUpload;
