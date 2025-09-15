import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, User, Clock, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ChatRow = {
  id: string;
  username: string | null;
  message: string | null;
  inserted_at: string;
};

const Community = () => {
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState<string>(() => localStorage.getItem("mk_username") || "");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load recent messages (last 1 hour)
  // `supabase` generated types don't include our new `chats` table yet in types.ts
  // so cast to `any` to avoid TypeScript errors in this repo-local client usage.
  const sb = supabase as any;

  const loadMessages = async () => {
    setLoading(true);
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data, error } = await sb
        .from("chats")
        .select("id, username, message, inserted_at")
        .gt("inserted_at", oneHourAgo)
        .order("inserted_at", { ascending: true });

      if (error) throw error;
      setMessages((data as ChatRow[]) || []);
      // scroll to bottom
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({ title: "Load Error", description: "Could not load community messages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    // subscribe to realtime inserts
  const channel = (supabase as any).channel("public:chats");

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chats" },
      (payload) => {
        const newRow = payload.new as ChatRow;
        setMessages((m) => [...m, newRow]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 20);
      }
    );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (cooldown > 0) {
      toast({ title: "Please wait", description: `You can send another message in ${cooldown}s`, variant: "destructive" });
      return;
    }
    const name = (username && username.trim()) || "Anonymous";
    // Optimistic update: create a temporary local message so it appears instantly
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const now = new Date().toISOString();
    const tempMsg: ChatRow = { id: tempId, username: name, message: input.trim(), inserted_at: now };
    setMessages((m) => [...m, tempMsg]);
    setInput("");
    localStorage.setItem("mk_username", name);

    try {
      // Insert into DB. When Supabase realtime delivers the inserted row, we'll dedupe it.
      const { data, error } = await sb.from("chats").insert([{ username: name, message: tempMsg.message }]).select();
      if (error) throw error;

      // If DB returns the inserted row, replace the temp message ID with real ID
      if (data && data.length > 0) {
        const inserted = data[0] as ChatRow;
        setMessages((m) => m.map((it) => (it.id === tempId ? inserted : it)));
      }
      // Start 30s cooldown after successful send
      setCooldown(30);
      const timer = setInterval(() => setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      }), 1000);
    } catch (error) {
      console.error("Send error:", error);
      // remove the optimistic message on failure
      setMessages((m) => m.filter((it) => it.id !== tempId));
      toast({ title: "Send Failed", description: "Could not send message", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Farming Community Chat</h2>
        <p className="text-muted-foreground">Live chat for farmers — messages expire after 1 hour</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Live Chat</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-surface">
            {loading && <p className="text-sm text-muted-foreground">Loading messages...</p>}
            {messages.map((m) => (
              <div key={m.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">{(m.username || "A").charAt(0).toUpperCase()}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium text-foreground">{m.username || "Anonymous"}</div>
                    <div className="text-xs text-muted-foreground">{new Date(m.inserted_at).toLocaleTimeString()}</div>
                  </div>
                  <div className="text-sm text-foreground">{m.message}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

            <div className="p-4 border-t flex gap-2 items-center">
            <Input placeholder="Your name (optional)" value={username} onChange={(e) => setUsername(e.target.value)} className="w-48" />
            <Input placeholder="Write a message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }} />
            <Button onClick={handleSend} disabled={cooldown > 0}>
              <Send className="h-4 w-4 mr-2" />
              {cooldown > 0 ? `Wait ${cooldown}s` : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Community;