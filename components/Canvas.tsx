"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { fabric } from "fabric";
import { CanvasState } from "@/types";
import {
  createCanvas,
  syncCanvasWithState,
  getCanvasState,
  exportCanvas,
  addTextLayer,
  updateTextLayer,
  findTextGroupParts,
} from "@/utils/canvas";

interface CanvasProps {
  state: CanvasState;
  onStateChange: (state: CanvasState) => void;
  onSelectionChange: (layerId: string | undefined) => void;
}

export interface CanvasRef {
  export: () => string;
}

const MIN_BOUNDARY = 20;

const ensureClipRect = (tb: fabric.Textbox, width: number, height: number) => {
  const w = Math.max(MIN_BOUNDARY, width || 0);
  const h = Math.max(MIN_BOUNDARY, height || 0);
  let clip = tb.clipPath as fabric.Rect | undefined;
  if (!clip || clip.type !== "rect") {
    clip = new fabric.Rect({
      originX: "center",
      originY: "center",
      width: w,
      height: h,
    });
  } else {
    clip.set({ width: w, height: h });
  }
  tb.set({ clipPath: clip });
  tb.data = { ...(tb.data || {}), boundaryHeight: h } as any;
};

const getBoundaryHeight = (tb: fabric.Textbox): number => {
  const dataHeight = (tb.data as any)?.boundaryHeight as number | undefined;
  return Math.max(MIN_BOUNDARY, dataHeight ?? (tb.height || 0 || MIN_BOUNDARY));
};

const isFormElement = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    el.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
};

