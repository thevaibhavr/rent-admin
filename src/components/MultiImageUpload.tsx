'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  const [uploadMode] = useState<'url' | 'file'>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<{ [key: number]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (value.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    setIsUploading(true);
    try {
      const newImages: string[] = [];
      const newPreviewUrls: { [key: number]: string } = { ...previewUrls };

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
        
        const newIndex = value.length + newImages.length;
        newImages.push(cloudinaryUrl);
        newPreviewUrls[newIndex] = cloudinaryUrl;
      }

      if (newImages.length > 0) {
        const updatedImages = [...value, ...newImages];
        onChange(updatedImages);
        setPreviewUrls(newPreviewUrls);
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





  const clearImage = (index: number) => {
    const newImages = [...value];
    newImages[index] = '';
    onChange(newImages);
    
    const newPreviewUrls = { ...previewUrls };
    delete newPreviewUrls[index];
    setPreviewUrls(newPreviewUrls);
  };

  const getDisplayUrl = (index: number) => {
    return previewUrls[index] || value[index];
  };

  return (
    <div className={`space-y-3 ${className}`}>


      {/* File Upload Mode */}
      {uploadMode === 'file' && (
        <div className="space-y-2">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                ) : (
                  <PhotoIcon className="w-8 h-8 mb-2 text-gray-400" />
                )}
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB (Max {maxImages} images)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={isUploading || value.length >= maxImages}
              />
            </label>
          </div>
        </div>
      )}

      {/* Image Fields */}
      <div className="space-y-3">
        {value.map((image, index) => (
          <div key={index} className="space-y-2">
            {/* Image Preview */}
            {getDisplayUrl(index) && (
              <div className="relative">
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={getDisplayUrl(index)}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                    onError={() => {
                      // Handle error silently
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => clearImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Image uploaded to Cloudinary
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500">
        {value.length} of {maxImages} images used
      </p>
    </div>
  );
};

export default MultiImageUpload;

