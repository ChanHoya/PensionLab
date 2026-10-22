import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "hoya-pension-lab.vercel.app",
          },
        ],
        destination: "https://pensionlabor.vercel.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
