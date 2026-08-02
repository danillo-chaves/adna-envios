import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.3.89"],
  serverExternalPackages: ["firebase-admin", "nodemailer"],
};

export default nextConfig;
