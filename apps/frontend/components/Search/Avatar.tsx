"use client";

import Image from "next/image";
import defaultPFP from "@/public/default-pfp.png";
import { useSignedUrl } from "@/hooks/useSignedUrl";

export default function Avatar({
  profilePicture,
  size = 36,
  alt = "User",
}: {
  profilePicture?: { key: string | null };
  size?: number;
  alt?: string;
}) {
  const key = profilePicture?.key;
  const url = useSignedUrl(key);

  return (
    <Image
      src={url || defaultPFP}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full object-cover"
    />
  );
}