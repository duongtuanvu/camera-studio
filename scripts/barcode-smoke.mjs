import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareZXingModule,readBarcodes} from 'zxing-wasm/reader';
import {selectBarcodeResult} from '../src/core/upstream-results.mjs';
const wasm=await readFile('public/runtime-v2/zxing-3.1.7/zxing_reader.wasm');
await prepareZXingModule({overrides:{wasmBinary:Uint8Array.from(wasm).buffer},fireImmediately:true});
for(const c of [{fixture:'qr',format:'QRCode',mode:'qr',expected:'Camera Studio QR 2026'},{fixture:'ean13',format:'EAN13',mode:'barcode',expected:'8938505974194'},{fixture:'code128',format:'Code128',mode:'barcode',expected:'CAM-012345'}]){
 const input=Buffer.from(await readFile('tests/fixtures/'+c.fixture+'.b64','utf8'),'base64');
 const decoded=selectBarcodeResult(await readBarcodes(input,{formats:[c.format],tryHarder:true,maxNumberOfSymbols:1}),c.mode,'ZXing-C++ WASM');
 assert.equal(decoded?.text,c.expected,c.fixture+' decoded data mismatch');
 console.log(c.fixture+': '+decoded.text);
}
const blank={width:64,height:64,data:new Uint8ClampedArray(64*64*4).fill(255)};
assert.equal(selectBarcodeResult(await readBarcodes(blank,{formats:['QRCode'],tryHarder:true}), 'qr','ZXing-C++ WASM'),null);
console.log('ZXing WASM smoke tests passed (3 independent fixtures, 1 blank image).');
