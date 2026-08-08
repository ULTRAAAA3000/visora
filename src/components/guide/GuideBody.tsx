import type { ReactNode } from 'react';
import {
  FileCode2,
  ArrowRight,
  Wand2,
  Image as ImageIcon,
  KeyRound,
  Blocks,
  Bot,
  Workflow,
  Terminal,
  HelpCircle,
} from 'lucide-react';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-semibold text-white mb-5">{title}</h2>
      <div className="space-y-4 text-[#D7E2EA]/80 leading-relaxed">{children}</div>
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-white/[0.04] border border-white/10 rounded-xl p-5 overflow-x-auto text-sm font-mono text-[#D7E2EA] leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function FlowCard({ icon: Icon, label }: { icon: typeof FileCode2; label: string }) {
  return (
    <div className="flex-1 liquid-glass rounded-2xl p-6 text-center">
      <Icon className="w-7 h-7 text-white mx-auto mb-3" />
      <p className="text-sm text-white font-medium">{label}</p>
    </div>
  );
}

function NumberedStep({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm font-medium text-white">
        {n}
      </div>
      <div className="pt-0.5">
        <p className="text-white font-medium mb-1">{title}</p>
        <div className="text-sm text-[#D7E2EA]/70 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function OptionCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof Bot;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="block rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition-colors"
    >
      <Icon className="w-5 h-5 text-white mb-3" />
      <p className="text-white font-medium mb-1">{title}</p>
      <p className="text-sm text-[#D7E2EA]/60">{description}</p>
    </a>
  );
}

/**
 * Written for two audiences at once: someone who's never touched an
 * API in their life, and a developer skimming for the curl example.
 * The no-code section exists because Visora's own integrations
 * (WordPress, Telegram, Make.com) mean "I can't code" doesn't have to
 * mean "I can't use this."
 */
export default function GuideBody() {
  return (
    <>
      <Section title="What Visora actually does">
        <p>
          You give Visora a <strong className="text-white">template</strong> — a design with blanks in it, like
          "product name" or "price" — and some <strong className="text-white">data</strong> to fill those blanks
          with. Visora hands back a finished image. That's the whole idea.
        </p>
        <p>
          No AI is guessing what your logo or text should look like — it's a real browser (headless Chromium)
          taking a screenshot of a real web page built from your template. Same input, same output, every time.
        </p>
      </Section>

      <Section title="How it works, visually">
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
          <FlowCard icon={FileCode2} label="A template + your data" />
          <ArrowRight className="w-5 h-5 text-white/30 shrink-0 rotate-90 sm:rotate-0" />
          <FlowCard icon={Wand2} label="Visora renders it" />
          <ArrowRight className="w-5 h-5 text-white/30 shrink-0 rotate-90 sm:rotate-0" />
          <FlowCard icon={ImageIcon} label="You get an image URL" />
        </div>
      </Section>

      <Section title="Getting started">
        <div className="space-y-6">
          <NumberedStep n={1} title="Create an account">
            Sign up at the top of the site — free, no credit card. You land straight in the dashboard.
          </NumberedStep>
          <NumberedStep n={2} title="Find your API key">
            It's the first thing on the dashboard's Overview page, in a box you can copy with one click. This key
            is what proves requests are coming from you.
          </NumberedStep>
          <NumberedStep n={3} title="Pick a template">
            Dashboard → Templates has 30+ ready-made designs. Click one and it's copied into your account, ready
            to use — no need to write any HTML yourself.
          </NumberedStep>
          <NumberedStep n={4} title="Render it">
            Either call the API directly (see below), or use one of the no-code options if writing code isn't
            your thing.
          </NumberedStep>
        </div>
      </Section>

      <Section title="Don't want to write code? You don't have to.">
        <p className="mb-4">
          Visora connects directly to tools you may already use — you never touch the API or a line of code.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <OptionCard
            icon={Blocks}
            title="WordPress"
            description="One-click connect, then a shortcode drops rendered images into any post or page."
            href="/docs#integrations"
          />
          <OptionCard
            icon={Workflow}
            title="Make.com"
            description="No-code automation — add a Render Image step to any scenario, no API knowledge needed."
            href="/docs#integrations"
          />
          <OptionCard
            icon={Bot}
            title="Telegram"
            description="Connect your account to the bot, then render templates with a simple chat command."
            href="/docs#integrations"
          />
        </div>
      </Section>

      <Section title="For developers: the actual API call">
        <p className="mb-4">One endpoint. Send your template ID and data, get back an image URL.</p>
        <CodeBlock>{`curl -X POST https://<your-worker>.workers.dev/api/v1/render \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "tpl_ecom_v1",
    "format": "png",
    "data": {
      "title": "Nike Air Max 270",
      "price": "3,499 UAH"
    }
  }'`}</CodeBlock>
        <p className="mt-4">
          Full request/response reference, error codes, and rate limits are in the{' '}
          <a href="/docs" className="text-white underline underline-offset-2">
            API docs
          </a>
          .
        </p>
      </Section>

      <Section title="Common questions">
        <div className="space-y-5">
          <div className="flex gap-3">
            <HelpCircle className="w-4 h-4 text-white/40 shrink-0 mt-1" />
            <div>
              <p className="text-white text-sm font-medium mb-1">
                Why doesn't my {'{{'}variable{'}}'} show up in the image?
              </p>
              <p className="text-sm text-[#D7E2EA]/70">
                The name in your data must match the template exactly, including case — {'{{'}title{'}}'} in the
                template needs a <code className="text-white/80">title</code> key in your data, not{' '}
                <code className="text-white/80">Title</code>.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <HelpCircle className="w-4 h-4 text-white/40 shrink-0 mt-1" />
            <div>
              <p className="text-white text-sm font-medium mb-1">Can I use my own HTML instead of a preset?</p>
              <p className="text-sm text-[#D7E2EA]/70">
                Yes — "Blank template" on the Templates page starts you from plain HTML + Tailwind. Any{' '}
                {'{{'}word{'}}'} you write becomes a fillable field automatically.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <KeyRound className="w-4 h-4 text-white/40 shrink-0 mt-1" />
            <div>
              <p className="text-white text-sm font-medium mb-1">I think my API key leaked — now what?</p>
              <p className="text-sm text-[#D7E2EA]/70">
                Dashboard → Overview → "Regenerate key" issues a new one and immediately invalidates the old one.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Still stuck?">
        <p className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-white/50" />
          The{' '}
          <a href="/docs" className="text-white underline underline-offset-2">
            API docs
          </a>{' '}
          have the full technical reference — endpoints, error codes, rate limits.
        </p>
      </Section>
    </>
  );
}
