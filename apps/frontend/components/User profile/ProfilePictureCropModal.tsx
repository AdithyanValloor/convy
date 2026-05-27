"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import Portal from "../Portal";

export default function ImageCropModal({
  image,
  onClose,
  onCropDone,
}: {
  image: string;
  onClose: () => void;
  onCropDone: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const createCroppedImage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!croppedAreaPixels) return;

    setLoading(true);
    const imageEl = new Image();
    imageEl.src = image;
    await new Promise((resolve) => (imageEl.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    ctx.drawImage(
      imageEl,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    canvas.toBlob((blob) => {
      if (blob) onCropDone(blob);
      setLoading(false);
    }, "image/jpeg");
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] px-4 flex text-base-content items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative z-10 bg-base-200 rounded-2xl max-w-sm w-full p-6 border border-base-content/10 shadow-xl">
          <h3 className="font-bold text-lg">Crop Image</h3>

          <div className="relative w-full h-64 mt-4 rounded-xl overflow-hidden">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full p-2 cursor-pointer rounded-xl bg-base-300 hover:bg-base-300/50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createCroppedImage}
              disabled={loading}
              className="w-full p-2 cursor-pointer rounded-xl bg-green-700 text-white hover:bg-green-900 disabled:opacity-60 transition"
            >
              {loading
                ? <span className="loading loading-dots loading-lg" />
                : "Crop & Upload"
              }
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}