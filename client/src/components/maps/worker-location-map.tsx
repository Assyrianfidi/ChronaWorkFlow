import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, Navigation, Clock } from "lucide-react";

interface WorkerLocationData {
  workerId: string;
  workerName: string;
  latitude: number;
  longitude: number;
  clockInTime: string;
  clockOutTime?: string;
  projectName?: string;
  isActive: boolean;
}

interface WorkerLocationMapProps {
  locations: WorkerLocationData[];
  center?: [number, number];
  zoom?: number;
}

export default function WorkerLocationMap({ 
  locations, 
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13 
}: WorkerLocationMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<WorkerLocationData | null>(null);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const openInGoogleMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}&t=m&z=15&marker=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const getDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (locations.length === 0) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Location Data</h3>
          <p className="text-sm text-gray-500 max-w-md">
            Worker locations will appear here once they clock in with GPS enabled. 
            Make sure workers allow location access when scanning QR codes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Location List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-white pb-2">
          Worker Locations ({locations.length})
        </h3>
        
        {locations.map((location, index) => (
          <Card 
            key={`${location.workerId}-${index}`}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedLocation?.workerId === location.workerId && 
              selectedLocation?.clockInTime === location.clockInTime
                ? 'ring-2 ring-primary' 
                : ''
            }`}
            onClick={() => setSelectedLocation(location)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{location.workerName}</h4>
                  <p className="text-sm text-gray-600">
                    {formatDate(location.clockInTime)} at {formatTime(location.clockInTime)}
                  </p>
                </div>
                <Badge 
                  variant={location.isActive ? "default" : "secondary"}
                  className={location.isActive ? "bg-green-600" : "bg-gray-600"}
                >
                  {location.isActive ? 'Active' : 'Completed'}
                </Badge>
              </div>
              
              {location.projectName && (
                <div className="mb-3">
                  <p className="text-sm">
                    <span className="text-gray-600">Project:</span> {location.projectName}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
                {location.clockOutTime && (
                  <span>
                    <Clock className="h-4 w-4 inline mr-1" />
                    Out: {formatTime(location.clockOutTime)}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    openInGoogleMaps(location.latitude, location.longitude, location.workerName);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View on Map
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    getDirections(location.latitude, location.longitude);
                  }}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Directions
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Map View - Embedded Google Maps */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Map View</h3>
        
        {selectedLocation ? (
          <div className="h-full min-h-[400px]">
            <iframe
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: '8px' }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'demo'}&q=${selectedLocation.latitude},${selectedLocation.longitude}&zoom=15`}
              title={`Map for ${selectedLocation.workerName}`}
            ></iframe>
            
            <Card className="mt-4">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Selected Location Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Worker:</strong> {selectedLocation.workerName}</p>
                  <p><strong>Clock In:</strong> {formatDate(selectedLocation.clockInTime)} at {formatTime(selectedLocation.clockInTime)}</p>
                  {selectedLocation.clockOutTime && (
                    <p><strong>Clock Out:</strong> {formatTime(selectedLocation.clockOutTime)}</p>
                  )}
                  {selectedLocation.projectName && (
                    <p><strong>Project:</strong> {selectedLocation.projectName}</p>
                  )}
                  <p><strong>Coordinates:</strong> {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}</p>
                  <p><strong>Status:</strong> 
                    <Badge 
                      variant={selectedLocation.isActive ? "default" : "secondary"}
                      className={`ml-2 ${selectedLocation.isActive ? "bg-green-600" : "bg-gray-600"}`}
                    >
                      {selectedLocation.isActive ? 'Currently Active' : 'Clocked Out'}
                    </Badge>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600">Select a location from the list to view on map</p>
            </div>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="font-medium">Quick Actions</h4>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (locations.length > 0) {
                  const bounds = locations.map(l => `${l.latitude},${l.longitude}`).join('|');
                  const url = `https://www.google.com/maps?q=${bounds}`;
                  window.open(url, '_blank');
                }
              }}
            >
              View All Locations
            </Button>
            {locations.some(l => l.isActive) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const activeLocations = locations.filter(l => l.isActive);
                  if (activeLocations.length > 0) {
                    const bounds = activeLocations.map(l => `${l.latitude},${l.longitude}`).join('|');
                    const url = `https://www.google.com/maps?q=${bounds}`;
                    window.open(url, '_blank');
                  }
                }}
              >
                View Active Workers Only
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}