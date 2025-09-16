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
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import heroImage from "@/assets/hero-farming.jpg";
import LocationSelector from "./LocationSelector";
import LocationModal from "./LocationModal";
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

interface Task {
  id: string;
  title: string;
  completed: boolean;
  user_name?: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [currentLocation, setCurrentLocation] = useState(() => {
    return localStorage.getItem('user_location') || '';
  });
  const [showLocationModal, setShowLocationModal] = useState(!currentLocation);
  const [showCropGuide, setShowCropGuide] = useState(false);
  const [showPlantDoctor, setShowPlantDoctor] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showMarketPrices, setShowMarketPrices] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const { toast } = useToast();
  const { requestPermission, sendNotification } = useNotifications();
  const navigate = useNavigate();

  // Auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Initialize app and request permissions
  useEffect(() => {
    if (!user || !currentLocation) return;

    const initializeApp = async () => {
      await requestPermission();
      await fetchWeatherData();
      await fetchMarketData();
      await fetchTasks();
    };

    initializeApp();

    // Auto-refresh data every 30 minutes
    const interval = setInterval(async () => {
      await fetchWeatherData();
      await fetchMarketData();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, currentLocation]);

  const fetchWeatherData = async () => {
    if (!currentLocation) return;
    
    setLoadingWeather(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { location: currentLocation }
      });
      
      if (error) throw error;
      if (data) {
        const prevTemp = weatherData?.temperature;
        setWeatherData(data);
        
        // Send notification for significant temperature changes
        if (prevTemp && Math.abs(data.temperature - prevTemp) >= 5) {
          sendNotification({
            title: 'Weather Alert',
            body: `Temperature changed significantly in ${currentLocation}: ${data.temperature}°C`
          });
        }
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast({ title: "Error", description: "Failed to fetch weather data", variant: "destructive" });
    } finally {
      setLoadingWeather(false);
    }
  };

  const fetchMarketData = async () => {
    setLoadingMarket(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-market-prices');
      
      if (error) throw error;
      if (data) {
        const prevData = marketData;
        setMarketData(data);
        
        // Send notification for significant price changes
        if (prevData && data.prices.length > 0) {
          const significantChanges = data.prices.filter(price => {
            const prevPrice = prevData.prices.find(p => p.crop === price.crop);
            return prevPrice && price.change.includes('+') && parseFloat(price.change) > 10;
          });
          
          if (significantChanges.length > 0) {
            sendNotification({
              title: 'Market Alert',
              body: `Significant price increases detected for ${significantChanges.map(p => p.crop).join(', ')}`
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      toast({ title: "Error", description: "Failed to fetch market prices", variant: "destructive" });
    } finally {
      setLoadingMarket(false);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({ title: "Error", description: "Failed to fetch tasks", variant: "destructive" });
    }
  };

  const addTask = async () => {
    if (!newTask.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          title: newTask.trim(),
          user_name: 'You',
          user_id: user.id,
          completed: false
        }])
        .select();
      
      if (error) throw error;
      setTasks([...tasks, ...(data || [])]);
      setNewTask("");
      toast({ title: "Success", description: "Task added successfully!" });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      console.error('Error toggling task:', error);
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleLocationChange = (newLocation: string) => {
    setCurrentLocation(newLocation);
    localStorage.setItem('user_location', newLocation);
    fetchWeatherData();
  };

  const handleLocationModalClose = (location?: string) => {
    if (location) {
      setCurrentLocation(location);
      localStorage.setItem('user_location', location);
    } else {
      setCurrentLocation('Kathmandu');
      localStorage.setItem('user_location', 'Kathmandu');
    }
    setShowLocationModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleRefresh = async () => {
    await Promise.all([fetchWeatherData(), fetchMarketData()]);
    toast({ title: "Success", description: "Data refreshed successfully!" });
  };

  const getFarmingTips = (weather: WeatherData | null): string[] => {
    if (!weather) return ["Loading farming tips..."];
    
    const tips: string[] = [];
    
    if (weather.temperature > 30) {
      tips.push("🌡️ High temperature detected - ensure adequate irrigation");
      tips.push("🌳 Provide shade for sensitive crops");
    } else if (weather.temperature < 10) {
      tips.push("❄️ Cool weather - protect crops from frost");
      tips.push("🏠 Consider greenhouse cultivation");
    }
    
    if (weather.humidity > 80) {
      tips.push("💧 High humidity - watch for fungal diseases");
      tips.push("🌬️ Ensure good air circulation");
    } else if (weather.humidity < 40) {
      tips.push("🏜️ Low humidity - increase watering frequency");
    }
    
    if (weather.condition.toLowerCase().includes('rain')) {
      tips.push("🌧️ Rainy conditions - check drainage systems");
      tips.push("🛡️ Apply fungicide if necessary");
    } else if (weather.condition.toLowerCase().includes('sunny')) {
      tips.push("☀️ Sunny weather - perfect for harvesting");
      tips.push("💦 Monitor soil moisture levels");
    }
    
    if (tips.length === 0) {
      tips.push("🌱 Great weather for farming activities!");
      tips.push("📋 Good time to plan your next planting cycle");
    }
    
    return tips;
  }

  const todaysTips = loadingWeather
    ? ["Loading farming tips for selected location..."]
    : getFarmingTips(weatherData);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <LocationModal 
        isOpen={showLocationModal} 
        onClose={handleLocationModalClose} 
      />
      
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Sprout className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Agro-Guide</h1>
                <p className="text-sm text-muted-foreground">Smart Farming Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LocationSelector 
                currentLocation={currentLocation}
                onLocationChange={handleLocationChange}
              />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Farming landscape" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-foreground mb-2">Smart Farming for Nepal</h2>
            <p className="text-lg text-muted-foreground">Real-time weather, market prices, and farming insights</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary/5"
            onClick={() => setShowCropGuide(true)}
          >
            <Sprout className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Crop Guide</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary/5"
            onClick={() => setShowPlantDoctor(true)}
          >
            <Camera className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Plant Doctor</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary/5"
            onClick={() => setShowMarketPrices(true)}
          >
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Market Prices</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary/5"
            onClick={() => setShowCommunity(true)}
          >
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Community</span>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Weather Card */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weather Conditions</CardTitle>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={loadingWeather}
                >
                  {loadingWeather ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
                <Cloud className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingWeather ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              ) : weatherData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{weatherData.temperature}°C</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{weatherData.condition}</div>
                      <div className="text-xs text-muted-foreground">{weatherData.location}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span>{weatherData.humidity}% Humidity</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wind className="h-4 w-4 text-gray-500" />
                      <span>{weatherData.windSpeed} km/h</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(weatherData.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No weather data available</div>
              )}
            </CardContent>
          </Card>

          {/* Market Prices Card */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Prices</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMarket ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              ) : marketData && marketData.prices.length > 0 ? (
                <div className="space-y-2">
                  {marketData.prices.slice(0, 4).map((price, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{price.crop}</span>
                      <div className="text-right">
                        <div>{price.price}</div>
                        <div className={`text-xs ${
                          price.change.includes('+') ? 'text-green-600' : 
                          price.change.includes('-') ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {price.change}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground pt-2">
                    Source: {marketData.source} • {new Date(marketData.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No market data available</div>
              )}
            </CardContent>
          </Card>

          {/* Tasks Card */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add a new task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    className="flex-1 px-3 py-2 text-sm border rounded-md border-input bg-background"
                  />
                  <Button size="sm" onClick={addTask}>Add</Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className={task.completed ? "line-through text-muted-foreground" : "text-foreground"}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-sm text-muted-foreground">No tasks yet. Add one above!</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Farming Tips */}
        <Card className="mt-6 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sprout className="h-5 w-5 text-primary" />
              <span>Today's Farming Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {todaysTips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <Dialog open={showCropGuide} onOpenChange={setShowCropGuide}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crop Growing Guide</DialogTitle>
          </DialogHeader>
          <CropGuide />
        </DialogContent>
      </Dialog>

      <Dialog open={showPlantDoctor} onOpenChange={setShowPlantDoctor}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plant Doctor</DialogTitle>
          </DialogHeader>
          <PlantDoctor />
        </DialogContent>
      </Dialog>

      <Dialog open={showCommunity} onOpenChange={setShowCommunity}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Farming Community</DialogTitle>
          </DialogHeader>
          <Community />
        </DialogContent>
      </Dialog>

      <Dialog open={showMarketPrices} onOpenChange={setShowMarketPrices}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Market Prices</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {marketData && marketData.prices.length > 0 ? (
              <div className="grid gap-4">
                {marketData.prices.map((price, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div>
                      <span className="font-medium">{price.crop}</span>
                      <span className="text-sm text-muted-foreground ml-2">per {price.unit}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{price.price}</div>
                      <div className={`text-sm ${
                        price.change.includes('+') ? 'text-green-600' : 
                        price.change.includes('-') ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {price.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No market data available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;