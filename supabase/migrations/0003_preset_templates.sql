-- Visora — Phase 3.5: preset template gallery.
--
-- Also fixes a latent RLS bug from 0001_init.sql: the original policy
-- "Users can manage own templates" used FOR ALL USING (auth.uid() = user_id
-- OR is_preset = TRUE) — since USING (without WITH CHECK) applies to
-- UPDATE/DELETE too, any signed-in user could edit or delete preset rows,
-- not just read them. Split into per-operation policies instead.

DROP POLICY IF EXISTS "Users can manage own templates" ON public.templates;

CREATE POLICY "Anyone can read own templates or presets"
  ON public.templates FOR SELECT
  USING (auth.uid() = user_id OR is_preset = TRUE);

CREATE POLICY "Users can insert own templates"
  ON public.templates FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_preset = FALSE);

CREATE POLICY "Users can update own templates"
  ON public.templates FOR UPDATE
  USING (auth.uid() = user_id AND is_preset = FALSE)
  WITH CHECK (auth.uid() = user_id AND is_preset = FALSE);

CREATE POLICY "Users can delete own templates"
  ON public.templates FOR DELETE
  USING (auth.uid() = user_id AND is_preset = FALSE);

-- Preset templates: user_id is NULL (not owned by anyone), is_preset = TRUE,
-- readable by every signed-in user via the SELECT policy above.

INSERT INTO public.templates (user_id, is_preset, title, category, html_body, default_variables, width, height)
VALUES
(
  NULL,
  TRUE,
  'Certificate of Completion',
  'certificate',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Playfair+Display:wght@600&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .serif { font-family: 'Playfair Display', serif; }
  </style>
</head>
<body class="bg-[#faf7f0] w-[1600px] h-[1131px] flex items-center justify-center p-16 m-0">
  <div class="w-full h-full border-4 border-double border-[#b8935f] rounded-sm flex flex-col items-center justify-center text-center px-20 py-16 relative">
    <p class="text-xs tracking-[0.3em] uppercase text-[#b8935f] mb-6">Certificate of Completion</p>
    <h1 class="serif text-3xl text-[#2a2a2a] mb-10">This certifies that</h1>
    <h2 class="serif text-6xl text-[#1a1a1a] mb-10 border-b-2 border-[#b8935f] pb-4 px-12">{{recipient_name}}</h2>
    <p class="text-lg text-[#4a4a4a] max-w-2xl mb-12">has successfully completed the course</p>
    <h3 class="serif text-3xl text-[#2a2a2a] mb-16">{{course_title}}</h3>
    <div class="flex items-center gap-24 mt-auto">
      <div class="text-center">
        <p class="serif text-xl text-[#1a1a1a] border-t border-[#b8935f] pt-2 px-8">{{issue_date}}</p>
        <p class="text-xs uppercase tracking-wider text-[#8a8a8a] mt-1">Date</p>
      </div>
      <div class="text-center">
        <p class="serif text-xl text-[#1a1a1a] border-t border-[#b8935f] pt-2 px-8">{{issuer_name}}</p>
        <p class="text-xs uppercase tracking-wider text-[#8a8a8a] mt-1">Issued by</p>
      </div>
    </div>
  </div>
</body>
</html>$html$,
  '{"recipient_name": "Jane Doe", "course_title": "Advanced Web Development", "issue_date": "August 4, 2026", "issuer_name": "Visora Academy"}'::jsonb,
  1600,
  1131
),
(
  NULL,
  TRUE,
  'Social Quote Card',
  'social',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-gradient-to-br from-slate-900 to-slate-950 w-[1080px] h-[1080px] flex items-center justify-center p-24 m-0">
  <div class="flex flex-col items-center text-center">
    <svg width="48" height="36" viewBox="0 0 48 36" fill="none" class="mb-10 opacity-40">
      <path d="M0 36V18.72C0 8.4 6.72 1.2 18 0L19.92 4.32C13.68 5.76 10.32 9.6 9.6 15.12H18V36H0ZM27.6 36V18.72C27.6 8.4 34.32 1.2 45.6 0L47.52 4.32C41.28 5.76 37.92 9.6 37.2 15.12H45.6V36H27.6Z" fill="white"/>
    </svg>
    <h1 class="text-5xl leading-tight text-white font-medium mb-12 max-w-3xl">{{quote_text}}</h1>
    <p class="text-xl text-slate-400">— {{author_name}}</p>
  </div>
</body>
</html>$html$,
  '{"quote_text": "Great products are built by teams who care about the details.", "author_name": "Someone Worth Quoting"}'::jsonb,
  1080,
  1080
),
(
  NULL,
  TRUE,
  'E-commerce Product Banner',
  'ecommerce',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-white w-[1200px] h-[630px] flex items-center justify-center p-12 m-0 overflow-hidden">
  <div class="w-full h-full bg-slate-900 border border-slate-800 rounded-3xl p-10 flex gap-8 items-center shadow-2xl relative">
    <img src="{{image_url}}" class="w-1/2 h-full object-cover rounded-2xl border border-slate-800" />
    <div class="flex flex-col justify-between h-full w-1/2 py-4">
      <div>
        <span class="bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider">{{discount}}</span>
        <h1 class="text-4xl font-extrabold mt-4 text-slate-100 line-clamp-2">{{title}}</h1>
      </div>
      <div class="flex items-baseline gap-4">
        <span class="text-5xl font-black text-emerald-400">{{price}}</span>
        <span class="text-2xl text-slate-500 line-through font-bold">{{old_price}}</span>
      </div>
    </div>
  </div>
</body>
</html>$html$,
  '{"title": "Nike Air Max 270", "price": "3,499 UAH", "old_price": "4,200 UAH", "discount": "-20%", "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"}'::jsonb,
  1200,
  630
);
