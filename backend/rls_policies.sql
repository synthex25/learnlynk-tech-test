-- LearnLynk Tech Test - Task 2: RLS Policies on leads

alter table public.leads enable row level security;

-- Example helper: assume JWT has tenant_id, user_id, role.
-- You can use: current_setting('request.jwt.claims', true)::jsonb

-- TODO: write a policy so:
-- - counselors see leads where they are owner_id OR in one of their teams
-- - admins can see all leads of their tenant

create policy leads_select_policy
on public.leads for select using ((
    auth.jwt() ->> 'role' = 'admin'
    and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  )
  OR
    (
    auth.jwt() ->> 'role' = 'counselor'
    and owner_id = (auth.jwt() ->> 'user_id')::uuid
  )
  OR
   exists (
    select 1 from public.user_teams ut
    join public.teams t on t.id = ut.team_id
    where ut.user_id = (auth.jwt() ->> 'user_id')::uuid
      and t.tenant_id = public.leads.tenant_id
  )
);


-- Example skeleton for SELECT (replace with your own logic):
create policy leads_insert_policy on public.leads
for insert with check (
  auth.jwt() ->> 'role' in ('admin','counselor')
  and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);
