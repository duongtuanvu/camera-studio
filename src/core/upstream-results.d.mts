export function matchesBarcodeFormat(format:unknown,mode:'qr'|'barcode'):boolean;
export function selectBarcodeResult(results:unknown,mode:'qr'|'barcode',backend:string):{text:string;valid:true;backend:string}|null;
export function paddleData(items:unknown):{text:string;confidence:number};
