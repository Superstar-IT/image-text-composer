"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TextLayer, Alignment, FontWeight } from "@/types";
import { GOOGLE_FONTS } from "@/utils/fonts";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONT_API_KEY;

interface PropertiesPanelProps {
  layer?: TextLayer;
  onLayerUpdate: (updates: Partial<TextLayer>) => void;
}

export default function PropertiesPanel({
  layer,
  onLayerUpdate,
}: PropertiesPanelProps) {
  const textDebounceRef = useRef<number | null>(null);
  const [textValue, setTextValue] = useState("");
  const [fontSizeValue, setFontSizeValue] = useState("");
  const [fontFamilies, setFontFamilies] = useState<string[] | null>(null);
  const [fontWeights, setFontWeights] = useState<Record<string, string[]>>({});

  // Fetch Google Fonts List
  const fetchFonts = async () => {
    fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}`)
      .then((response) => response.json())
      .then((data) => {
        const families: string[] = [];
        const weights: Record<string, string[]> = {};
        data.items.forEach((font: any) => {
          families.push(font.family);
          if (!weights[font.family]) {
            weights[font.family] = [];
          }
          const values = new Set(weights[font.family]);
          if (Array.isArray(font.variants)) {
            font.variants.forEach((variant: string) => {
              if (variant === "regular") {
                values.add("400");
              } else {
                const numbers = variant.match(/\d+/g);
                if (numbers) {
                  numbers.forEach((value) => values.add(value));
                }
              }
            });
          } else if (!values.has("400")) {
            values.add("400");
          }
          weights[font.family] = [...values].sort(
            (a, b) => Number(a) - Number(b)
          );
        });
        setFontFamilies(families);
        setFontWeights(weights);
      })
      .catch((error) => console.error("Error fetching fonts:", error));
  };

  const weightOptions = useMemo(
    () => fontWeights[layer?.fontFamily || ""] || ["400"],
    [fontWeights, layer?.fontFamily]
  );

  useEffect(() => {
    fetchFonts();
  }, []);

  useEffect(() => {
    if (layer) {
      setTextValue(layer.text);
      setFontSizeValue(String(layer.fontSize));
    }
  }, [layer?.id, layer?.text, layer?.fontSize]);

  if (!layer) {
    return (
      <div className="panel w-80 h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Select a layer to edit properties</p>
        </div>
      </div>
    );
  }

  const debounceUpdate = (updates: Partial<TextLayer>, delay = 120) => {
    if (textDebounceRef.current) {
      window.clearTimeout(textDebounceRef.current);
    }
    textDebounceRef.current = window.setTimeout(() => {
      onLayerUpdate({ ...updates, id: layer.id });
    }, delay);
  };

  const commitFontSize = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "") return; // ignore empty until blur
    const parsed = parseInt(trimmed, 10);
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(1, Math.min(200, parsed));
      debounceUpdate({ fontSize: clamped });
      setFontSizeValue(String(clamped));
    }
  };

  return (
    <div className="panel w-80 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
        <p className="text-sm text-gray-500 mt-1">Text Layer Settings</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Text Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Content
          </label>
          <textarea
            value={textValue}
            onChange={(e) => {
              setTextValue(e.target.value);
              debounceUpdate({ text: e.target.value });
            }}
            className="input h-20 resize-none"
            placeholder="Enter text..."
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Family
          </label>
          <select
            value={layer.fontFamily}
            onChange={(e) =>
              onLayerUpdate({ fontFamily: e.target.value, id: layer.id })
            }
            className="input"
          >
            {fontFamilies
              ? fontFamilies.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))
              : GOOGLE_FONTS.map((font) => (
                  <option key={font.family} value={font.family}>
                    {font.displayName}
                  </option>
                ))}
          </select>
        </div>

        {/* Font Size and Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <input
              type="number"
              value={fontSizeValue}
              onChange={(e) => {
                commitFontSize(e.target.value);
              }}
              onBlur={() => {
                if (fontSizeValue.trim() === "") {
                  const fallback = String(
                    Math.max(1, Math.min(200, layer.fontSize))
                  );
                  setFontSizeValue(fallback);
                } else {
                  commitFontSize(fontSizeValue);
                }
              }}
              className="input"
              min="1"
              max="200"
              step="1"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Weight
            </label>
            <select
              value={layer.fontWeight}
              onChange={(e) =>
                onLayerUpdate({
                  fontWeight: e.target.value as FontWeight,
                  id: layer.id,
                })
              }
              className="input"
            >
              {weightOptions.map((weight) => (
                <option key={weight} value={weight}>
                  {weight}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Color and Opacity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <input
              type="color"
              value={layer.color}
              onChange={(e) =>
                onLayerUpdate({ color: e.target.value, id: layer.id })
              }
              className="input h-10 p-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opacity
            </label>
            <input
              type="range"
              value={layer.opacity}
              onChange={(e) =>
                onLayerUpdate({ opacity: Number(e.target.value), id: layer.id })
              }
              className="w-full"
              min="0"
              max="1"
              step="0.1"
            />
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(layer.opacity * 100)}%
            </div>
          </div>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Alignment
          </label>
          <div className="flex gap-2">
            {(["left", "center", "right"] as Alignment[]).map((alignment) => (
              <button
                key={alignment}
                onClick={() =>
                  onLayerUpdate({ textAlign: alignment, id: layer.id })
                }
                className={`flex-1 py-2 px-3 rounded border text-sm font-medium ${
                  layer.textAlign === alignment
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {alignment.charAt(0).toUpperCase() + alignment.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Line Height and Letter Spacing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Line Height
            </label>
            <input
              type="range"
              value={layer.lineHeight}
              onChange={(e) =>
                onLayerUpdate({
                  lineHeight: Number(e.target.value),
                  id: layer.id,
                })
              }
              className="w-full"
              min="0.5"
              max="3"
              step="0.1"
            />
            <div className="text-xs text-gray-500 mt-1">
              {layer.lineHeight.toFixed(1)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Letter Spacing
            </label>
            <input
              type="range"
              value={layer.letterSpacing}
              onChange={(e) =>
                onLayerUpdate({
                  letterSpacing: Number(e.target.value),
                  id: layer.id,
                })
              }
              className="w-full"
              min="-5"
              max="20"
              step="1"
            />
            <div className="text-xs text-gray-500 mt-1">
              {layer.letterSpacing}px
            </div>
          </div>
        </div>

        {/* Text Shadow */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Text Shadow
            </label>
            <button
              onClick={() => {
                if (layer.textShadow) {
                  onLayerUpdate({ textShadow: undefined, id: layer.id });
                } else {
                  onLayerUpdate({
                    textShadow: {
                      color: "#000000",
                      blur: 0,
                      offsetX: 0,
                      offsetY: 0,
                    },
                    id: layer.id,
                  });
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {layer.textShadow ? "Remove" : "Add"}
            </button>
          </div>

          {layer.textShadow && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={layer.textShadow.color}
                    onChange={(e) =>
                      onLayerUpdate({
                        textShadow: {
                          ...layer.textShadow!,
                          color: e.target.value,
                        },
                        id: layer.id,
                      })
                    }
                    className="input h-8 p-1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Blur
                  </label>
                  <input
                    type="range"
                    value={layer.textShadow.blur}
                    onChange={(e) =>
                      onLayerUpdate({
                        textShadow: {
                          ...layer.textShadow!,
                          blur: Number(e.target.value),
                        },
                        id: layer.id,
                      })
                    }
                    className="w-full"
                    min="0"
                    max="20"
                    step="1"
                  />
                </div>
              </div>
              {/* [Bug]: Clipping Group with shadows will result in the loss of the canvas background.
                https://github.com/fabricjs/fabric.js/issues/9527
              */}
              {/* <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Offset X
                  </label>
                  <input
                    type="range"
                    value={layer.textShadow.offsetX}
                    onChange={(e) =>
                      onLayerUpdate({
                        textShadow: { ...layer.textShadow!, offsetX: Number(e.target.value) },
                        id: layer.id
                      })
                    }
                    className="w-full"
                    min="-20"
                    max="20"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Offset Y
                  </label>
                  <input
                    type="range"
                    value={layer.textShadow.offsetY}
                    onChange={(e) =>
                      onLayerUpdate({
                        textShadow: { ...layer.textShadow!, offsetY: Number(e.target.value) },
                        id: layer.id
                      })
                    }
                    className="w-full"
                    min="-20"
                    max="20"
                    step="1"
                  />
                </div>
              </div> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
