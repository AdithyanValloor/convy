"use client";

import Image from "next/image";
import { useState } from "react";
import { MessageType } from "@/redux/features/messageSlice";
import { Play } from "lucide-react";
import { motion } from "framer-motion";

type LinkPreview = NonNullable<MessageType["linkPreview"]>;

interface LinkPreviewCardProps {
  preview: LinkPreview;
}

export default function LinkPreviewCard({ preview }: LinkPreviewCardProps) {
  const [loaded, setLoaded] = useState(false);
  if (!preview?.url) return null;

  const isLarge = preview.isLargeImage;

  const isYouTube =
    preview.url.includes("youtube.com") || preview.url.includes("youtu.be");

  const domain = new URL(preview.url).hostname.replace("www.", "");

  const isSpotify =
    preview.url.includes("open.spotify.com/track") ||
    preview.url.includes("spotify.com/track");

  let spotifyEmbedUrl: string | null = null;

  if (isSpotify) {
    try {
      const url = new URL(preview.url);
      const parts = url.pathname.split("/");
      const trackIndex = parts.indexOf("track");
      const trackId = parts[trackIndex + 1];

      spotifyEmbedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    } catch {
      spotifyEmbedUrl = null;
    }
  }

  if (isSpotify && spotifyEmbedUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-1 overflow-hidden rounded-2xl"
      >
        <iframe
          src={`${spotifyEmbedUrl}?utm_source=generator`}
          width="100%"
          height="152"
          className="block"
          style={{ border: 0 }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          loading="lazy"
        />
      </motion.div>
    );
  }
  return (
    <motion.a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-1 block rounded-2xl overflow-hidden hover:bg-base-content/5 transition group"
    >
      {/* 🔹 LARGE PREVIEW */}
      {isLarge && preview.image && (
        <>
          <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-base-200">
            {/* Shimmer */}
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-base-200 via-base-300 to-base-200" />
            )}

            <Image
              src={preview.image}
              alt={preview.title || "preview"}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              onLoad={() => setLoaded(true)}
              className="object-cover transition-transform duration-300 group-hover:scale-102"
            />

            {/* YouTube Play Overlay */}
            {isYouTube && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 backdrop-blur-sm p-4 rounded-full group-hover:scale-110 transition">
                  <Play size={18} className="text-white fill-white" />
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

            {/* Domain Badge */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur">
              {domain}
            </div>
          </div>

          <div className="p-2">
            <p className="text-sm font-semibold line-clamp-1">
              {preview.title}
            </p>

            {preview.description && (
              <p className="text-xs opacity-70 line-clamp-2">
                {preview.description}
              </p>
            )}

            <p className="text-xs opacity-50 mt-1">{preview.siteName}</p>
          </div>
        </>
      )}

      {/* 🔹 SMALL PREVIEW */}
      {!isLarge && (
        <div className="flex items-center gap-3 p-1">
          {preview.image && (
            <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-base-200">
              {!loaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-base-200 via-base-300 to-base-200" />
              )}

              <Image
                src={preview.image}
                alt="icon"
                fill
                onLoad={() => setLoaded(true)}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <p className="text-sm font-semibold truncate">{preview.title}</p>

            {preview.description && (
              <p className="text-xs opacity-70 line-clamp-1">
                {preview.description}
              </p>
            )}

            <p className="text-xs opacity-50">{domain}</p>
          </div>
        </div>
      )}
    </motion.a>
  );
}
