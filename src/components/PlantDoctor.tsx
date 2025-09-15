import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const commonDiseases = [
  {
    name: "Late Blight (Potato)",
    symptoms: "Dark spots on leaves, white mold on undersides",
    treatment: "Remove affected plants, apply copper fungicide",
    prevention: "Use resistant varieties, ensure good drainage"
  },
  {
    name: "Stem Borer (Rice)",
    symptoms: "Yellowing of leaves, holes in stems",
    treatment: "Use pheromone traps, apply biological pesticides",
    prevention: "Remove crop residues, use resistant varieties"
  },
  {
    name: "Aphids",
    symptoms: "Small green insects on leaves, sticky honeydew",
    treatment: "Spray neem oil, introduce ladybugs",
    prevention: "Regular monitoring, companion planting"
  },
  {
    name: "Powdery Mildew",
    symptoms: "White powdery coating on leaves",
    treatment: "Apply sulfur-based fungicide, improve air circulation",
    prevention: "Avoid overhead watering, plant in sunny areas"
  }
];

const PlantDoctor = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDiagnosis(null);
    }
  };

  const analyzePlant = async () => {
    if (!selectedFile) {
      toast({
        title: "No Image Selected",
        description: "Please select a plant image first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const randomDisease = commonDiseases[Math.floor(Math.random() * commonDiseases.length)];
      setDiagnosis(randomDisease.name);
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: `Possible diagnosis: ${randomDisease.name}`,
      });
    }, 3000);
  };

  const selectedDisease = diagnosis ? commonDiseases.find(d => d.name === diagnosis) : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Plant Doctor</h2>
        <p className="text-muted-foreground">Upload plant photos for disease diagnosis</p>
      </div>

      {/* Image Upload Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2 text-primary" />
            Upload Plant Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            {selectedFile ? (
              <div className="space-y-2">
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Selected plant" 
                  className="max-h-48 mx-auto rounded-lg"
                />
                <p className="text-sm text-foreground">{selectedFile.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Select an image of your plant</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="plant-image"
            />
            <label htmlFor="plant-image">
              <Button variant="outline" className="cursor-pointer">
                <Camera className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
            </label>
            
            <Button 
              onClick={analyzePlant}
              disabled={!selectedFile || isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Diagnose Plant
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis Results */}
      {selectedDisease && (
        <Card className="shadow-card border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-success" />
              Diagnosis: {selectedDisease.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Symptoms:</h4>
              <p className="text-sm text-muted-foreground">{selectedDisease.symptoms}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Treatment:</h4>
              <p className="text-sm text-muted-foreground">{selectedDisease.treatment}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Prevention:</h4>
              <p className="text-sm text-muted-foreground">{selectedDisease.prevention}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Common Diseases Reference */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Common Plant Diseases in Nepal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {commonDiseases.map((disease, index) => (
              <div key={index} className="border border-border rounded-lg p-3">
                <h4 className="font-semibold text-foreground mb-1">{disease.name}</h4>
                <p className="text-xs text-muted-foreground">{disease.symptoms}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlantDoctor;