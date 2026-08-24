"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FileText, ZoomIn } from "lucide-react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { getDownloadUrl } from "@/redux/features/messageSlice";
import ImageModal from "./ImageModal";

interface FilePreviewCardProps {
  file: {
    key: string;
    mimeType: string;
    size: number;
  };
}

export default function FilePreviewCard({ file }: FilePreviewCardProps) {
  const dispatch = useAppDispatch();

  const url = useAppSelector(
    (state) => state.messages.downloadUrls?.[file.key],
  );

  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!url && !loading) {
      setLoading(true);
      dispatch(getDownloadUrl(file.key)).finally(() => setLoading(false));
    }
  }, [url, file.key, loading, dispatch]);

  useEffect(() => {
  console.log("🟢 FilePreviewCard MOUNTED", file.key);

  return () => {
    console.log("🔴 FilePreviewCard UNMOUNTED", file.key);
  };
}, []);

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl overflow-hidden"
      >
        {isImage && (
          <div
            className="relative w-[360px] h-[300px] rounded-xl overflow-hidden cursor-pointer group"
            onClick={() => {
              if (url) setModalOpen(true);
            }}
          >
            {(!url || !imageLoaded) && (
              <div className="absolute inset-0 flex items-center justify-center bg-base-content/20">
                <span className="loading loading-spinner loading-xl text-base-content" />
              </div>
            )}

            {url && (
              <Image
                src={url}
                alt="uploaded"
                width={360}
                height={300}
                unoptimized
                className={`w-full h-full object-cover rounded-xl transition-opacity duration-200 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  if (retryCount < 2) {
                    setRetryCount((prev) => prev + 1);
                    dispatch(getDownloadUrl(file.key));
                  }
                }}
              />
            )}

            {url && imageLoaded && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center">
                <ZoomIn
                  size={28}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg"
                />
              </div>
            )}
          </div>
        )}
        {isPdf && (
          <a
            href={url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 px-5 bg-base-content/5 rounded-xl hover:bg-base-content/10 transition"
          >
            {!url ? (
              <span className="loading loading-spinner loading-md" />
            ) : (
              <>
                <FileText size={18} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">PDF File</span>
                  <span className="text-xs opacity-60">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              </>
            )}
          </a>
        )}
      </motion.div>

      {modalOpen && url && (
        <ImageModal src={url} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
