import { fabric } from 'fabric';
import { CanvasState, TextLayer } from '@/types';
import { normalizeFontFamilyFromCanvas } from './fonts';

const MIN_BOUNDARY = 20;

// Utility function to resize images while maintaining aspect ratio
export const resizeImage = (
  imageSrc: string,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  maxSizeBytes: number = 5 * 1024 * 1024
): Promise<{ src: string; width: number; height: number; wasResized: boolean }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // Check if resizing is needed
      const needsResize = originalWidth > maxWidth || originalHeight > maxHeight;
      const isTooLarge = imageSrc.length > maxSizeBytes;
      
      if (!needsResize && !isTooLarge) {
        resolve({
          src: imageSrc,
          width: originalWidth,
          height: originalHeight,
          wasResized: false
        });
        return;
      }
      
      // Calculate new dimensions maintaining aspect ratio
      const aspectRatio = originalWidth / originalHeight;
      let finalWidth = originalWidth;
      let finalHeight = originalHeight;
      
      if (originalWidth > originalHeight) {
        // Landscape image
        finalWidth = Math.min(originalWidth, maxWidth);
        finalHeight = finalWidth / aspectRatio;
        
        if (finalHeight > maxHeight) {
          finalHeight = maxHeight;
          finalWidth = finalHeight * aspectRatio;
        }
      } else {
        // Portrait or square image
        finalHeight = Math.min(originalHeight, maxHeight);
        finalWidth = finalHeight * aspectRatio;
        
        if (finalWidth > maxWidth) {
          finalWidth = maxWidth;
          finalHeight = finalWidth / aspectRatio;
        }
      }
      
      // Resize the image using canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }
      
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the resized image
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
      
      // Convert to data URL with reduced quality if still too large
      let quality = 0.9;
      let finalSrc = canvas.toDataURL('image/jpeg', quality);
      
      // If still too large, reduce quality further
      while (finalSrc.length > maxSizeBytes && quality > 0.1) {
        quality -= 0.1;
        finalSrc = canvas.toDataURL('image/jpeg', quality);
      }
      
      resolve({
        src: finalSrc,
        width: finalWidth,
        height: finalHeight,
        wasResized: true
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for resizing'));
    };
    
    img.src = imageSrc;
  });
};

function createTextGroupFromLayer(layer: TextLayer): fabric.Group {
  const boundaryWidth = Math.max(MIN_BOUNDARY, layer.width || MIN_BOUNDARY);
  const boundaryHeight = Math.max(MIN_BOUNDARY, layer.height || MIN_BOUNDARY);

  const boundaryRect = new fabric.Rect({
    left: 0,
    top: 0,
    width: boundaryWidth,
    height: boundaryHeight,
    originX: 'left',
    originY: 'top',
    fill: 'transparent',
    stroke: 'rgba(0,0,0,0)',
    selectable: false,
    evented: false,
  });

  const textbox = new fabric.Textbox(layer.text, {
    left: 0,
    top: 0,
    width: boundaryWidth,
    originX: 'left',
    originY: 'top',
    fontSize: layer.fontSize,
    fontFamily: layer.fontFamily,
    fontWeight: layer.fontWeight,
    fill: layer.color,
    opacity: layer.opacity,
    textAlign: layer.textAlign,
    angle: 0,
    lineHeight: layer.lineHeight,
    charSpacing: layer.letterSpacing,
    selectable: false,
    evented: false,
  });

  if (layer.textShadow) {
    textbox.set({
      shadow: new fabric.Shadow({
        color: layer.textShadow.color,
        blur: layer.textShadow.blur,
        offsetX: layer.textShadow.offsetX,
        offsetY: layer.textShadow.offsetY,
      }),
    });
  }

  const group = new fabric.Group([boundaryRect, textbox], {
    left: layer.left,
    top: layer.top,
    angle: layer.angle,
    selectable: !layer.locked,
    evented: !layer.locked,
    visible: layer.visible,
    data: { id: layer.id, kind: 'textGroup', boundaryHeight: boundaryHeight },
  });

  // Clip the group vertically to the boundary rect size
  group.set({
    clipPath: new fabric.Rect({
      originX: 'center',
      originY: 'center',
      width: boundaryWidth,
      height: boundaryHeight,
    }),
  });

  return group;
}

