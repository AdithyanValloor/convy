import { Circle } from 'lucide-react';
import React from 'react';
import defaultPFP from '@/public/default-pfp.png';
import Image, { StaticImageData } from 'next/image';

interface ProfilePictureProps {
  src: string | StaticImageData;
  status?: "online" | "offline";
  size: "sm" | "md" | "lg";
  showStatus?: boolean;
  className?: string;
}

function ProfilePicture({ src, status, size, showStatus = true }: ProfilePictureProps) {

  const statusColors = {
    online: "green",
    offline: "gray"
  } as const;

  return (
    <div className="relative ">
      <Image 
        src={src || defaultPFP} 
        alt="profile" 
        width={size === "sm" ? 45 : size === "md" ? 50 : 80}
        height={size === "sm" ? 45 : size === "md" ? 50 : 80}
        className="rounded-full object-contain border-1"
      />
      
      {showStatus && (
        <Circle
          size={size === "lg" ? 20 : 12}
          strokeWidth={0}
          fill={status ? statusColors[status] : ""}
          className="absolute bg-base-100 rounded-full bottom-0 right-0"
        />
      )}
    </div>
  );
}

export default ProfilePicture;
