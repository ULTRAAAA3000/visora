import FadeIn from './FadeIn';

interface Service {
  number: string;
  name: string;
  description: string;
}

const SERVICES: Service[] = [
  {
    number: '01',
    name: 'OG Images',
    description: 'Auto-generate social share images for every blog post, product page, or listing — pixel-exact every time.',
  },
  {
    number: '02',
    name: 'Product Banners',
    description: 'E-commerce banners, discount tags, and marketing creatives rendered straight from your product data.',
  },
  {
    number: '03',
    name: 'Certificates & Badges',
    description: 'Course completions, achievements, and credentials — issued as branded, verifiable images.',
  },
  {
    number: '04',
    name: 'Social Cards',
    description: 'Quote cards, announcement graphics, and podcast covers ready to post the moment content ships.',
  },
  {
    number: '05',
    name: 'Developer API',
    description: 'One POST request, one JSON payload, one image URL back — deploy in minutes, not sprints.',
  },
];

export default function ServicesSection() {
  return (
    <section
      id="services"
      className="relative bg-white rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 z-10"
    >
      <FadeIn>
        <h2
          className="font-black uppercase text-center text-[#0C0C0C] mb-16 sm:mb-20 md:mb-28"
          style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
        >
          What you can build
        </h2>
      </FadeIn>

      <div className="max-w-5xl mx-auto">
        {SERVICES.map((service, i) => (
          <FadeIn key={service.number} delay={i * 0.1}>
            <div
              className="flex items-center gap-8 py-8 sm:py-10 md:py-12"
              style={{ borderBottom: i < SERVICES.length - 1 ? '1px solid rgba(12,12,12,0.15)' : 'none' }}
            >
              <span
                className="font-black text-[#0C0C0C] shrink-0"
                style={{ fontSize: 'clamp(3rem, 10vw, 140px)' }}
              >
                {service.number}
              </span>
              <div>
                <h3
                  className="font-medium uppercase text-[#0C0C0C] mb-2"
                  style={{ fontSize: 'clamp(1rem, 2.2vw, 2.1rem)' }}
                >
                  {service.name}
                </h3>
                <p
                  className="font-light leading-relaxed max-w-2xl text-[#0C0C0C]/60"
                  style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.25rem)' }}
                >
                  {service.description}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
