import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const emojiCategories = {
  Status: ["✅", "❌", "⚠️", "🔄", "⏳", "✨", "🎯", "📌"],
  Tools: ["🔧", "🔨", "⚡", "💧", "🚿", "🔩", "⚙️", "🛠️"],
  Reactions: ["👍", "👎", "👌", "💪", "🤝", "🙏", "😊", "😎"],
  Weather: ["☀️", "🌧️", "⛈️", "❄️", "🌤️", "🌪️", "🌈", "⭐"],
  Transport: ["🚗", "🚛", "⏰", "📍", "🗺️", "🚦", "⛽", "🅿️"],
  Communication: ["📞", "📱", "💬", "📧", "📝", "💭", "🔔", "📢"],
};

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState("Status");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1">
            {Object.keys(emojiCategories).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-8 gap-2">
            {emojiCategories[
              selectedCategory as keyof typeof emojiCategories
            ].map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => onEmojiSelect(emoji)}
                className="text-lg hover:bg-gray-100 p-2 h-10 w-10"
              >
                {emoji}
              </Button>
            ))}
          </div>

          {/* Quick Access Common Emojis */}
          <div className="border-t pt-3">
            <p className="text-xs text-gray-600 mb-2">Quick Access:</p>
            <div className="flex gap-1">
              {["✅", "❌", "🔧", "👍", "📞", "⚠️"].map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => onEmojiSelect(emoji)}
                  className="text-base p-2 h-8 w-8"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
