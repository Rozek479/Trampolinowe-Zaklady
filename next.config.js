/** next.config.js */
/** @type {import('next').NextConfig} */
module.exports = {
  eslint: {
    // pozwala na build nawet z błędami ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // pozwala na build nawet z błędami TypeScript
    ignoreBuildErrors: true,
  },
}
