import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, Check } from "lucide-react";

interface FullScreenSignaturePadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignatureSave: (signature: string) => void;
  title?: string;
}

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export function FullScreenSignaturePad({
  open,
  onOpenChange,
  onSignatureSave,
  title = "Add Signature",
}: FullScreenSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // Initialize canvas on open
  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;

      // Set canvas size to full viewport
      const updateCanvasSize = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.imageSmoothingEnabled = true;

          // Set white background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

          // Redraw all strokes
          redrawCanvas();
        }
      };

      updateCanvasSize();
      window.addEventListener("resize", updateCanvasSize);

      return () => {
        window.removeEventListener("resize", updateCanvasSize);
      };
    }
  }, [open, strokes]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // Redraw all strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();

      for (let i = 1; i < stroke.points.length; i++) {
        const prevPoint = stroke.points[i - 1];
        const currentPoint = stroke.points[i];

        // Use quadratic curves for smoother lines
        const midPoint = {
          x: (prevPoint.x + currentPoint.x) / 2,
          y: (prevPoint.y + currentPoint.y) / 2,
        };

        if (i === 1) {
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(midPoint.x, midPoint.y);
        } else {
          ctx.quadraticCurveTo(
            prevPoint.x,
            prevPoint.y,
            midPoint.x,
            midPoint.y,
          );
        }
      }

      // Draw the last point
      const lastPoint = stroke.points[stroke.points.length - 1];
      const secondLastPoint = stroke.points[stroke.points.length - 2];
      if (secondLastPoint) {
        ctx.quadraticCurveTo(
          secondLastPoint.x,
          secondLastPoint.y,
          lastPoint.x,
          lastPoint.y,
        );
      }

      ctx.stroke();
    });
  }, [strokes]);

  const getCoordinates = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;

      if ("touches" in event) {
        const touch = event.touches[0] || event.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [],
  );

  const startDrawing = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      const point = getCoordinates(event);

      setIsDrawing(true);
      setHasSignature(true);
      setLastPoint(point);

      const newStroke: Stroke = {
        points: [point],
        color: "#000000",
        width: 3,
      };

      setCurrentStroke(newStroke);
    },
    [getCoordinates],
  );

  const draw = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      if (!isDrawing || !currentStroke || !lastPoint) return;

      const point = getCoordinates(event);

      // Calculate distance to control smoothness
      const distance = Math.sqrt(
        Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2),
      );

      // Only add point if moved enough distance for smoother lines
      if (distance > 2) {
        const updatedStroke = {
          ...currentStroke,
          points: [...currentStroke.points, point],
        };

        setCurrentStroke(updatedStroke);
        setLastPoint(point);

        // Draw the current stroke immediately for real-time feedback
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && currentStroke.points.length > 1) {
          ctx.strokeStyle = currentStroke.color;
          ctx.lineWidth = currentStroke.width;
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        }
      }
    },
    [isDrawing, currentStroke, lastPoint, getCoordinates],
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing && currentStroke) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
    setIsDrawing(false);
    setLastPoint(null);
  }, [isDrawing, currentStroke]);

  const clearSignature = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
    setHasSignature(false);
    setIsDrawing(false);
    setLastPoint(null);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }, []);

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    // Create a trimmed version of the signature
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Find signature bounds
    const imageData = canvas
      .getContext("2d")
      ?.getImageData(0, 0, canvas.width, canvas.height);
    if (!imageData) return;

    let minX = canvas.width,
      minY = canvas.height,
      maxX = 0,
      maxY = 0;
    let hasContent = false;

    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = 0; x < canvas.width; x += 4) {
        const index = (y * canvas.width + x) * 4;
        const alpha = imageData.data[index + 3];
        if (alpha > 0) {
          hasContent = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (!hasContent) return;

    // Add padding
    const padding = 20;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);

    const trimmedWidth = maxX - minX;
    const trimmedHeight = maxY - minY;

    tempCanvas.width = trimmedWidth;
    tempCanvas.height = trimmedHeight;

    // Fill with white background
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, trimmedWidth, trimmedHeight);

    // Copy the signature area
    tempCtx.drawImage(
      canvas,
      minX,
      minY,
      trimmedWidth,
      trimmedHeight,
      0,
      0,
      trimmedWidth,
      trimmedHeight,
    );

    const dataURL = tempCanvas.toDataURL("image/png", 0.8);
    onSignatureSave(dataURL);
    onOpenChange(false);
  }, [hasSignature, onSignatureSave, onOpenChange]);

  // Disable body scroll when signature pad is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair touch-none"
        style={{ touchAction: "none" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-t shadow-sm">
        <div className="flex items-center justify-center gap-4 p-6">
          <Button
            variant="outline"
            onClick={clearSignature}
            disabled={!hasSignature}
            className="min-w-[120px]"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button
            onClick={saveSignature}
            disabled={!hasSignature}
            className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Save Signature
          </Button>
        </div>

        <p className="text-sm text-gray-500 text-center pb-4">
          Sign above with your finger or stylus
        </p>
      </div>
    </div>
  );
}
