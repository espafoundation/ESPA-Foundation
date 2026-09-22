import React, { useState, useRef, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { Camera, Upload, Trash2, ZoomIn, ZoomOut, Check, X, RotateCw, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import 'react-easy-crop/react-easy-crop.css';

interface PhotoCropUploadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  id?: string;
}

/**
 * Helper to crop image on client-side canvas to 1:1 square
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // Safe square crop bounding size (max 600px for avatar to ensure high quality & fast payload)
  const maxSize = 600;
  const targetWidth = Math.min(pixelCrop.width, maxSize);
  const targetHeight = Math.min(pixelCrop.height, maxSize);

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // If rotation is used
  if (rotation !== 0) {
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-targetWidth / 2, -targetHeight / 2);
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return canvas.toDataURL('image/jpeg', 0.92);
}

export default function PhotoCropUpload({
  value,
  onChange,
  label = 'Profile Photo',
  required = false,
  error,
  id = 'photo-upload'
}: PhotoCropUploadProps) {
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileUrl(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setIsModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input value to allow selecting same file again if desired
    e.target.value = '';
  };

  const handleSaveCrop = async () => {
    if (!selectedFileUrl || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedDataUrl = await getCroppedImg(selectedFileUrl, croppedAreaPixels, rotation);
      onChange(croppedDataUrl);
      setIsModalOpen(false);
      setSelectedFileUrl(null);
      toast.success('Photo cropped and uploaded successfully!');
    } catch (err) {
      console.error('Error cropping image:', err);
      toast.error('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelCrop = () => {
    setIsModalOpen(false);
    setSelectedFileUrl(null);
  };

  const handleRemovePhoto = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Photo removed.');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        /* Preview Card when photo is present */
        <div className="p-5 bg-stone-50/90 border-2 border-stone-200 rounded-2xl min-h-[116px] flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left transition-all">
          <div className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-xs">
            <img
              src={value}
              alt="Profile preview"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#003828]/20"
            />
          </div>

          <div className="flex-1 space-y-1 text-center sm:text-left">
            <div className="text-sm font-bold text-stone-800">
              Profile Photo
            </div>
            <p className="text-xs text-stone-500">
              Photo uploaded successfully.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-white text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 hover:bg-stone-50 hover:border-stone-400 transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} />
              Change
            </button>
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="px-3.5 py-2 bg-white text-rose-600 text-xs font-semibold rounded-xl border border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={14} />
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* Upload Area when no photo uploaded yet */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const dt = new DataTransfer();
              dt.items.add(file);
              if (fileInputRef.current) {
                fileInputRef.current.files = dt.files;
                handleFileSelect({ target: { files: dt.files } } as any);
              }
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-5 min-h-[116px] transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left ${
            error
              ? 'border-red-400 bg-red-50/20 hover:border-red-500'
              : 'border-stone-200 bg-stone-50/60 hover:bg-white hover:border-[#003828]/40 hover:shadow-xs'
          }`}
        >
          <div className="w-20 h-20 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-stone-400 shrink-0 shadow-2xs group-hover:text-[#003828]">
            <ImageIcon size={30} />
          </div>
          <div className="space-y-1 flex-1 text-center sm:text-left">
            <div className="text-sm font-bold text-stone-800">
              Upload Profile Photo
            </div>
            <p className="text-xs text-stone-500">
              Drag and drop your picture, or click browse to choose.
            </p>
            <p className="text-[11px] text-stone-400">
              Supports JPG, PNG, WebP (Max 10MB)
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 bg-white text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 hover:bg-stone-50 hover:border-stone-400 transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} />
              Browse File
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
          {error}
        </p>
      )}

      {/* 1:1 Fixed Aspect Ratio Cropping Modal */}
      {isModalOpen && selectedFileUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">
                Crop Photo
              </h3>
              <button
                type="button"
                onClick={handleCancelCrop}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cropper Container */}
            <div className="relative w-full h-72 sm:h-80 bg-stone-900 overflow-hidden select-none">
              <Cropper
                image={selectedFileUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Controls */}
            <div className="p-5 bg-stone-50 space-y-4 border-t border-stone-100">
              {/* Zoom slider */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                  className="text-stone-500 hover:text-stone-800 p-1 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[#003828] cursor-pointer"
                  aria-label="Zoom Level"
                />
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                  className="text-stone-500 hover:text-stone-800 p-1 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>

                {/* Rotate button */}
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-2 text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-100 transition-colors shadow-2xs ml-2"
                  title="Rotate 90°"
                >
                  <RotateCw size={15} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrop}
                  disabled={isProcessing}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#003828] hover:bg-[#00281c] border border-[#003828] rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Check size={14} strokeWidth={2.5} />
                  {isProcessing ? 'Processing...' : 'Crop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
