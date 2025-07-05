import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange?: (signature: string) => void;
  onConfirmSignature?: () => void;
  width?: number;
  height?: number;
  showConfirmButton?: boolean;
}

export function SignaturePad({
  onSignatureChange,
  onConfirmSignature,
  width = 400,
  height = 200,
  showConfirmButton = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePad, setSignaturePad] = useState<any>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showPopupConfirmation, setShowPopupConfirmation] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize signature pad with the provided JS code functionality
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set up drawing context
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Mouse events
    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const startDrawing = (e: MouseEvent) => {
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      setIsDrawing(true);
    };

    const draw = (e: MouseEvent) => {
      if (!drawing) return;

      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      lastX = currentX;
      lastY = currentY;

      // Update signature data
      setHasSignature(true);
      if (onSignatureChange) {
        onSignatureChange(canvas.toDataURL());
      }
    };

    const stopDrawing = () => {
      drawing = false;
      setIsDrawing(false);
    };

    // Touch events for mobile
    const startDrawingTouch = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      lastX = touch.clientX - rect.left;
      lastY = touch.clientY - rect.top;
      drawing = true;
      setIsDrawing(true);
    };

    const drawTouch = (e: TouchEvent) => {
      e.preventDefault();
      if (!drawing) return;

      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const currentX = touch.clientX - rect.left;
      const currentY = touch.clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      lastX = currentX;
      lastY = currentY;

      setHasSignature(true);
      if (onSignatureChange) {
        onSignatureChange(canvas.toDataURL());
      }
    };

    const stopDrawingTouch = (e: TouchEvent) => {
      e.preventDefault();
      drawing = false;
      setIsDrawing(false);
    };

    // Add event listeners
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    canvas.addEventListener("touchstart", startDrawingTouch);
    canvas.addEventListener("touchmove", drawTouch);
    canvas.addEventListener("touchend", stopDrawingTouch);

    // Store pad reference for clearing
    setSignaturePad({
      clear: () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        setIsConfirmed(false);
        if (onSignatureChange) {
          onSignatureChange("");
        }
      },
      isEmpty: () => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return !imageData.data.some(
          (channel, i) => i % 4 !== 3 && channel !== 0,
        );
      },
      toDataURL: () => canvas.toDataURL(),
    });

    // Cleanup
    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseout", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawingTouch);
      canvas.removeEventListener("touchmove", drawTouch);
      canvas.removeEventListener("touchend", stopDrawingTouch);
    };
  }, [width, height, onSignatureChange]);

  const handleClear = () => {
    if (signaturePad) {
      signaturePad.clear();
    }
  };

  const handleConfirm = () => {
    if (hasSignature && !isConfirmed) {
      setIsConfirmed(true);
      setShowPopupConfirmation(true);

      // Hide popup after 2 seconds
      setTimeout(() => {
        setShowPopupConfirmation(false);
      }, 2000);

      if (onConfirmSignature) {
        onConfirmSignature();
      }
    }
  };

  const handleReject = () => {
    setIsConfirmed(false);
    handleClear();
  };

  return (
    <Card className="w-fit relative">
      <CardHeader>
        <CardTitle className="text-sm">Digital Signature</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Please sign below:</Label>
          <div className="border border-gray-300 rounded-md">
            <canvas
              ref={canvasRef}
              className="cursor-crosshair rounded-md"
              style={{
                width: width,
                height: height,
                touchAction: "none",
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isConfirmed}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>

            {showConfirmButton && hasSignature && !isConfirmed && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleConfirm}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Confirm & Submit
              </Button>
            )}

            {isConfirmed && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-sm text-green-600">
                  <Check className="w-4 h-4 mr-1" />
                  Signature Confirmed
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  className="text-red-600"
                >
                  <X className="h-3 w-3 mr-1" />
                  Redo
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isDrawing && (
              <div className="flex items-center text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                Signing...
              </div>
            )}

            {hasSignature && !isDrawing && !isConfirmed && (
              <div className="text-sm text-gray-600">Signature captured</div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Popup Confirmation Overlay */}
      {showPopupConfirmation && (
        <div className="absolute inset-0 bg-green-600 bg-opacity-90 flex items-center justify-center rounded-lg z-50">
          <div className="text-center text-white">
            <div className="mx-auto mb-2">
              <Check className="h-12 w-12 mx-auto animate-bounce" />
            </div>
            <div className="text-lg font-semibold">Done!</div>
            <div className="text-sm">Signature submitted successfully</div>
          </div>
        </div>
      )}
    </Card>
  );
}
