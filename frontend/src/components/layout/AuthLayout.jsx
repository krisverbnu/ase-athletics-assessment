// Shared frame for the login and register pages: the form card on a dark pitch
import PitchBackground from './PitchBackground';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary-900 px-4 py-12">
      {/* A soft brand-blue glow from the top, then the pitch lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.22),transparent_60%)]"
      />
      <PitchBackground />

      <div className="relative w-full max-w-md motion-safe:animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/favicon.svg" alt="" className="size-12 drop-shadow-lg" />
          <p className="mt-3 text-sm font-bold tracking-widest text-white">ASE ATHLETICS</p>
          <p className="mt-1 text-sm text-secondary-400">Find, compare and scout players, all in one place</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-xl sm:p-8">
          <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
          <p className="mt-1 text-sm text-secondary-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <div className="mt-6 text-center text-sm text-secondary-300">{footer}</div>
      </div>
    </div>
  );
}