const Canvas = forwardRef<CanvasRef, CanvasProps>(
  ({ state, onStateChange, onSelectionChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const lastBgRef = useRef<string | undefined>(undefined);

    // Expose canvas methods to parent
    useImperativeHandle(ref, () => ({
      export: () => {
        if (fabricCanvasRef.current) {
          return exportCanvas(fabricCanvasRef.current);
        }
        return "";
      },
    }));

    // Initialize canvas
    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = createCanvas(800, 600);
      fabricCanvasRef.current = canvas;

      // Ensure CSS sizing does not scale canvas bitmap; use intrinsic size
      const el = canvas.getElement();
      el.style.width = `${canvas.getWidth()}px`;
      el.style.height = `${canvas.getHeight()}px`;

      // Handle object selection
      canvas.on("selection:created", (e) => {
        const activeObject = e.selected?.[0];
        onSelectionChange(activeObject?.data?.id);
      });

      canvas.on("selection:updated", (e) => {
        const activeObject = e.selected?.[0];
        onSelectionChange(activeObject?.data?.id);
      });

      canvas.on("selection:cleared", () => {
        onSelectionChange(undefined);
      });

      // Axis-aware live scaling: keep font size constant, adjust only intended axis
      canvas.on("object:scaling", (e) => {
        const obj = e?.target as fabric.Object | undefined;
        if (obj && obj.type === "textbox") {
          const tb = obj as unknown as fabric.Textbox;
          const transform = (e as any)?.transform as any | undefined;
          const corner = transform?.corner as string | undefined;

          const isVerticalOnly = corner === "mt" || corner === "mb";
          const isHorizontalOnly = corner === "ml" || corner === "mr";

          // Initialize baseline for this drag
          const dataAny = (tb.data || {}) as any;
          if (!dataAny._resizeStart) {
            dataAny._resizeStart = {
              width: tb.width || MIN_BOUNDARY,
              height: getBoundaryHeight(tb),
            };
            tb.data = dataAny as any;
          }

          const startWidth = dataAny._resizeStart.width as number;
          const startHeight = dataAny._resizeStart.height as number;

          const sX = transform?.scaleX ?? tb.scaleX ?? 1;
          const sY = transform?.scaleY ?? tb.scaleY ?? 1;
          const proposedW = Math.max(MIN_BOUNDARY, startWidth * sX);
          const proposedH = Math.max(MIN_BOUNDARY, startHeight * sY);

          const newW = isVerticalOnly ? startWidth : proposedW;
          const newH = isHorizontalOnly ? startHeight : proposedH;

          // Live-bake width/height and neutralize scaling so text doesn't scale
          tb.set({ width: newW, height: newH, scaleX: 1, scaleY: 1 });
          // Also neutralize the transform scales to keep handles responsive
          if (transform) {
            transform.scaleX = 1;
            transform.scaleY = 1;
          }
          tb.setCoords();
          canvas.requestRenderAll();
        } else if (obj && obj.type === "group") {
          const group = obj as fabric.Group;
          const scaleX = group.scaleX ?? 1;
          const scaleY = group.scaleY ?? 1;
          const updatedWidth = (group.width ?? 0) * scaleX ;
          const { textbox } = findTextGroupParts(group);
          if(textbox) {
            textbox.set({ scaleX: 1 / scaleX, scaleY: 1 /scaleY, width: updatedWidth, breakWords: true });
            textbox.setCoords();
        }
          obj.setCoords();
          canvas.requestRenderAll();
        }
      });

      // After resize/rotate finishes, finalize baked dimensions and reset scale
      canvas.on("object:modified", (e) => {
        const obj = e?.target as fabric.Object | undefined;
        if (obj && obj.type === "textbox") {
          const tb = obj as unknown as fabric.Textbox;
          const transform = (e as any)?.transform as any | undefined;
          const corner = transform?.corner as string | undefined;

          const isVerticalOnly = corner === "mt" || corner === "mb";
          const isHorizontalOnly = corner === "ml" || corner === "mr";

          const dataAny = (tb.data || {}) as any;
          const startWidth =
            dataAny._resizeStart?.width ?? (tb.width || MIN_BOUNDARY);
          const startHeight =
            dataAny._resizeStart?.height ?? getBoundaryHeight(tb);

          // Since we baked during scaling, use current baked values
          const bakedW = tb.width || startWidth;
          const bakedH = getBoundaryHeight(tb) || startHeight;

          const finalW = isVerticalOnly ? startWidth : bakedW;
          const finalH = isHorizontalOnly ? startHeight : bakedH;

          tb.set({ width: finalW, height: finalH, scaleX: 1, scaleY: 1 });
          ensureClipRect(tb, finalW, finalH);
          // Clear baseline for next interactions
          if (dataAny._resizeStart) {
            delete dataAny._resizeStart;
            tb.data = dataAny;
          }
          tb.setCoords();
        } else if (obj && obj.type === "group") {
          const group = obj as fabric.Group;
          const scaleX = group.scaleX ?? 1;
          const scaleY = group.scaleY ?? 1;
          const updatedWidth = (group.width ?? 0) * scaleX ;
          const { textbox } = findTextGroupParts(group);
          if(textbox) {
            textbox.set({ scaleX: 1 / scaleX, scaleY: 1 /scaleY, width: updatedWidth, breakWords: true });
            textbox.setCoords();
            canvas.requestRenderAll();
          }

          obj.setCoords();
          canvas.requestRenderAll();

          if (fabricCanvasRef.current) {
            fabricCanvasRef.current.requestRenderAll();
            const newState = getCanvasState(fabricCanvasRef.current);
            onStateChange(newState);
          }
        }
      });

      return () => {
        canvas.dispose();
      };
    }, [onStateChange, onSelectionChange]);

    // Incremental sync to avoid full rebuilds that can steal focus
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const bgSrc = state.backgroundImage?.src;
      const bgChanged = bgSrc !== lastBgRef.current;

      if (bgChanged) {
        lastBgRef.current = bgSrc;
        syncCanvasWithState(canvas, state);
        // reflect intrinsic pixel size into CSS to avoid visual scaling
        const el = canvas.getElement();
        el.style.width = `${canvas.getWidth()}px`;
        el.style.height = `${canvas.getHeight()}px`;
        return;
      }

      // Update/add text layers
      const desiredIds = new Set(state.layers.map((l) => l.id));
      const objects = canvas.getObjects();

      // Remove objects not present in state (but keep background)
      objects
        .filter((o) => !o.data?.isBackground)
        .forEach((o) => {
          if (!desiredIds.has(o.data?.id)) {
            canvas.remove(o);
          }
        });

      // Upsert layers
      state.layers.forEach((layer, layerIndex) => {
        const existing = canvas
          .getObjects()
          .find((o, objectIndex) => {
            if(o.data?.id === layer.id) {
              if(objectIndex !== layerIndex) {
                o.moveTo(layerIndex);
              }
              return true;
            } 
            return false;
          });
        if (existing) {
          updateTextLayer(canvas, layer);
        } else {
          addTextLayer(canvas, layer);
        }
      });

      // Maintain selection
      if (state.selectedLayerId) {
        const selectedObject = canvas
          .getObjects()
          .find((o) => o.data?.id === state.selectedLayerId);
        if (selectedObject) canvas.setActiveObject(selectedObject);
      }

      canvas.requestRenderAll();
    }, [state]);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        // Ignore when typing in form fields or contenteditable
        if (isFormElement(e.target)) return;

        if (!fabricCanvasRef.current) return;

        const activeObject = fabricCanvasRef.current.getActiveObject();

        // Ignore when editing text within a Fabric Textbox
        if (activeObject && (activeObject as any).isEditing === true) {
          return;
        }

        // Only act if there is an active object selected on canvas
        if (!activeObject) return;

        const step = e.shiftKey ? 10 : 1;

        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            activeObject.set("left", (activeObject.left || 0) - step);
            break;
          case "ArrowRight":
            e.preventDefault();
            activeObject.set("left", (activeObject.left || 0) + step);
            break;
          case "ArrowUp":
            e.preventDefault();
            activeObject.set("top", (activeObject.top || 0) - step);
            break;
          case "ArrowDown":
            e.preventDefault();
            activeObject.set("top", (activeObject.top || 0) + step);
            break;
          case "Delete":
          case "Backspace":
            // Only delete if not typing inside inputs and not editing text
            e.preventDefault();
            fabricCanvasRef.current.remove(activeObject);
            onSelectionChange(undefined);
            break;
          default:
            return; // do nothing for other keys
        }

        fabricCanvasRef.current.requestRenderAll();
        // Commit state after keyboard move
        const newState = getCanvasState(fabricCanvasRef.current);
        onStateChange(newState);
      },
      [onStateChange, onSelectionChange]
    );

    useEffect(() => {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [handleKeyDown]);

    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className={`canvas-container ${
            state.backgroundImage ? "has-image" : ""
          }`}
        >
          <canvas
            ref={canvasRef}
            id="canvas"
            /* Avoid CSS scaling; size is controlled in code */
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>
    );
  }
);

Canvas.displayName = "Canvas";

export default Canvas;
