'use client';

import { ChevronUp, ChevronDown, Eye, EyeOff, Lock, Unlock, Trash2 } from 'lucide-react';
import { TextLayer } from '@/types';

interface LayersPanelProps {
  layers: TextLayer[];
  selectedLayerId?: string;
  onLayerSelect: (layerId: string) => void;
  onLayerMove: (layerId: string, direction: 'up' | 'down') => void;
  onLayerToggleVisibility: (layerId: string) => void;
  onLayerToggleLock: (layerId: string) => void;
  onLayerDelete: (layerId: string) => void;
}

export default function LayersPanel({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerMove,
  onLayerToggleVisibility,
  onLayerToggleLock,
  onLayerDelete,
}: LayersPanelProps) {
  return (
    <div className="panel w-80 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Layers</h3>
        <p className="text-sm text-gray-500 mt-1">
          {layers.length} layer{layers.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No layers yet</p>
            <p className="text-sm">Add text to get started</p>
          </div>
        ) : (
          <div className="p-2">
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                className={`layer-item p-3 rounded-md border cursor-pointer mb-2 ${
                  selectedLayerId === layer.id
                    ? 'selected border-blue-500'
                    : 'border-gray-200'
                }`}
                onClick={() => onLayerSelect(layer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerToggleVisibility(layer.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title={layer.visible ? 'Hide layer' : 'Show layer'}
                      >
                        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerToggleLock(layer.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                      >
                        {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>

                      <span className="text-sm font-medium text-gray-900 truncate">
                        {layer.text || 'Empty text'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1">
                      {layer.fontFamily} • {layer.fontSize}px • {layer.fontWeight}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerMove(layer.id, 'up');
                      }}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerMove(layer.id, 'down');
                      }}
                      disabled={index === layers.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerDelete(layer.id);
                      }}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Delete layer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}






