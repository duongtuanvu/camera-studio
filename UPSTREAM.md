# Open-source engine inventory

Use upstream packages instead of reimplementing OCR, barcode decoding, object detection or pose estimation. Keep the Camera Studio UI, camera lifecycle, validation and history as application-specific adapters.

| Module | Upstream | Status / license |
| --- | --- | --- |
| OCR / meter digits | [PaddleOCR.js](https://github.com/PaddlePaddle/PaddleOCR/tree/main/paddleocr-js), @paddleocr/paddleocr-js 0.4.2, PP-OCRv6 tiny | Removed from production in v0.3.2: transitive JSEP WASM exceeds 25 MiB; archived in Git history. Apache-2.0 SDK; model license separately reviewed before redistribution. |
| OCR production engine | [Tesseract.js](https://github.com/naptha/tesseract.js) | Existing; Apache-2.0 |
| QR / linear barcodes | [zxing-wasm](https://github.com/Sec-ant/zxing-wasm) 3.1.7 | Integrated reader; MIT wrapper, ZXing-C++ Apache-2.0, zint BSD-3-Clause; keep native and ZXing JS fallback |
| Object detection | [ONNX Runtime Web](https://github.com/microsoft/onnxruntime), [TensorFlow.js models](https://github.com/tensorflow/tfjs-models) | Existing; MIT and Apache-2.0 respectively; model rights separate |
| Object counter | [ByteTrack](https://github.com/ifzhang/ByteTrack), [edge-multi-object-tracking](https://github.com/fragompul/edge-multi-object-tracking) | Candidates only. Existing tested centroid tracker stays until a browser port passes a representative tracking benchmark. Do not copy YOLO weights without reviewing model licensing. |
| Pose | [MediaPipe](https://github.com/google-ai-edge/mediapipe) | Existing; Apache-2.0 |
| Color / motion | Browser Canvas and Web Workers | Existing. No extra dependency needed for simple pixel operations. OpenCV.js can be evaluated for advanced motion segmentation. |
| Document perspective correction | [doc-scanner](https://github.com/quannqit/doc-scanner) | Candidate only; MIT per upstream README. |

PaddleOCR is not included in the v0.3.2 dependency graph or UI. The production OCR adapter uses locally hosted Tesseract.js WASM. Previous Paddle source remains in Git history. Confidence is not measured field accuracy.

ZXing WASM binary is copied from the exact npm release into versioned same-origin runtime assets. The decoder is initialized only when a scan module is opened. QR and linear barcode results are kept separate; no-code frames are not failures.

Quality gates: Node regression tests and coverage, existing Tesseract WASM smoke tests, new ZXing WASM smoke tests using independently generated QR/EAN-13/Code128 fixtures, TypeScript and static build. Separate GitHub Actions workflow exercises the active Tesseract browser adapter on two clean synthetic fixtures. Cloudflare's direct Git deployment does not wait for this separate browser workflow. No physical-device testing or field accuracy benchmark is claimed.

See upstream repositories for license texts and third-party notices. This inventory is not a legal opinion or a complete transitive dependency audit.
