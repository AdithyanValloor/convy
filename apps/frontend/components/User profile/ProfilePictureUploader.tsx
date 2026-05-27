"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { updateProfilePicture } from "@/redux/features/profileSlice";
import { uploadProfilePictureToS3 } from "@/utils/uploadToS3";
import defaultPFP from "@/public/default-pfp.png";
import Image from "next/image";
import { Edit, Upload, Trash2 } from "lucide-react";
import ImageCropModal from "./ProfilePictureCropModal";

export default function ProfilePictureUploader({
  currentUrl,
}: {
  currentUrl?: string | null;
}) {
  const dispatch = useAppDispatch();
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setCropImage(previewUrl);
  };

  const handleCropDone = async (blob: Blob) => {
    try {
      setUploading(true);

      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

      const key = await uploadProfilePictureToS3(file);
      await dispatch(updateProfilePicture(key)).unwrap();

      setCropImage(null);
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
    setOpen(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Remove profile picture");
    setOpen(false);
  };

  return (
    <>
      <div
        ref={containerRef}
        className="flex flex-col items-center gap-3 relative"
      >
        {/* Avatar */}
        <div
          className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
        >
          <Image
            src={currentUrl || defaultPFP}
            alt="Profile"
            fill
            className="object-cover"
            unoptimized
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
            <Edit size={20} className="text-white" />
          </div>
          {uploading && (
            <span className="flex items-center justify-center h-full">
              <span className="loading loading-spinner loading-lg text-base-content" />
            </span>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 w-35 text-sm bg-base-100 shadow-lg rounded-xl border border-base-content/10 p-1 z-50"
          >
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-2 w-full cursor-pointer px-3 py-2 rounded-lg hover:bg-base-200 transition"
            >
              <Upload size={16} />
              Upload
            </button>

            <button
              onClick={handleRemove}
              className="flex items-center gap-2 w-full cursor-pointer px-3 py-2 rounded-lg hover:bg-red-100 text-red-500 transition"
            >
              <Trash2 size={16} />
              Remove
            </button>
          </div>
        )}

        {/* Hidden input */}
        <input
          title="Upload profile pictures"
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileChange(e.target.files[0]);
            }
          }}
        />

      </div>
      {cropImage && (
        <ImageCropModal
          image={cropImage}
          onClose={() => setCropImage(null)}
          onCropDone={handleCropDone}
        />
      )}
    </>
  );
}
