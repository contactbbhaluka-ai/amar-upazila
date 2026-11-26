import { defineConfig } from 'vite';

// প্রতিটি বিল্ডের আলাদা পরিচয় (লাইভ আপডেট বোঝার জন্য)। অ্যাপ এটা version.json-এর সাথে মিলিয়ে দেখে নতুন ভার্সন এসেছে কিনা।
const BUILD_ID = process.env.GITHUB_RUN_NUMBER ? `${process.env.GITHUB_RUN_NUMBER}-${Date.now()}` : String(Date.now());

// base: './' দিলে একই বিল্ড ওয়েবসাইট (GitHub Pages/Netlify) ও Android অ্যাপ দুই জায়গাতেই চলে
export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  build: { outDir: 'dist', target: 'es2020' },
  plugins: [{
    name: 'version-json',
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID, time: new Date().toISOString() }) }); },
  }],
});
