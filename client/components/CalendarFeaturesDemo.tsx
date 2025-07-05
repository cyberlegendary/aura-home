import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MousePointerClick,
  Maximize2,
  Target,
  CheckCircle2,
} from "lucide-react";

export function CalendarFeaturesDemo() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Enhanced Calendar Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <MousePointerClick className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium">Month → Week Zoom</h4>
              <p className="text-sm text-gray-600">
                Click any day in month view to zoom into that week
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-green-600 mt-1" />
            <div>
              <h4 className="font-medium">Direct Job Click</h4>
              <p className="text-sm text-gray-600">
                Click jobs directly to view details (like double-click in list)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Maximize2 className="h-5 w-5 text-purple-600 mt-1" />
            <div>
              <h4 className="font-medium">Flexible Job Cards</h4>
              <p className="text-sm text-gray-600">
                Job cards stretch without table row constraints
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-red-600 mt-1" />
            <div>
              <h4 className="font-medium">Real-Time Indicator</h4>
              <p className="text-sm text-gray-600">
                Red line shows current day and exact time
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-orange-600 mt-1" />
            <div>
              <h4 className="font-medium">All Calendars Updated</h4>
              <p className="text-sm text-gray-600">
                Features work across staff, advanced, and job calendars
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Month View</Badge>
            <Badge variant="outline">Week View</Badge>
            <Badge variant="outline">Day View</Badge>
            <Badge variant="outline">Real-time Updates</Badge>
            <Badge variant="outline">Job Actions</Badge>
            <Badge variant="outline">Staff Filtering</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
