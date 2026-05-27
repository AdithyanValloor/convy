"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, Trash2 } from "lucide-react";
import { MdAddPhotoAlternate } from "react-icons/md";
import { uploadGroupAvatarToS3 } from "@/utils/uploadToS3";
import ImageCropModal from "../User profile/ProfilePictureCropModal";
import { updateAvatar, updateGroupAvatarLocal } from "@/redux/features/chatSlice";
import { useAppDispatch } from "@/redux/hooks";

interface GroupAvatarUploaderProps {
  value?: string | null;
  onChange?: (key: string | null) => void;
  canEdit?: boolean;
  temp?: boolean;
  groupId?: string;
}

export default function GroupAvatarUploader({
  value,
  onChange,
  canEdit,
  temp = true,
  groupId,
}: GroupAvatarUploaderProps) {
  const [open, setOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  const handleFileChange = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setCropImage(previewUrl);
    setOpen(false);
  };

const handleCropDone = async (blob: Blob) => {
  try {
    setUploading(true);

    const file = new File([blob], "group.jpg", {
      type: "image/jpeg",
    });

    const key = await uploadGroupAvatarToS3(file, {
      temp,
      groupId,
    });

    if (temp) {
      onChange?.(key);
      setCropImage(null);
      return;
    }

    dispatch(updateGroupAvatarLocal({ chatId: groupId!, key }));

    onChange?.(key);

    dispatch(updateAvatar({ chatId: groupId!, key }));

    setCropImage(null);
  } catch (err) {
    console.error(err);
  } finally {
    setUploading(false);
  }
};

  const handleRemove = () => {
    onChange?. (null);
    setOpen(false);
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

  return (
    <>
      <div ref={containerRef} className="flex justify-center relative">
        {/* Avatar */}
        <div
          className={`relative w-25 h-25 rounded-full overflow-hidden bg-base-300 flex items-center justify-center group
          ${canEdit ? "cursor-pointer" : "cursor-default opacity-80"}`}
          onClick={() => {
            if (!canEdit) return;
            setOpen((prev) => !prev);
          }}
        >
          {value ? (
            <Image
              src={preview || value || ""}
              alt="Group Avatar"
              fill
              className="object-cover"
              unoptimized
            />
          ) : canEdit ? (
            <div className="flex flex-col items-center justify-center text-base-content/60">
              <MdAddPhotoAlternate size={24} />
              <p className="text-[12px] leading-tight text-center">
                Add group icon
              </p>
            </div>
          ) : (
            <Image
              src={"/default-group-icon.png"}
              alt="Group Avatar"
              fill
              className="object-cover"
              unoptimized
            />
          )}

          {/* Hover overlay */}
          {canEdit && (
            <div className="absolute inset-0 bg-black/40 opacity-0 cursor-pointer group-hover:opacity-100 flex items-center justify-center transition">
              <Upload size={20} className="text-white" />
            </div>
          )}

          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="loading loading-spinner loading-lg" />
            </span>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full mt-2 w-36 bg-base-100 shadow-lg rounded-xl border border-base-content/10 p-1 z-50 text-sm"
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 w-full px-3 py-2 cursor-pointer rounded-lg hover:bg-base-200"
            >
              <Upload size={16} />
              Upload
            </button>

            {value && (
              <button
                onClick={handleRemove}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg cursor-pointer hover:bg-red-100 text-red-500"
              >
                <Trash2 size={16} />
                Remove
              </button>
            )}
          </div>
        )}

        {/* Hidden input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg"
          className="hidden"
          aria-label="Upload profile picture"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileChange(e.target.files[0]);
            }
          }}
        />
      </div>

      {/* Crop Modal */}
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
