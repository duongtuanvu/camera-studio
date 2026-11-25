# Open-source engine inventory

Use upstream packages instead of reimplementing OCR, barcode decoding, object detection or pose estimation. Keep the Camera Studio UI, camera lifecycle, validation and history as application-specific adapters.

| Module | Upstream | Status / license |
| --- | --- | --- |
| OCR / meter digits | [PaddleOCR.js](https://github.com/PaddlePaddle/PaddleOCR/tree/main/paddleocr-js), @paddleocr/paddleocr-js 0.4.2, PP-OCRv6 tiny | Integrated beta; Apache-2.0 SDK, model license to be verified before commercial redistribution |
| OCR fallback | [Tesseract.js](https://github.com/naptha/tesseract.js) | Existing; Apache-2.0 |
| QR / linear barcodes | [zxing-wasm](https://github.com/Sec-ant/zxing-wasm) 3.1.7 | Integrated reader; MIT wrapper, ZXing-C++ Apache-2.0, zint BSD-3-Clause; keep native and ZXing JS fallback |
| Object detection | [ONNX Runtime Web](https://github.com/microsoft/onnxruntime), [TensorFlow.js models](https://github.com/tensorflow/tfjs-models) | Existing; MIT and Apache-2.0 respectively; model rights separate |
| Object counter | [ByteTrack](https://github.com/ifzhang/ByteTrack), [edge-multi-object-tracking](https://github.com/fragompul/edge-multi-object-tracking) | Candidates only. Existing tested centroid tracker stays until a browser port passes a representative tracking benchmark. Do not copy YOLO weights without reviewing model licensing. |
| Pose | [MediaPipe](https://github.com/google-ai-edge/mediapipe) | Existing; Apache-2.0 |
| Color / motion | Browser Canvas and Web Workers | Existing. No extra dependency needed for simple pixel operations. OpenCV.js can be evaluated for advanced motion segmentation. |
| Document perspective correction | [doc-scanner](https://github.com/quannqit/doc-scanner) | Candidate only; MIT per upstream README. |

PaddleOCR uses the official SDK's worker and version-matched runtime defaults. Model and runtime downloads may be external; camera pixels are passed to the local SDK, not a cloud OCR API. As of v0.3.1, Auto mode attempts Tesseract first and falls back to PaddleOCR on document initialization errors. Explicit PaddleOCR remains experimental. Runtime errors remain visible; the user can switch engines. Neither OCR engine's confidence is a measured field accuracy.

ZXing WASM binary is copied from the exact npm release into versioned same-origin runtime assets. The decoder is initialized only when a scan module is opened. QR and linear barcode results are kept separate; no-code frames are not failures.

Quality gates: Node regression tests and coverage, existing Tesseract WASM smoke tests, new ZXing WASM smoke tests using independently generated QR/EAN-13/Code128 fixtures, TypeScript and static build. Separate GitHub Actions workflow exercises the PaddleOCR browser adapter on two clean synthetic fixtures. Cloudflare's direct Git deployment does not wait for this separate browser workflow. No physical-device testing or field accuracy benchmark is claimed.

See upstream repositories for license texts and third-party notices. This inventory is not a legal opinion or a complete transitive dependency audit.
