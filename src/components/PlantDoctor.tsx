import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Check, Clock, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";

type Task = {
  id: string;
  user_name?: string | null;
  title: string;
  details?: string | null;
  due_at?: string | null;
  remind_before?: number | null;
  completed?: boolean;
};

const PlantDoctor = () => {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  // dueAt holds the local input value (YYYY-MM-DDTHH:mm) or null
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [remindBefore, setRemindBefore] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lang, setLang] = useState<'en'|'ne'>(() => (localStorage.getItem('mk_lang') as 'en'|'ne') || 'en');
  const [calendar, setCalendar] = useState<'ad'|'bs'>('ad');
  const { toast } = useToast();
  const { sendNotification } = useNotifications();

  const sb = supabase as any;

  // Helpers: parse local datetime-local input to UTC ISO string for DB
  const parseLocalToISOString = (local?: string | null) => {
    if (!local) return null;
    // expected format: YYYY-MM-DDTHH:mm
    const [datePart, timePart] = local.split('T');
    if (!datePart || !timePart) return null;
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);
    const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
    return dt.toISOString();
  };

  const isoToLocalInput = (iso?: string | null) => {
    if (!iso) return null;
    const dt = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const date = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    const time = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    return `${date}T${time}`;
  };

  // Nepali digit conversion (0-9)
  const toNepaliDigits = (s: string) => s.replace(/[0-9]/g, (d) => '०१२३४५६७८९'[Number(d)]);

  // Very simple AD -> BS approximation: adds 56 years and 8 months. This is approximate.
  // For accurate conversion use a proper library/mapping. This function is a placeholder.
  const convertADtoBS = (iso?: string | null) => {
    if (!iso) return null;
    const dt = new Date(iso);
    let year = dt.getFullYear() + 56;
    let month = dt.getMonth() + 1 + 8; // +8 months
    let day = dt.getDate();
    while (month > 12) { month -= 12; year += 1; }
    return `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await sb.from("tasks").select("id, user_name, title, details, due_at, remind_before, completed").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not load tasks", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Schedule reminders for upcoming tasks locally
  useEffect(() => {
    const timers: Array<{ id: string; t: number }> = [];
    const now = Date.now();
    tasks.forEach((task) => {
      if (task.completed) return;
      if (!task.due_at) return;
      const due = new Date(task.due_at).getTime();
      const remindAt = due - ((task.remind_before || 0) * 1000);
      if (remindAt <= now) return; // missed or immediate
      const timeout = window.setTimeout(() => {
        sendNotification({ title: `Reminder: ${task.title}`, body: task.details || "", requireInteraction: true });
      }, remindAt - now);
      timers.push({ id: task.id, t: timeout });
    });

    return () => {
      timers.forEach((x) => clearTimeout(x.t));
    };
  }, [tasks]);

  const handleAdd = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Please enter a task title", variant: "destructive" });
      return;
    }

    try {
      const payload = { user_name: localStorage.getItem('mk_username') || null, title: title.trim(), details: details.trim() || null, due_at: dueAt, remind_before: remindBefore };
      const { data, error } = await sb.from("tasks").insert([payload]).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setTasks((t) => [data[0], ...t]);
        setTitle(""); setDetails(""); setDueAt(null); setRemindBefore(0);
        toast({ title: "Task added", description: "Your task was saved" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not save task", variant: "destructive" });
    }
  };

  const toggleComplete = async (task: Task) => {
    try {
      const { error } = await sb.from("tasks").update({ completed: !task.completed }).eq('id', task.id);
      if (error) throw error;
      setTasks((t) => t.map((x) => x.id === task.id ? { ...x, completed: !x.completed } : x));
    } catch (err) {
      console.error(err);
    }
  };

  const removeTask = async (task: Task) => {
    try {
      const { error } = await sb.from("tasks").delete().eq('id', task.id);
      if (error) throw error;
      setTasks((t) => t.filter((x) => x.id !== task.id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{lang === 'ne' ? 'टुडु सूची' : 'Todo List'}</h2>
        <p className="text-muted-foreground">{lang === 'ne' ? 'कामको समय, विषादी र पालनपोषण सम्झनाहरू सेट गर्नुहोस्' : 'Schedule work, pesticide application, and feeding reminders'}</p>
        <div className="mt-2 flex justify-center gap-2">
          <select value={lang} onChange={(e) => { const v = e.target.value as 'en'|'ne'; setLang(v); localStorage.setItem('mk_lang', v); }} className="border p-1 rounded">
            <option value="en">English</option>
            <option value="ne">नेपाली</option>
          </select>
          <select value={calendar} onChange={(e) => setCalendar(e.target.value as 'ad'|'bs')} className="border p-1 rounded">
            <option value="ad">AD</option>
            <option value="bs">BS</option>
          </select>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Add Task</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input placeholder={lang === 'ne' ? 'कार्य शीर्षक' : 'Task title'} value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder={lang === 'ne' ? 'विवरण (ऐच्छिक)' : 'Details (optional)'} value={details} onChange={(e) => setDetails(e.target.value)} />
            <div className="flex gap-2">
              <Input type="datetime-local" value={dueAt || ''} onChange={(e) => setDueAt(e.target.value || null)} />
              <Input type="number" value={remindBefore} onChange={(e) => setRemindBefore(Number(e.target.value))} placeholder={lang === 'ne' ? 'स्मरण सेकेन्ड अघि' : 'Remind seconds before'} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}><PlusCircle className="h-4 w-4 mr-2" />Add Task</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{lang === 'ne' ? 'आउँदै गरेका कार्यहरू' : 'Upcoming Tasks'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start justify-between p-3 border border-border rounded-lg">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-foreground">{task.title}</div>
                    {task.due_at && (
                      <div className="text-xs text-muted-foreground">
                        {calendar === 'ad' ? (
                          lang === 'ne' ? toNepaliDigits(new Date(task.due_at).toLocaleString()) : new Date(task.due_at).toLocaleString()
                        ) : (
                          // BS mode (approximate conversion)
                          lang === 'ne' ? toNepaliDigits(convertADtoBS(task.due_at) || '') : (convertADtoBS(task.due_at) || '')
                        )}
                      </div>
                    )}
                  </div>
                  {task.details && <div className="text-sm text-muted-foreground">{task.details}</div>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button variant="ghost" onClick={() => toggleComplete(task)}>{task.completed ? <Check/> : <Clock/>}</Button>
                  <Button variant="ghost" onClick={() => removeTask(task)}><Trash/></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlantDoctor;