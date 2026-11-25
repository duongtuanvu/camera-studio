# Camera Studio v0.2.0

Mobile-first, local-first camera toolkit. Production: https://camera.linhsumi.io.vn

## Run
Node 22 recommended.
```sh
npm install
npm test
npm run dev
npm run build
```
Use HTTPS or localhost for camera permission.

## What's new
- Camera and tool lifetimes are independent. Failed model import, inference or worker errors are displayed with stage and message; retry the tool without stopping the preview. Separate camera retry, cache reset, timeouts, and visibility handling.
- Object detection: ONNX SSD MobileNet V1 INT8 in a dedicated classic worker (WASM; attempt WebGPU+WASM on capable non-iOS devices). TFJS COCO-SSD compatibility fallback. WebGPU fallback is not guaranteed to accelerate quantized kernels.
- Object counter: class-aware lightweight centroid/velocity association, configurable horizontal counting line and direction, per-track counting, hysteresis, stale-track expiration and reset. Not ByteTrack; occlusion/fast movement may still cause missed counts or ID switches. Industrial objects need a trained model and calibrated testing.
- QR/barcode: native BarcodeDetector when available, ZXing fallback; ordinary no-code frames do not stop the tool.
- OCR English/Vietnamese/both, local Tesseract worker, core and traineddata.
- Color/motion: dedicated worker when supported, small Canvas fallback.
- Pose: MediaPipe lite CPU, local WASM assets; still runs synchronous detection on main thread.
- User-initiated result history with IndexedDB, cap 500 entries, CSV (spreadsheet formula escaping) and JSON export, explicit deletion.
- requestVideoFrameCallback with RAF fallback, one inference in flight, adaptive interval and on-device latency/FPS display.
- Scoped, versioned runtime asset caching; HTML is not cached by service worker. Offline cold start is not supported.

## Assets
The build copies pinned npm runtime binaries and traineddata into public/runtime-v2 (generated, ignored in Git). It attempts to fetch SSD/Pose models with SHA-256 verification; if unavailable, the build logs a warning and the runtime tries verified upstream sources. No camera frames are sent to those sources. Runtime assets are versioned; bump the directory/cache version when updating packages. Build checks enforce Cloudflare's 25 MiB per-file limit.

Models: [ONNX SSD MobileNet INT8](https://huggingface.co/onnxmodelzoo/ssd_mobilenet_v1_12-int8), [MediaPipe Pose Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker). Verify model licensing, accuracy and device compatibility before commercial deployment.

## Cloudflare deployment
Keep the existing Cloudflare Workers Git integration, branch main, build command npm run build, deploy command npx wrangler deploy, output dist/. Do not rename the existing Worker or replace custom-domain routing. Build logs contain asset download warnings and static deployment checks. The site requires HTTPS. GitHub Actions is separate from Cloudflare deployment.

## Troubleshooting
If a previous release is cached, open a tool, choose Settings > Xóa cache & tải lại. If the tool fails, copy the exact stage/error shown; the camera preview remains live. Try Color Picker or QR before AI tools to isolate camera from model issues. If the camera itself fails, allow permission and close other camera apps.
 
## Testing
Run npm test for pixels and line tracking, npm run build for TypeScript and static file checks. Physical Android/iOS, browser fake-camera end-to-end testing, thermal and memory benchmarks, dependency lockfile, accuracy evaluation and WebGPU profiling are still required before production readiness.
