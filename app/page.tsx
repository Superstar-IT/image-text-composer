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
import { saveToStorage, loadFromStorage, clearStorage } from "@/utils/storage";
import Canvas, { CanvasRef } from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
import LayersPanel from "@/components/LayersPanel";
import PropertiesPanel from "@/components/PropertiesPanel";

const INITIAL_STATE: CanvasState = {
  layers: [],
  selectedLayerId: undefined,
};

export default function Home() {
  const [history, setHistory] = useState<HistoryState>(() => {
    const stored = loadFromStorage();
    return createHistoryState(stored || INITIAL_STATE);
  });

  const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>();
  const canvasRef = useRef<CanvasRef>(null);

  const currentState = history.present;
  const historyInfo = getHistoryInfo(history);
  // Autosave on state changes
  useEffect(() => {
    saveToStorage(currentState);
  }, [currentState]);

  // Handle state changes
  const handleStateChange = useCallback((newState: CanvasState) => {
    setHistory((prev) => pushToHistory(prev, newState));
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const newState: CanvasState = {
            ...currentState,
            backgroundImage: {
              src: e.target?.result as string,
              width: img.width,
              height: img.height,
            },
          };
          handleStateChange(newState);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [currentState, handleStateChange]
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
        "Are you sure you want to reset the canvas? This will clear all layers and the background image."
      )
    ) {
      clearStorage();
      setHistory(createHistoryState(INITIAL_STATE));
      setSelectedLayerId(undefined);
    }
  }, []);

  // Get selected layer
  const selectedLayer = currentState.layers.find(
    (layer) => layer.id === selectedLayerId
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex flex-col">
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
          />

          {/* Center - Canvas */}
          <div className="flex-1 flex flex-col">
            <Canvas
              ref={canvasRef}
              state={currentState}
              onStateChange={handleStateChange}
              onSelectionChange={setSelectedLayerId}
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
