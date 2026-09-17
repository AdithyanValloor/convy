import { Inter, Poppins, Modak, Poiret_One, Quicksand } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const modak = Modak({
  subsets: ["latin"],
  weight: ["400"],
});

export const poiretOne = Poiret_One({
  subsets: ["latin"],
  weight: ["400"],
});

export const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});