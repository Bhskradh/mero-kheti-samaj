import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Cloud, 
  Thermometer, 
  Droplets, 
  Wind,
  Sprout,
  TrendingUp,
  MessageCircle,
  Camera,
  Calendar,
  MapPin,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import heroImage from "@/assets/hero-farming.jpg";
import LocationSelector from "./LocationSelector";
import CropGuide from "./CropGuide";
import PlantDoctor from "./PlantDoctor";
import Community from "./Community";

interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  forecast: string;
  lastUpdated: string;
}

interface MarketPrice {
  crop: string;
  price: string;
  unit: string;
  change: string;
}

interface MarketData {
  prices: MarketPrice[];
  lastUpdated: string;
  source: string;
}

const Dashboard = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [currentLocation, setCurrentLocation] = useState("Kathmandu");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [previousMarketData, setPreviousMarketData] = useState<MarketData | null>(null);
  const { toast } = useToast();
  const { 
    permission, 
    requestPermission, 
    sendWeatherAlert, 
    sendMarketPriceAlert,
    isSupported 
  } = useNotifications();

  const fetchWeatherData = async (city = currentLocation) => {
    setLoadingWeather(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { city }
      });

      if (error) throw error;
      
      setWeatherData(data);
      
      // Send weather alert if conditions warrant it
      sendWeatherAlert(data, city);
      
      toast({
        title: "Weather Updated",
        description: "Latest weather data loaded successfully",
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast({
        title: "Weather Error",
        description: "Could not fetch weather data",
        variant: "destructive",
      });
    } finally {
      setLoadingWeather(false);
    }
  };

  const fetchMarketData = async () => {
    setLoadingMarket(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-market-prices');

      if (error) throw error;
      
      // Send market price alert if there are significant changes
      if (marketData) {
        sendMarketPriceAlert(data.prices, marketData.prices);
      }
      
      setPreviousMarketData(marketData);
      setMarketData(data);
      toast({
        title: "Market Prices Updated",
        description: `${data.prices.length} prices loaded from ${data.source}`,
      });
    } catch (error) {
      console.error('Error fetching market data:', error);
      toast({
        title: "Market Data Error", 
        description: "Could not fetch market prices",
        variant: "destructive",
      });
    } finally {
      setLoadingMarket(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    fetchMarketData();
    
    // Auto-refresh data every 30 minutes
    const interval = setInterval(() => {
      fetchWeatherData();
      fetchMarketData();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLocationChange = (newLocation: string) => {
    setCurrentLocation(newLocation);
    fetchWeatherData(newLocation);
  };

  const openModal = (modalType: string) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const todaysTips = weatherData ? [
    weatherData.forecast,
    weatherData.temperature > 30 
      ? "High temperature - increase irrigation frequency"
      : "Moderate temperature - normal irrigation schedule",
    weatherData.humidity > 80
      ? "High humidity - monitor crops for fungal diseases"
      : "Good humidity levels for most crops"
  ] : [
    "Loading farming recommendations...",
    "Preparing daily tips based on weather",
    "Analyzing optimal farming conditions"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Sprout className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Agro-Guide</h1>
                <p className="text-sm text-muted-foreground">Smart Farming Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isSupported && permission !== 'granted' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={requestPermission}
                  className="text-xs"
                >
                  🔔 Enable Alerts
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchWeatherData()}
                disabled={loadingWeather}
              >
                {loadingWeather ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <LocationSelector 
                currentLocation={currentLocation}
                onLocationChange={handleLocationChange}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-8">
          <div className="text-center text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              नमस्कार, Farmer! 🌾
            </h2>
            <p className="text-primary-foreground/90 mb-4">
              Your smart farming companion for better harvests
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                Weather Updates
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                Crop Guidance
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                Market Prices
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Weather Card */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center">
                <Cloud className="h-5 w-5 mr-2 text-primary" />
                Weather Today
              </div>
              {loadingWeather && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {weatherData?.temperature || '--'}°C
                </p>
                <p className="text-sm text-muted-foreground">
                  {weatherData?.condition || 'Loading...'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {weatherData?.location || 'Kathmandu, Nepal'}
                </p>
                <p className="text-sm font-medium text-accent">
                  {weatherData?.description || 'Fetching forecast...'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
              <div className="text-center">
                <Thermometer className="h-4 w-4 mx-auto mb-1 text-earth" />
                <p className="text-xs text-muted-foreground">Temperature</p>
                <p className="text-sm font-medium">
                  {weatherData?.temperature || '--'}°C
                </p>
              </div>
              <div className="text-center">
                <Droplets className="h-4 w-4 mx-auto mb-1 text-accent" />
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="text-sm font-medium">
                  {weatherData?.humidity || '--'}%
                </p>
              </div>
              <div className="text-center">
                <Wind className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Wind</p>
                <p className="text-sm font-medium">
                  {weatherData?.windSpeed || '--'} km/h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Tips */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Calendar className="h-5 w-5 mr-2 text-accent" />
              Today's Farming Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {todaysTips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-foreground">{tip}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => openModal('crop-guide')}
          >
            <Sprout className="h-6 w-6 text-primary" />
            <span className="text-xs">Crop Guide</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => openModal('plant-doctor')}
          >
            <Camera className="h-6 w-6 text-accent" />
            <span className="text-xs">Plant Doctor</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => openModal('market-prices')}
          >
            <TrendingUp className="h-6 w-6 text-earth" />
            <span className="text-xs">Market Prices</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => openModal('community')}
          >
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="text-xs">Community</span>
          </Button>
        </div>

        {/* Market Prices */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-earth" />
                Market Prices - Kalimati
              </div>
              <div className="flex items-center space-x-2">
                {loadingMarket && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={fetchMarketData}
                  disabled={loadingMarket}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
            {marketData?.source && (
              <p className="text-xs text-muted-foreground">
                Source: {marketData.source} • Updated: {
                  marketData.lastUpdated ? 
                  new Date(marketData.lastUpdated).toLocaleTimeString() : 
                  'Loading...'
                }
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketData?.prices?.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="font-medium text-foreground">{item.crop}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{item.price}</p>
                    <p className={`text-xs ${item.change.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                      {item.change}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading market prices...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <Dialog open={activeModal === 'crop-guide'} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crop Guide</DialogTitle>
          </DialogHeader>
          <CropGuide />
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'plant-doctor'} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plant Doctor</DialogTitle>
          </DialogHeader>
          <PlantDoctor />
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'community'} onOpenChange={closeModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Farming Community</DialogTitle>
          </DialogHeader>
          <Community />
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'market-prices'} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Market Prices - Kalimati</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[80vh]">
            <iframe 
              src="https://nepalicalendar.rat32.com/vegetable/embed.php"
              className="w-full h-full"
              frameBorder="0"
              scrolling="yes"
              style={{ border: 'none', borderRadius: '8px' }}
            />
          </div>
        </DialogContent>
      </Dialog>
              <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="font-medium text-foreground">{item.crop}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{item.price}</p>
                  <p className={`text-xs ${item.change.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                    {item.change}
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading market prices...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;