import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus, User, Clock, ThumbsUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const sampleQuestions = [
  {
    id: 1,
    question: "Best time to plant tomatoes in Kathmandu valley?",
    author: "Ram Sharma",
    time: "2 hours ago",
    answers: 3,
    likes: 5,
    category: "Vegetables"
  },
  {
    id: 2,
    question: "How to control aphids in mustard crops?",
    author: "Sita Devi",
    time: "5 hours ago",
    answers: 7,
    likes: 12,
    category: "Pest Control"
  },
  {
    id: 3,
    question: "Which potato variety is best for hills?",
    author: "Krishna Bahadur",
    time: "1 day ago",
    answers: 4,
    likes: 8,
    category: "Crops"
  },
  {
    id: 4,
    question: "Organic fertilizer preparation at home",
    author: "Maya Gurung",
    time: "2 days ago",
    answers: 15,
    likes: 23,
    category: "Fertilizer"
  }
];

const Community = () => {
  const [showAskForm, setShowAskForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const { toast } = useToast();

  const handleAskQuestion = () => {
    if (!question.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter your question",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Question Posted",
      description: "Your question has been posted to the community",
    });
    
    setQuestion("");
    setCategory("");
    setShowAskForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Farming Community</h2>
        <p className="text-muted-foreground">Connect with fellow farmers and experts</p>
      </div>

      {/* Ask Question Button */}
      <div className="text-center">
        <Button 
          onClick={() => setShowAskForm(!showAskForm)}
          className="w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ask a Question
        </Button>
      </div>

      {/* Ask Question Form */}
      {showAskForm && (
        <Card className="shadow-card border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle>Ask Your Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Question</label>
              <Textarea
                placeholder="Describe your farming question or problem..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <Input
                placeholder="e.g., Vegetables, Pest Control, Fertilizer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAskQuestion}>Post Question</Button>
              <Button variant="outline" onClick={() => setShowAskForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Feed */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Questions</h3>
        
        {sampleQuestions.map((q) => (
          <Card key={q.id} className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-foreground flex-1">{q.question}</h4>
                  <Badge variant="secondary" className="ml-2">{q.category}</Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {q.author}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {q.time}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {q.answers}
                    </div>
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {q.likes}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expert Tips */}
      <Card className="shadow-card bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="text-primary">Expert Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-foreground">💡 Dr. Rajesh Thapa - Agricultural Expert</p>
              <p className="text-muted-foreground">"Always test your soil pH before planting. Most vegetables prefer slightly acidic to neutral soil (6.0-7.0 pH)."</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">🌱 Farmer Bishnu Maya</p>
              <p className="text-muted-foreground">"Companion planting works! Plant marigolds near tomatoes to naturally repel pests."</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Community;