import React, { useRef, useState } from 'react';
import { Camera, X, Check, Image as ImageIcon, RefreshCw } from 'lucide-react';

interface DeliveryPhotoModalProps {
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
  isSubmitting?: boolean;
}

export const DeliveryPhotoModal: React.FC<DeliveryPhotoModalProps> = ({
  orderNumber,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRetake = () => {
    setPhotoFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirm = () => {
    if (photoFile) {
      onSubmit(photoFile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-safe">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-black text-white">Delivery Proof Photo</h3>
            <p className="text-xs text-zinc-400">Order #{orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Camera File Input (triggers native camera on mobile / Capacitor) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Preview or Capture Button */}
        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-56 border-2 border-dashed border-zinc-700 hover:border-emerald-500/80 rounded-2xl flex flex-col items-center justify-center gap-3 bg-zinc-950/60 cursor-pointer active:scale-98 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Camera className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">Take Delivery Photo</p>
              <p className="text-xs text-zinc-500 mt-0.5">Capture food at customer's doorstep</p>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black h-56 flex items-center justify-center">
            <img src={previewUrl} alt="Delivery proof preview" className="w-full h-full object-cover" />
            <button
              onClick={handleRetake}
              disabled={isSubmitting}
              className="absolute bottom-3 right-3 bg-zinc-900/90 text-zinc-200 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retake
            </button>
          </div>
        )}

        {/* Bottom Actions */}
        <button
          onClick={handleConfirm}
          disabled={!photoFile || isSubmitting}
          className={`w-full h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 ${
            photoFile && !isSubmitting
              ? 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-emerald-500/20'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          <Check className="w-5 h-5" />
          <span>{isSubmitting ? 'UPLOADING & COMPLETING...' : 'CONFIRM & COMPLETE DELIVERY'}</span>
        </button>
      </div>
    </div>
  );
};

