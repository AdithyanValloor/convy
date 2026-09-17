import Image from "next/image";
import melo from "@/public/melo.png";
import { quicksand } from "@/utils/fonts";

export function Logo({ isPublic }: { isPublic?: boolean }) {
  return (
    <div className={`flex h-14 md:h-16 items-center justify-center shrink-0 ${!isPublic && " bg-base-300"}`}>
      <h1
        className={`${quicksand.className} ${
          isPublic ? "text-3xl text-white" : "text-2xl"
        } leading-none font-bold tracking-tight text-base-content`}
      >
        <span className={`inline-flex ${isPublic ? "w-10" : "w-8"} mx-2 align-middle`}>
          <Image
            src={melo}
            alt="Melo logo"
            width={100}
            height={100}
            className="object-contain"
            priority
          />
        </span>
        melo
      </h1>
    </div>
  );
}