-- Visora — paid preset templates + gallery expansion.

ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

-- Replace the SELECT policy so premium presets are only visible/usable to
-- users on a paid plan_tier. Free presets and the user's own templates are
-- unaffected. Enforcement happens at the database layer (not just the UI),
-- so this holds even if the frontend gating is bypassed — though actual
-- plan_tier upgrades still require the billing integration (Phase 4).
DROP POLICY IF EXISTS "Anyone can read own templates or presets" ON public.templates;

CREATE POLICY "Anyone can read own templates or unlocked presets"
  ON public.templates FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_preset = TRUE
      AND (
        is_premium = FALSE
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.plan_tier <> 'free'
        )
      )
    )
  );

-- Two new free presets.
INSERT INTO public.templates (user_id, is_preset, is_premium, title, category, html_body, default_variables, width, height)
VALUES
(
  NULL,
  TRUE,
  FALSE,
  'Event Invitation',
  'invitation',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Playfair+Display:wght@500;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .serif { font-family: 'Playfair Display', serif; }
  </style>
</head>
<body class="bg-[#1c1a24] w-[1080px] h-[1350px] flex items-center justify-center p-16 m-0">
  <div class="w-full h-full border border-[#c9a876]/40 rounded-sm flex flex-col items-center justify-center text-center px-16 relative">
    <p class="text-xs tracking-[0.4em] uppercase text-[#c9a876] mb-8">You're invited</p>
    <h1 class="serif text-6xl text-white mb-10 leading-tight">{{event_name}}</h1>
    <div class="w-16 h-px bg-[#c9a876]/50 mb-10"></div>
    <p class="text-2xl text-gray-300 mb-3">{{event_date}}</p>
    <p class="text-lg text-gray-400 mb-16">{{event_location}}</p>
    <p class="text-sm uppercase tracking-widest text-[#c9a876]">Hosted by {{host_name}}</p>
  </div>
</body>
</html>$html$,
  '{"event_name": "Autumn Product Launch", "event_date": "October 12, 2026 · 6:00 PM", "event_location": "The Grand Loft, Kyiv", "host_name": "Visora"}'::jsonb,
  1080,
  1350
),
(
  NULL,
  TRUE,
  FALSE,
  'Job Opening Card',
  'hiring',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#f4f3ef] w-[1200px] h-[630px] flex items-center justify-center p-16 m-0">
  <div class="w-full h-full flex flex-col justify-between">
    <div>
      <span class="inline-block bg-black text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-8">
        {{employment_type}}
      </span>
      <h1 class="text-6xl font-extrabold text-black leading-tight mb-4">{{job_title}}</h1>
      <p class="text-2xl text-gray-600">{{company_name}} · {{location}}</p>
    </div>
    <p class="text-sm uppercase tracking-widest text-gray-500">We're hiring — apply now</p>
  </div>
</body>
</html>$html$,
  '{"job_title": "Senior Backend Engineer", "company_name": "Visora", "location": "Remote", "employment_type": "Full-time"}'::jsonb,
  1200,
  630
);

-- Two new premium presets (require plan_tier <> 'free').
INSERT INTO public.templates (user_id, is_preset, is_premium, title, category, html_body, default_variables, width, height)
VALUES
(
  NULL,
  TRUE,
  TRUE,
  'Podcast Episode Cover',
  'podcast',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-gradient-to-br from-fuchsia-600 via-purple-700 to-indigo-900 w-[1400px] h-[1400px] flex items-center justify-center p-20 m-0">
  <div class="w-full h-full flex flex-col justify-between">
    <div class="flex items-center justify-between">
      <span class="text-white/90 text-xl font-bold uppercase tracking-wider">{{show_name}}</span>
      <span class="bg-white/15 text-white text-lg font-bold px-5 py-2 rounded-full">EP {{episode_number}}</span>
    </div>
    <h1 class="text-7xl font-black text-white leading-[1.05] max-w-4xl">{{episode_title}}</h1>
    <p class="text-2xl text-white/80 font-medium">with {{host_name}}</p>
  </div>
</body>
</html>$html$,
  '{"show_name": "Build in Public", "episode_number": "42", "episode_title": "Shipping a micro-SaaS in a weekend", "host_name": "Alex Rivera"}'::jsonb,
  1400,
  1400
),
(
  NULL,
  TRUE,
  TRUE,
  'Modern Invoice Header',
  'invoice',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-white w-[1200px] h-[400px] flex items-center m-0 p-16">
  <div class="w-full flex items-center justify-between border-b-2 border-black pb-10">
    <div>
      <h1 class="text-3xl font-extrabold text-black mb-2">{{company_name}}</h1>
      <p class="text-sm text-gray-500">Invoice #{{invoice_number}} · Bill to: {{client_name}}</p>
    </div>
    <div class="text-right">
      <p class="text-4xl font-black text-black">{{total_amount}}</p>
      <p class="text-sm text-gray-500 mt-1">Due {{due_date}}</p>
    </div>
  </div>
</body>
</html>$html$,
  '{"company_name": "Visora Inc.", "invoice_number": "INV-1042", "client_name": "Acme Corp", "total_amount": "$1,240.00", "due_date": "August 18, 2026"}'::jsonb,
  1200,
  400
);
