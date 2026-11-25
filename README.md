# Camera Studio

A mobile-first, local-first camera toolkit. Open the site, select a module, grant camera permission, and use the live preview.

## Run
```sh
npm install
npm test
npm run dev
npm run build
```
Node 22 recommended. Camera requires HTTPS or localhost; accessing a development machine by plain HTTP LAN IP does not normally allow camera access.

## Tools
- Object detection and visible-object counting: TensorFlow.js COCO-SSD (lite MobileNet), WebGL with CPU fallback. No tracking or industrial SKU model yet.
- QR and barcode: ZXing.
- OCR: Tesseract.js, English, capture on demand.
- Color and motion: pixel processing in a Web Worker when supported, small-canvas fallback.
- Pose: MediaPipe Pose Landmarker (lite), landmarks only.

Model assets may be downloaded from third-party CDNs at first use. Camera frames are not uploaded by this app. Models run locally; offline shell caching is best-effort, not complete offline model support.

## Architecture
React + TypeScript + Vite, native video, canvas overlay, lazy module imports, one inference in flight, adaptive processing intervals, camera cleanup and cancellation. TFJS and MediaPipe inference still use main-thread APIs; UI 60 FPS is not guaranteed. Worker migration and WebGPU/ONNX are future work.

## Deploy
In GitHub repository Settings > Pages, select GitHub Actions as source. The CI and Pages workflow installs dependencies, runs unit tests, builds and deploys. The expected project site is https://duongtuanvu.github.io/camera-studio/ after Pages is enabled and deployment succeeds. Alternatively deploy dist/ to an HTTPS static host.

## Validation
Pixel algorithm unit tests are included. Real-device Android/iOS camera tests, long-running memory/thermal benchmarks, dependency lockfile and model licensing review are required before production use.
