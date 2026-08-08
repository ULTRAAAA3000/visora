import SiteHeader from '../../components/landing/SiteHeader';
import Footer from '../../components/landing/Footer';
import GuideBody from '../../components/guide/GuideBody';

export default function Guide() {
  return (
    <div className="bg-black min-h-screen">
      <SiteHeader transparentAtTop={false} />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 md:px-10 pt-36 pb-24">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Guide</p>
        <h1 className="text-4xl font-bold text-white mb-4">Using Visora, start to finish</h1>
        <p className="text-lg text-[#D7E2EA]/70 mb-14">
          Written for anyone — whether you're comfortable with APIs or have never written a line of code.
        </p>

        <GuideBody />
      </div>

      <Footer />
    </div>
  );
}
