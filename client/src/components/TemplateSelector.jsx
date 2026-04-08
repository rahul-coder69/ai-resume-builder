import { useState } from "react";
import { Check, Layout } from "lucide-react";

const TemplateSelector = ({
  selectedTemplate,
  onChange,
  accentColor = "#3b82f6",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toRgba = (hex, alpha) => {
    if (!hex?.startsWith("#")) return `rgba(59,130,246,${alpha})`;
    let parsed = hex.slice(1);
    if (parsed.length === 3) {
      parsed = parsed
        .split("")
        .map((ch) => ch + ch)
        .join("");
    }
    if (parsed.length !== 6) return `rgba(59,130,246,${alpha})`;
    const value = Number.parseInt(parsed, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const templates = [
    {
      id: "classic",
      name: "Classic",
      preview:
        "A clean, traditional resume format with clear sections and professional typography",
    },
    {
      id: "modern",
      name: "Modern",
      preview:
        "A sleek, contemporary resume format with a focus on design and layout",
    },
    {
      id: "minimal",
      name: "Minimal",
      preview:
        "A clean, simple resume format with a focus on readability and whitespace",
    },
    {
      id: "minimal-image",
      name: "Minimal Image",
      preview:
        "A minimalist layout with a dedicated profile photo section for visual impact",
    },
  ];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 p-2 rounded-lg text-sm border transition-all"
        style={{
          color: accentColor,
          borderColor: toRgba(accentColor, 0.35),
          backgroundColor: isOpen ? toRgba(accentColor, 0.08) : "transparent",
        }}
      >
        <Layout size={20} /> <span className="max-sm:hidden">Template</span>
      </button>
      {isOpen && (
        <div className="absolute top-full w-xs p-3 mt-2 space-y-3 z-10 bg-white rounded-md border border-gray-200 shadow-sm">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => {
                onChange(template.id);
                setIsOpen(false);
              }}
              className={`relative p-3 border rounded-md cursor-pointer transition-all ${selectedTemplate === template.id ? "" : "border-gray-300 hover:border-gray-400 hover:bg-gray-100"}`}
              style={
                selectedTemplate === template.id
                  ? {
                      borderColor: accentColor,
                      backgroundColor: toRgba(accentColor, 0.12),
                    }
                  : undefined
              }
            >
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2">
                  <div
                    className="size-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <h4 className="font-medium text-gray-800">{template.name}</h4>
                <div
                  className="mt-2 p-2 rounded text-xs text-gray-500 italic"
                  style={{ backgroundColor: toRgba(accentColor, 0.08) }}
                >
                  {template.preview}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
