'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  placeholder = "https://example.com/image.jpg",
  className = ""
}) => {
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
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
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(file);
      onChange(cloudinaryUrl);
      setPreviewUrl(cloudinaryUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file to Cloudinary');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    setPreviewUrl(url);
    setImageError(false);
  };

  const clearImage = () => {
    onChange('');
    setPreviewUrl(null);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getDisplayUrl = () => {
    return previewUrl || value;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Mode Toggle */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            uploadMode === 'url'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            uploadMode === 'file'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Upload File
        </button>
      </div>

      {/* URL Input Mode */}
      {uploadMode === 'url' && (
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={placeholder}
          />
        </div>
      )}

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
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {getDisplayUrl() && (
        <div className="relative">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            {!imageError ? (
              <Image
                src={getDisplayUrl()}
                alt="Preview"
                fill
                className="object-cover"
                onError={() => {
                  setImageError(true);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Image failed to load</p>
                  <p className="text-xs text-gray-400">Please check the URL or upload a new image</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {uploadMode === 'file' ? 'Image uploaded to Cloudinary' : 'Image URL'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

