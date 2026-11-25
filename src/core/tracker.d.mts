import type {Mark} from './modules';
export type Direction='up'|'down'|'both';
export class LineTracker {constructor(options?:{line?:number;direction?:Direction;maxAge?:number;gate?:number;hysteresis?:number});total:number;reset():void;clearTracks():void;configure(line:number,direction:Direction):void;update(marks:Mark[],now:number):{total:number;marks:Mark[];visible:number};}
