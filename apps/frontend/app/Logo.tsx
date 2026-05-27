import Image from "next/image";
import logo from "@/public/convyLogo.png";
import { poiretOne } from "@/utils/fonts";

export function Logo({ isPublic }: { isPublic?: boolean }) {
  return (
    <div className="flex h-14 md:h-16 items-center justify-center shrink-0">
      <h1
        className={`${poiretOne.className} ${
          isPublic ? "text-5xl" : "text-4xl"
        } leading-none tracking-tight text-base-content`}
      >
        c
        <span
          className={`inline-block align-middle w-[0.54em] h-[0.54em] ml-[0.05em] `}
        >
          <Image
            src={logo}
            alt="Convy logo"
            width={100}
            height={100}
            className="object-contain"
          />
        </span>
        nvy
      </h1>
    </div>
  );
}