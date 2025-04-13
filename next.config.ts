import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //Configure Host name for images
  images: {
    domains: ["birdmonitor.blob.core.windows.net"],
  },
  /* config options here */
};

export default nextConfig;
