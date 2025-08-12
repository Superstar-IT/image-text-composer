export interface TextLayer {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  opacity: number;
  textAlign: 'left' | 'center' | 'right';
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  lineHeight: number;
  letterSpacing: number;
  scaleX?: number;
  scaleY?: number;
  textShadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  locked: boolean;
  visible: boolean;
}

export interface CanvasState {
  backgroundImage?: {
    src: string;
    width: number;
    height: number;
  };
  layers: TextLayer[];
  selectedLayerId?: string;
}

export interface HistoryState {
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];
}

export interface FontOption {
  family: string;
  displayName: string;
  weights: string[];
}

export interface ExportOptions {
  format: 'png';
  quality: number;
  scale: number;
}

export type Alignment = 'left' | 'center' | 'right';
export type FontWeight = '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
