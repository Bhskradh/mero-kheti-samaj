import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: (location?: string) => void;
}

const nepalCities = [
  'Kathmandu', 'Pokhara', 'Chitwan', 'Biratnagar', 'Birgunj', 'Dharan',
  'Butwal', 'Janakpur', 'Nepalgunj', 'Bharatpur', 'Hetauda', 'Dhangadhi',
  'Itahari', 'Tulsipur', 'Gorkha', 'Lumbini', 'Palpa', 'Syangja'
];

const LocationModal = ({ isOpen, onClose }: LocationModalProps) => {
  const [selectedCity, setSelectedCity] = useState('');

  const handleSave = () => {
    if (selectedCity) {
      onClose(selectedCity);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Select Your Location
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose your city to get accurate weather information and farming tips.
          </p>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger>
              <SelectValue placeholder="Select your city" />
            </SelectTrigger>
            <SelectContent>
              {nepalCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onClose()}>
              Skip
            </Button>
            <Button onClick={handleSave} disabled={!selectedCity} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;