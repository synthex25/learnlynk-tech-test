// LearnLynk Tech Test - Task 3: Edge Function create-task

// Deno + Supabase Edge Functions style
// Docs reference: https://supabase.com/docs/guides/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CreateTaskPayload = {
  application_id: string;
  task_type: string;
  due_at: string;
};

const VALID_TYPES = ["call", "email", "review"];

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Partial<CreateTaskPayload>;
    const { application_id, task_type, due_at } = body;

    // required fields
    if (!application_id || !task_type || !due_at) {
      return new Response(
        JSON.stringify({error: "Missing required fields"}),
        {status:400, headers:{"Content-Type": "application/json"}}
      );
    }

    // allowed types
    if (!VALID_TYPES.includes(task_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid task_type" }),
        {status: 400, headers:{"Content-Type":"application/json"}}
      );
    }

    // due date
    const parsedDue = new Date(due_at);
    if (isNaN(parsedDue.getTime()) || parsedDue <= new Date()) {
      return new Response(
        JSON.stringify({error:"Invalid or past due_at timestamp"}),
        {status: 400, headers:{"Content-Type": "application/json"}}
      );
    }

    // Insert into database
    const { data, error } = await supabase
      .from("tasks")
      .insert([{
          application_id,
          type: task_type,
          due_at: parsedDue.toISOString(),
        },]) .select("id").single();

    if (error) {
      console.error("DB Insert Error:", error);
      return new Response(
        JSON.stringify({ error: "Database insert failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

      return new Response(
      JSON.stringify({ success: true, task_id: data.id }),
      {status: 200, headers:{"Content-Type": "application/json"}}
    );
    
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
