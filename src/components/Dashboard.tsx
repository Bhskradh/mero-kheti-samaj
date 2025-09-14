import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  MapPin
} from "lucide-react";
import heroImage from "@/assets/hero-farming.jpg";

const Dashboard = () => {
  const weatherData = {
    location: "Kathmandu, Nepal",
    temperature: 24,
    humidity: 65,
    windSpeed: 8,
    condition: "Partly Cloudy",
    forecast: "Light rain expected tomorrow"
  };

  const marketPrices = [
    { crop: "Rice", price: "₹85/kg", change: "+2.5%" },
    { crop: "Wheat", price: "₹45/kg", change: "-1.2%" },
    { crop: "Maize", price: "₹38/kg", change: "+3.8%" },
    { crop: "Potato", price: "₹32/kg", change: "+0.5%" }
  ];

  const todaysTips = [
    "Apply organic fertilizer to tomato plants",
    "Check for pest damage on cucumber leaves",
    "Prepare soil for winter wheat planting"
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
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              Kathmandu
            </Button>
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
            <CardTitle className="flex items-center text-lg">
              <Cloud className="h-5 w-5 mr-2 text-primary" />
              Weather Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{weatherData.temperature}°C</p>
                <p className="text-sm text-muted-foreground">{weatherData.condition}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{weatherData.location}</p>
                <p className="text-sm font-medium text-accent">{weatherData.forecast}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
              <div className="text-center">
                <Thermometer className="h-4 w-4 mx-auto mb-1 text-earth" />
                <p className="text-xs text-muted-foreground">Temperature</p>
                <p className="text-sm font-medium">{weatherData.temperature}°C</p>
              </div>
              <div className="text-center">
                <Droplets className="h-4 w-4 mx-auto mb-1 text-accent" />
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="text-sm font-medium">{weatherData.humidity}%</p>
              </div>
              <div className="text-center">
                <Wind className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Wind</p>
                <p className="text-sm font-medium">{weatherData.windSpeed} km/h</p>
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
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <Sprout className="h-6 w-6 text-primary" />
            <span className="text-xs">Crop Guide</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <Camera className="h-6 w-6 text-accent" />
            <span className="text-xs">Plant Doctor</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <TrendingUp className="h-6 w-6 text-earth" />
            <span className="text-xs">Market Prices</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="text-xs">Community</span>
          </Button>
        </div>

        {/* Market Prices */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="h-5 w-5 mr-2 text-earth" />
              Today's Market Prices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketPrices.map((item, index) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;