// Shared frame for the login and register pages
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-800 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/favicon.svg" alt="" className="size-12" />
          <p className="mt-3 text-sm font-bold tracking-widest text-white">ASE ATHLETICS</p>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
          <p className="mt-1 text-sm text-secondary-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <div className="mt-6 text-center text-sm text-secondary-300">{footer}</div>
      </div>
    </div>
  );
}
