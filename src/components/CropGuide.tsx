import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sprout, Calendar, Droplets, Bug } from "lucide-react";

const crops = [
  {
    name: "Rice (धान)",
    season: "Monsoon (June-Oct)",
    wateringTips: "Keep fields flooded, drain 10 days before harvest",
    fertilizerTips: "Apply urea 3 times: planting, tillering, flowering",
    pestControl: "Watch for stem borer, use yellow sticky traps"
  },
  {
    name: "Wheat (गहुँ)",
    season: "Winter (Oct-April)",
    wateringTips: "Water every 2-3 weeks, avoid overwatering",
    fertilizerTips: "Apply DAP at sowing, urea after 25 days",
    pestControl: "Monitor for aphids, use neem oil spray"
  },
  {
    name: "Maize (मकै)",
    season: "Spring/Summer (March-July)",
    wateringTips: "Regular watering, especially during tasseling",
    fertilizerTips: "Apply compost + DAP at planting, urea after 30 days",
    pestControl: "Check for army worm, use biological control"
  },
  {
    name: "Potato (आलु)",
    season: "Winter (Oct-Feb)",
    wateringTips: "Water moderately, avoid waterlogging",
    fertilizerTips: "Apply well-decomposed manure before planting",
    pestControl: "Monitor for late blight, use resistant varieties"
  }
];

const CropGuide = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Crop Guide</h2>
        <p className="text-muted-foreground">Comprehensive farming guidance for Nepal</p>
      </div>

      <Tabs defaultValue="crops" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="crops">Major Crops</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Calendar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="crops" className="space-y-4">
          {crops.map((crop, index) => (
            <Card key={index} className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sprout className="h-5 w-5 mr-2 text-primary" />
                  {crop.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {crop.season}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center mb-1">
                      <Droplets className="h-4 w-4 mr-2 text-accent" />
                      <span className="font-medium text-sm">Watering</span>
                    </div>
                    <p className="text-sm text-foreground ml-6">{crop.wateringTips}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-1">
                      <Sprout className="h-4 w-4 mr-2 text-earth" />
                      <span className="font-medium text-sm">Fertilizer</span>
                    </div>
                    <p className="text-sm text-foreground ml-6">{crop.fertilizerTips}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-1">
                      <Bug className="h-4 w-4 mr-2 text-destructive" />
                      <span className="font-medium text-sm">Pest Control</span>
                    </div>
                    <p className="text-sm text-foreground ml-6">{crop.pestControl}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="seasonal">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Nepali Farming Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-primary mb-2">Monsoon Season (June-October)</h4>
                  <ul className="text-sm space-y-1 text-foreground">
                    <li>• Rice transplanting</li>
                    <li>• Maize harvesting</li>
                    <li>• Vegetable planting (okra, cucumber)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-2">Winter Season (November-February)</h4>
                  <ul className="text-sm space-y-1 text-foreground">
                    <li>• Wheat sowing</li>
                    <li>• Potato planting</li>
                    <li>• Mustard cultivation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-2">Spring Season (March-May)</h4>
                  <ul className="text-sm space-y-1 text-foreground">
                    <li>• Wheat harvesting</li>
                    <li>• Summer vegetables</li>
                    <li>• Maize planting</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-2">Pre-Monsoon (April-May)</h4>
                  <ul className="text-sm space-y-1 text-foreground">
                    <li>• Rice seedbed preparation</li>
                    <li>• Tool maintenance</li>
                    <li>• Irrigation system check</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CropGuide;