import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080808] p-6 text-center text-white">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-white/60">The page you requested does not exist.</p>
      <Link to="/" className="text-sm text-[#49E619] hover:underline">Go to dashboard</Link>
    </main>
  );
}