export const findTextGroupParts = (group: fabric.Group): { rect: fabric.Rect | undefined; textbox: fabric.Textbox | undefined } => {
  const objects = (group as any)._objects as fabric.Object[];
  const rect = objects.find(o => o.type === 'rect') as fabric.Rect | undefined;
  const textbox = objects.find(o => o.type === 'textbox') as fabric.Textbox | undefined;
  return { rect, textbox };
}

export const createCanvas = (width: number, height: number): fabric.Canvas => {
  const canvas = new fabric.Canvas('canvas', {
    width,
    height,
    backgroundColor: 'transparent',
    preserveObjectStacking: true,
    selection: true,
    uniformScaling: false,
  });

  // Keep controls visible for better resizing UX
  fabric.Object.prototype.set({
    cornerColor: '#2563eb',
    borderColor: '#2563eb',
    cornerStyle: 'circle',
    transparentCorners: false,
  });

  // Enable snapping
  canvas.on('object:moving', (e) => {
    const obj = e.target as fabric.Object | undefined;
    if (!obj) return;

    const center = canvas.getCenter();
    
    // Snap to center
    if (Math.abs((obj.left || 0) - center.left) < 20) {
      obj.set('left', center.left);
    }
    if (Math.abs((obj.top || 0) - center.top) < 20) {
      obj.set('top', center.top);
    }
  });

  return canvas;
};

export const addTextLayer = (
  canvas: fabric.Canvas,
  layer: TextLayer
): fabric.Group => {
  const group = createTextGroupFromLayer(layer);
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.renderAll();
  return group;
};

export const updateTextLayer = (
  canvas: fabric.Canvas,
  layer: TextLayer
): void => {
  const objects = canvas.getObjects();
  const group = objects.find(obj => obj.data?.id === layer.id) as fabric.Group | undefined;

  if (group) {
    group.set({
      left: layer.left,
      top: layer.top,
      angle: layer.angle,
      selectable: !layer.locked,
      evented: !layer.locked,
      visible: layer.visible,
    });

    const { textbox } = findTextGroupParts(group);
    if (textbox) {
      textbox.set({
        text: layer.text,
        fontSize: layer.fontSize,
        fontFamily: layer.fontFamily,
        fontWeight: layer.fontWeight,
        fill: layer.color,
        opacity: layer.opacity,
        textAlign: layer.textAlign,
        lineHeight: layer.lineHeight,
        charSpacing: layer.letterSpacing,
      });
      if (layer.textShadow) {
        textbox.set({
          shadow: new fabric.Shadow({
            color: layer.textShadow.color,
            blur: layer.textShadow.blur,
            offsetX: layer.textShadow.offsetX,
            offsetY: layer.textShadow.offsetY,
          }),
        });
      } else {
        textbox.set({ shadow: undefined });
      }
    }

    group.setCoords();
    canvas.renderAll();
  }
};

export const removeTextLayer = (
  canvas: fabric.Canvas,
  layerId: string
): void => {
  const objects = canvas.getObjects();
  const group = objects.find(obj => obj.data?.id === layerId);

  if (group) {
    canvas.remove(group);
    canvas.renderAll();
  }
};

