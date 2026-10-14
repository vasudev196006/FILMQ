declare module 'liquid-gl' {
  export interface LiquidGLOptions {
    target: string | HTMLElement | (string | HTMLElement)[];
    snapshot?: string | HTMLElement;
    resolution?: number;
    zIndex?: number;
    content?: string;
    refraction?: number;
    aberration?: number;
    bevelDepth?: number;
    bevelWidth?: number;
    frost?: number;
    shadow?: boolean;
    specular?: boolean;
    reveal?: 'fade' | 'none' | 'scale' | string;
    tilt?: boolean;
    tiltFactor?: number;
    tiltEase?: number;
    draggable?: boolean;
    interaction?: 'fluid' | 'default' | 'none';
    interactionStrength?: number;
    interactionRadius?: number;
    interactionViscosity?: number;
    magnify?: number;
    tint?: string;
    helper?: boolean;
    engine?: 'auto' | 'webgpu' | 'webgl2' | 'webgl';
    on?: {
      init?: (lens: LiquidGLLens) => void;
      dragstart?: (lens: LiquidGLLens, info: any) => void;
      drag?: (lens: LiquidGLLens, info: any) => void;
      dragend?: (lens: LiquidGLLens, info: any) => void;
    };
  }

  export interface LiquidGLLens {
    destroy: () => void;
    clearDrag: () => void;
    setTint: (tint: string) => void;
    setDraggable: (draggable: boolean) => void;
  }

  export interface LiquidGLStatic {
    (options: LiquidGLOptions): LiquidGLLens;
    registerDynamic: (elements: HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>) => void;
    syncWith: (scrollInstance?: any) => void;
  }

  const liquidGL: LiquidGLStatic;
  export default liquidGL;
}
