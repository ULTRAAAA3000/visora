import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm text-white/40 mb-3 tracking-widest uppercase">404</p>
        <h1 className="text-3xl font-semibold mb-4">This page doesn't exist</h1>
        <p className="text-[#D7E2EA]/60 mb-8 max-w-sm mx-auto">
          The link might be broken, or the page may have moved. Let's get you back on track.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-white text-black rounded-full font-medium px-6 py-3 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
