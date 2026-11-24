import { Link } from 'react-router-dom';
import heroSneakers from '../assets/images/hero-sneakers.png';
import heroSandals from '../assets/images/hero-sandals.png';
import heroWedge from '../assets/images/hero-wedge.png';

export default function Home() {
  return (
    <div className="w-full">
      <section className="relative overflow-hidden bg-red-600 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 18%, rgba(255,255,255,0.18), transparent 24%), radial-gradient(circle at 88% 82%, rgba(255,255,255,0.14), transparent 28%), radial-gradient(circle at 78% 12%, rgba(0,0,0,0.12), transparent 22%)',
          }}
        />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-8 text-center sm:py-10 lg:py-12">
          <h1 className="text-[clamp(3.25rem,10vw,7.5rem)] leading-[0.95] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.22)] font-bold">
            Kahale Footwear
          </h1>

          <div className="mt-5 flex flex-col items-center space-y-2 sm:mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white sm:text-sm">
              Ashwi BK - 413714, Sangamner
            </p>
            <a
              href="tel:9579733238"
              className="inline-flex items-center gap-2 text-lg font-bold tracking-[0.18em] text-white underline-offset-4 transition-opacity hover:opacity-80 hover:underline sm:text-xl"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              9579733238
            </a>
            <a
              href="mailto:nileshkahale0123@gmail.com"
              className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-80 hover:underline sm:text-base"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              nileshkahale0123@gmail.com
            </a>
          </div>
        </div>
      </section>

      <div className="my-8 flex flex-wrap justify-center gap-3 px-4">
        <Link
          to="/catalog/Men"
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-8 py-3 text-lg font-bold text-white shadow-md transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
        >
          Shop Men
        </Link>
        <Link
          to="/catalog/Women"
          className="inline-flex items-center justify-center rounded-lg border border-red-600 px-8 py-3 text-lg font-bold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
        >
          Shop Women
        </Link>
      </div>

      <section className="mx-auto max-w-7xl px-4 mt-[10px]">
        <div className="flex flex-col items-center justify-center gap-8 py-0 md:flex-row md:items-center md:justify-between md:gap-14">
          <div className="w-full max-w-md md:w-1/2">
            <img
              src={heroSneakers}
              alt="Chunky Blue-Grey Sneakers on White"
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="w-full max-w-xl text-center md:w-1/2 md:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Stylish Sneakers &mdash; Walk with Confidence!
            </h2>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Step up your style with our premium chunky blue-grey sneakers. Crafted for all-day comfort and modern appeal, they are perfect for any casual or streetwear look.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 mt-[10px] mb-10">
        <div className="flex flex-col items-center justify-center gap-8 py-0 md:flex-row md:items-center md:justify-between md:gap-14">
          <div className="order-2 w-full max-w-xl text-center md:order-1 md:w-1/2 md:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              HYTECH PRIDE SS-600 SANDALS
            </h2>
            <ul className="mt-6 space-y-3 text-lg text-gray-600 marker:text-red-600 list-disc pl-6 text-left">
              <li>Bold Black &amp; Red Combination</li>
              <li>Stylish sporty design</li>
              <li>Textured footbed for a comfortable feel</li>
            </ul>
          </div>
          <div className="order-1 w-full max-w-md md:order-2 md:w-1/2">
            <img
              src={heroSandals}
              alt="HyTech Black and Red Sport Sandals"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto my-16 max-w-7xl px-4">
        <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:items-center md:justify-between md:gap-14">
          <div className="w-full max-w-md md:w-1/2">
            <img
              src={heroWedge}
              alt="Purple Jeweled Comfort Wedge Sandal"
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="w-full max-w-xl text-center md:w-1/2 md:text-left">
            <h2 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Stylish Purple Wedge Sandals
            </h2>
            <ul className="mt-6 list-disc space-y-3 pl-6 text-left text-lg text-gray-600 marker:text-red-600">
              <li>Attractive purple colour with elegant decorative detailing.</li>
              <li>Trendy design with an adjustable ankle strap.</li>
              <li>Stylish wedge heel with a textured tan-coloured sole.</li>
              <li>Perfect for daily wear, outings, and casual occasions.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
