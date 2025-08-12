import { fabric } from 'fabric';
import { CanvasState, TextLayer } from '@/types';
import { normalizeFontFamilyFromCanvas } from './fonts';

const MIN_BOUNDARY = 20;

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
  return new Promise((resolve) => {
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
  state: CanvasState
): void => {
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
  };

  // Set background image, then add layers
  if (state.backgroundImage) {
    setBackgroundImage(
      canvas,
      state.backgroundImage.src,
      state.backgroundImage.width,
      state.backgroundImage.height
    ).then(addLayers);
  } else {
    addLayers();
  }
};

export const getCanvasState = (canvas: fabric.Canvas): CanvasState => {
  const objects = canvas.getObjects();
  const groups = objects.filter(obj => !obj.data?.isBackground && obj.type === 'group') as fabric.Group[];

  const layers: TextLayer[] = groups.map(group => {
    const { rect, textbox } = findTextGroupParts(group);
    const tb = textbox as fabric.Textbox | undefined;
    const width = rect?.width ?? tb?.width ?? 0;
    const height = rect?.height ?? 0;
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