export const setBackgroundImage = (
  canvas: fabric.Canvas,
  imageSrc: string,
  width: number,
  height: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Validate image source
    if (!imageSrc || typeof imageSrc !== 'string') {
      console.error('Invalid image source:', imageSrc);
      reject(new Error('Invalid image source'));
      return;
    }

    // Create a temporary image to test if the source is valid
    const tempImg = new Image();
    tempImg.onload = () => {
      fabric.Image.fromURL(imageSrc, (img: fabric.Image) => {
        // Set new background
        img.set({
          left: 0,
          top: 0,
          width,
          height,
          selectable: false,
          evented: false,
          data: { isBackground: true },
        });

        canvas.setBackgroundImage(img, () => {
          canvas.setDimensions({ width, height });
          canvas.renderAll();
          resolve();
        });
      }, { crossOrigin: 'anonymous' });
    };
    
    tempImg.onerror = () => {
      console.error('Failed to load background image from source:', imageSrc);
      reject(new Error('Failed to load background image'));
    };
    
    tempImg.src = imageSrc;
  });
};

export const exportCanvas = (canvas: fabric.Canvas): string => {
  return canvas.toDataURL({
    format: 'png',
    quality: 1,
  });
};

export const syncCanvasWithState = (
  canvas: fabric.Canvas,
  state: CanvasState,
  onError?: (error: string) => void
): Promise<void> => {
  return new Promise((resolve) => {
    // Clear canvas
    canvas.clear();

    const addLayers = () => {
      state.layers.forEach(layer => {
        addTextLayer(canvas, layer);
      });

      // Select layer if specified
      if (state.selectedLayerId) {
        const objects = canvas.getObjects();
        const selectedObject = objects.find(obj => obj.data?.id === state.selectedLayerId);
        if (selectedObject) {
          canvas.setActiveObject(selectedObject);
        }
      }

      canvas.renderAll();
      resolve();
    };

    // Set background image, then add layers
    if (state.backgroundImage && state.backgroundImage.src) {
      setBackgroundImage(
        canvas,
        state.backgroundImage.src,
        state.backgroundImage.width,
        state.backgroundImage.height
      ).then(addLayers).catch((error) => {
        console.error('Failed to load background image from storage:', error);
        onError?.('Failed to load background image from storage');
        // Continue without background image if it fails to load
        addLayers();
      });
    } else {
      addLayers();
    }
  });
};

export const getCanvasState = (canvas: fabric.Canvas): CanvasState => {
  const objects = canvas.getObjects();
  const groups = objects.filter(obj => !obj.data?.isBackground && obj.type === 'group') as fabric.Group[];

  const layers: TextLayer[] = groups.map(group => {
    const { rect, textbox } = findTextGroupParts(group);
    const tb = textbox as fabric.Textbox | undefined;
    const width = (group.width || 0) * (group.scaleX || 1)
    const height = (group.height || 0) * (group.scaleY || 1);
    return {
      id: group.data?.id || '',
      text: tb?.text || '',
      fontFamily: normalizeFontFamilyFromCanvas(tb?.fontFamily || 'Inter'),
      fontSize: tb?.fontSize || 16,
      fontWeight: (tb?.fontWeight as string) || '400',
      color: (tb?.fill as string) || '#000000',
      opacity: tb?.opacity ?? 1,
      textAlign: (tb?.textAlign as any) || 'left',
      left: group.left ?? 0,
      top: group.top ?? 0,
      width: width,
      height: height,
      angle: group.angle ?? 0,
      lineHeight: (tb?.lineHeight as number) ?? 1.16,
      letterSpacing: (tb?.charSpacing as number) ?? 0,
      scaleX: 1,
      scaleY: 1,
      textShadow: tb?.shadow ? {
        color: (tb.shadow as any).color || '#000000',
        blur: (tb.shadow as any).blur || 0,
        offsetX: (tb.shadow as any).offsetX || 0,
        offsetY: (tb.shadow as any).offsetY || 0,
      } : undefined,
      locked: group.selectable === false,
      visible: group.visible !== false,
    };
  });

  return {
    backgroundImage: canvas.backgroundImage ? {
      src: (canvas.backgroundImage as any).getSrc?.() || '',
      width: canvas.width || 800,
      height: canvas.height || 600,
    } : undefined,
    layers,
    selectedLayerId: canvas.getActiveObject()?.data?.id,
  };
};
