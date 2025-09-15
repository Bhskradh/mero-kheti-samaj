import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Check } from "lucide-react";

interface LocationSelectorProps {
  currentLocation: string;
  onLocationChange: (location: string) => void;
}

const nepalCities = [
  'Kathmandu', 'Pokhara', 'Chitwan', 'Biratnagar', 'Birgunj', 'Dharan',
  'Butwal', 'Janakpur', 'Nepalgunj', 'Bharatpur', 'Hetauda', 'Dhangadhi',
  'Itahari', 'Tulsipur', 'Gorkha', 'Lumbini', 'Palpa', 'Syangja'
];

const LocationSelector = ({ currentLocation, onLocationChange }: LocationSelectorProps) => {
  const [selectedCity, setSelectedCity] = useState(currentLocation.split(',')[0]);

  const handleLocationUpdate = () => {
    onLocationChange(selectedCity);
  };

  return (
    <div className="flex items-center space-x-2">
      <Select value={selectedCity} onValueChange={setSelectedCity}>
        <SelectTrigger className="w-[180px]">
          <MapPin className="h-4 w-4 mr-2 text-primary" />
          <SelectValue placeholder="Select city" />
        </SelectTrigger>
        <SelectContent>
          {nepalCities.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedCity !== currentLocation.split(',')[0] && (
        <Button 
          size="sm" 
          onClick={handleLocationUpdate}
          className="px-3"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default LocationSelector;