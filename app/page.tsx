"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CanvasState, TextLayer, HistoryState } from "@/types";
import {
  createHistoryState,
  undo,
  redo,
  pushToHistory,
  getHistoryInfo,
} from "@/utils/history";
import { saveToStorage, loadFromStorage, clearStorage, getLastSaveTime } from "@/utils/storage";
import { resizeImage } from "@/utils/canvas";
import Canvas, { CanvasRef } from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
import LayersPanel from "@/components/LayersPanel";
import PropertiesPanel from "@/components/PropertiesPanel";

const INITIAL_STATE: CanvasState = {
  layers: [],
  selectedLayerId: undefined,
};

export default function Home() {
  const [history, setHistory] = useState<HistoryState>(() => createHistoryState(INITIAL_STATE));
  const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>();
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showRestoreNotification, setShowRestoreNotification] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [backgroundImageError, setBackgroundImageError] = useState<string | null>(null);
  const canvasRef = useRef<CanvasRef>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load data from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setHistory(createHistoryState(stored));
      if (stored.layers.length > 0 || stored.backgroundImage) {
        setShowRestoreNotification(true);
        // Hide notification after 3 seconds
        setTimeout(() => setShowRestoreNotification(false), 3000);
      }
    }
    // Set initial last save time
    setLastSaveTime(getLastSaveTime());
  }, []);

  const currentState = history.present;
  const historyInfo = getHistoryInfo(history);
  
  // Debounced autosave on state changes
  useEffect(() => {
    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    autosaveTimeoutRef.current = setTimeout(() => {
      setIsAutoSaving(true);
      saveToStorage(currentState);
      setLastSaveTime(new Date());
      // Hide the saving indicator after a short delay
      setTimeout(() => setIsAutoSaving(false), 500);
    }, 1000); // 1 second debounce

    // Cleanup timeout on unmount
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [currentState]);

  // Handle state changes
  const handleStateChange = useCallback((newState: CanvasState) => {
    setHistory((prev) => pushToHistory(prev, newState));
  }, []);

  // Handle background image loading error
  const handleBackgroundImageError = useCallback((error: string) => {
    setBackgroundImageError(error);
    // Clear the error after 5 seconds
    setTimeout(() => setBackgroundImageError(null), 5000);
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const originalSrc = e.target?.result as string;
        
        // Use the resize utility function
        resizeImage(originalSrc, 1920, 1080, 5 * 1024 * 1024)
          .then(({ src, width, height, wasResized }) => {
            if (wasResized) {
              console.log('Image was resized:', { 
                originalSize: originalSrc.length,
                finalSize: src.length,
                width, 
                height 
              });
            }
            
            const newState: CanvasState = {
              ...currentState,
              backgroundImage: {
                src,
                width,
                height,
              },
            };
            handleStateChange(newState);
            setBackgroundImageError(null); // Clear any previous errors
          })
          .catch((error) => {
            console.error('Failed to process image:', error);
            handleBackgroundImageError('Failed to process uploaded image');
          });
      };
      reader.readAsDataURL(file);
    },
    [currentState, handleStateChange, handleBackgroundImageError]
  );

  // Handle adding text layer
  const handleAddText = useCallback(() => {
    const newLayer: TextLayer = {
      id: `text-${Date.now()}`,
      text: "New Text",
      fontFamily: "Inter",
      fontSize: 24,
      fontWeight: "400",
      color: "#000000",
      opacity: 1,
      textAlign: "left",
      left: 100,
      top: 100,
      width: 260,
      height: 50,
      angle: 0,
      lineHeight: 1.2,
      letterSpacing: 0,
      scaleX: 1,
      scaleY: 1,
      locked: false,
      visible: true,
    };

    const newState: CanvasState = {
      ...currentState,
      layers: [...currentState.layers, newLayer],
      selectedLayerId: newLayer.id,
    };

    handleStateChange(newState);
    setSelectedLayerId(newLayer.id);
  }, [currentState, handleStateChange]);

  // Handle layer selection
  const handleLayerSelect = useCallback(
    (layerId: string | undefined) => {
      setSelectedLayerId(layerId);
      const newState: CanvasState = {
        ...currentState,
        selectedLayerId: layerId,
      };
      handleStateChange(newState);
    },
    [currentState, handleStateChange]
  );

  // Handle layer updates
  const handleLayerUpdate = useCallback(
    (updates: Partial<TextLayer>) => {
      if (!updates.id) return;
      const newState: CanvasState = {
        ...currentState,
        layers: currentState.layers.map((layer) =>
          layer.id === updates.id ? { ...layer, ...updates } : layer
        ),
        selectedLayerId: updates.id,
      };
      handleStateChange(newState);
    },
    [currentState, selectedLayerId, handleStateChange]
  );

  // Handle layer movement
  const handleLayerMove = useCallback(
    (layerId: string, direction: "up" | "down") => {
      const layerIndex = currentState.layers.findIndex(
        (layer) => layer.id === layerId
      );
      if (layerIndex === -1) return;

      const newLayers = [...currentState.layers];
      const targetIndex = direction === "up" ? layerIndex - 1 : layerIndex + 1;

      if (targetIndex >= 0 && targetIndex < newLayers.length) {
        [newLayers[layerIndex], newLayers[targetIndex]] = [
          newLayers[targetIndex],
          newLayers[layerIndex],
        ];

        const newState: CanvasState = {
          ...currentState,
          layers: newLayers,
        };
        handleStateChange(newState);
      }
    },
    [currentState, handleStateChange]
  );

  // Handle layer visibility toggle
  const handleLayerToggleVisibility = useCallback(
    (layerId: string) => {
      const newState: CanvasState = {
        ...currentState,
        layers: currentState.layers.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        ),
      };
      handleStateChange(newState);
    },
    [currentState, handleStateChange]
  );

  // Handle layer lock toggle
  const handleLayerToggleLock = useCallback(
    (layerId: string) => {
      const newState: CanvasState = {
        ...currentState,
        layers: currentState.layers.map((layer) =>
          layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
        ),
      };
      handleStateChange(newState);
    },
    [currentState, handleStateChange]
  );

  // Handle layer deletion
  const handleLayerDelete = useCallback(
    (layerId: string) => {
      const newState: CanvasState = {
        ...currentState,
        layers: currentState.layers.filter((layer) => layer.id !== layerId),
        selectedLayerId:
          currentState.selectedLayerId === layerId
            ? undefined
            : currentState.selectedLayerId,
      };
      handleStateChange(newState);
      if (selectedLayerId === layerId) {
        setSelectedLayerId(undefined);
      }
    },
    [currentState, selectedLayerId, handleStateChange]
  );

  // Handle layer duplication
  const handleLayerDuplicate = useCallback((layer: TextLayer) => {
    const newLayer: TextLayer = {
      ...layer,
      id: `text-${Date.now()}`,
    };
    const newState: CanvasState = {
      ...currentState,
      layers: [...currentState.layers, newLayer],
      selectedLayerId: newLayer.id,
    };

    handleStateChange(newState);
    setSelectedLayerId(newLayer.id);
  }, [currentState, handleStateChange])

  // Handle undo/redo
  const handleUndo = useCallback(() => {
    setHistory((prev) => undo(prev));
  }, []);

  const handleRedo = useCallback(() => {
    setHistory((prev) => redo(prev));
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    if (!currentState.backgroundImage) {
      alert("Please upload an image first");
      return;
    }

    const dataUrl = canvasRef.current?.export();
    if (dataUrl) {
      const link = document.createElement("a");
      link.download = `result-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [currentState.backgroundImage]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (
      confirm(
        "Are you sure you want to reset the canvas? This will clear all layers, the background image, and remove the autosaved data."
      )
    ) {
      clearStorage();
      setHistory(createHistoryState(INITIAL_STATE));
      setSelectedLayerId(undefined);
      setLastSaveTime(null);
    }
  }, []);

  // Get selected layer
  const selectedLayer = currentState.layers.find(
    (layer) => layer.id === selectedLayerId
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex flex-col">
        {/* Restore Notification */}
        {showRestoreNotification && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Design restored from your previous session
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setShowRestoreNotification(false)}
                    className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Background Image Error Notification */}
        {backgroundImageError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {backgroundImageError}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setBackgroundImageError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Image Text Composer
              </h1>
              <p className="text-sm text-gray-500">
                Add customizable text overlays to your PNG images
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>
                History: {historyInfo.pastSteps} / {historyInfo.totalSteps}
              </span>
              {lastSaveTime && (
                <span className="text-xs">
                  Last saved: {lastSaveTime.toLocaleTimeString()}
                </span>
              )}
              {isAutoSaving && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Auto-saving...</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <Toolbar
          onImageUpload={handleImageUpload}
          onAddText={handleAddText}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExport={handleExport}
          onReset={handleReset}
          canUndo={historyInfo.canUndo}
          canRedo={historyInfo.canRedo}
          hasImage={!!currentState.backgroundImage}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Layers */}
          <LayersPanel
            layers={currentState.layers}
            selectedLayerId={selectedLayerId}
            onLayerSelect={handleLayerSelect}
            onLayerMove={handleLayerMove}
            onLayerToggleVisibility={handleLayerToggleVisibility}
            onLayerToggleLock={handleLayerToggleLock}
            onLayerDelete={handleLayerDelete}
            onLayerDuplicate={handleLayerDuplicate}
          />

          {/* Center - Canvas */}
          <div className="flex-1 flex flex-col">
            <Canvas
               ref={canvasRef}
               state={currentState}
               onStateChange={handleStateChange}
               onSelectionChange={setSelectedLayerId}
               onBackgroundImageError={handleBackgroundImageError}
               onUndo={handleUndo}
               onRedo={handleRedo}
             />
          </div>

          {/* Right Panel - Properties */}
          <PropertiesPanel
            layer={selectedLayer}
            onLayerUpdate={handleLayerUpdate}
          />
        </div>
      </div>
    </div>
  );
}
