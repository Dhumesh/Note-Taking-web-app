import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    title: 'Real-time Collaborative Editing',
    text: 'Edit notes together in real time with automatic saving and conflict-safe updates.',
  },
  {
    title: 'Lightning Fast Search',
    text: 'Search by title or content and instantly find what matters in your workspace.',
  },
  {
    title: 'Infinite Device Sync',
    text: 'Use your notes on phone, tablet, or desktop with your workspace kept in sync.',
  },
];

const stats = [
  { label: 'Active Users', value: '500K+' },
  { label: 'Notes Created', value: '100M+' },
  { label: 'Uptime', value: '99.9%' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg">NoteSync</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#about" className="hover:text-slate-900">About</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to={user ? '/app' : '/login'} className="text-sm px-3 py-2 text-slate-700 hover:text-slate-900">
              {user ? 'Dashboard' : 'Log in'}
            </Link>
            <Link to={user ? '/app' : '/register'} className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              {user ? 'Open App' : 'Get Started'}
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-14 pb-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-5">
            Better Team Collaboration
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Think. Write. <span className="text-blue-600">Collaborate.</span>
          </h1>
          <p className="mt-5 text-slate-600 max-w-xl">
            Experience real-time syncing and rich note editing across your devices.
            Keep your ideas organized, searchable, and easy to share.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to={user ? '/app' : '/register'} className="px-5 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
              Get Started For Free
            </Link>
            <Link to={user ? '/app' : '/login'} className="px-5 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
              Watch Demo
            </Link>
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-200 to-cyan-200 rounded-2xl p-5 shadow-md">
          <div className="rounded-xl bg-white p-4 shadow-lg border border-slate-100">
            <div className="h-2 w-20 bg-slate-200 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-9 bg-slate-100 rounded flex items-center px-3 text-xs text-slate-500">Project Notes</div>
              <div className="h-9 bg-blue-100 rounded flex items-center px-3 text-xs text-blue-700">Sprint Planning</div>
              <div className="h-9 bg-slate-100 rounded flex items-center px-3 text-xs text-slate-500">Research Log</div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
              3 collaborators active now
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center">Powerful Features for Modern Teams</h2>
          <p className="text-slate-600 text-center mt-3 max-w-2xl mx-auto">
            Everything you need to write faster, collaborate smoothly, and keep knowledge in one place.
          </p>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-xl border border-slate-200 p-5 bg-slate-50">
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{feature.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 grid sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 p-5 bg-white">
                <div className="text-xs text-slate-500">{stat.label}</div>
                <div className="text-3xl font-bold mt-1">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-2xl bg-blue-600 text-white p-10 text-center">
          <h2 className="text-4xl font-bold">Ready to transform the way your team works?</h2>
          <p className="mt-3 text-blue-100">Join thousands of teams already using NoteSync.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to={user ? '/app' : '/register'} className="px-5 py-3 rounded-lg bg-white text-blue-700 font-medium hover:bg-slate-100">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      <footer id="about" className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-slate-500">
          <div className="font-semibold text-slate-700 mb-2">NoteSync</div>
          <p>Collaborative note-taking for individuals and teams.</p>
        </div>
      </footer>
    </div>
  );
}
