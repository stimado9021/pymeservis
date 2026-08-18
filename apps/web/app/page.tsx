import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@pymes/shared';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

const features = [
  {
    title: 'Cartera al día',
    desc: 'Registra clientes y facturas, con estados automáticos: pendiente, vencida, parcial y pagada.',
    icon: '📒',
  },
  {
    title: 'Links de pago Wompi',
    desc: 'Cada factura tiene su link de pago. Tu cliente paga con tarjeta y el pago se aplica automáticamente.',
    icon: '💳',
  },
  {
    title: 'Recordatorios automáticos',
    desc: 'Cobra por WhatsApp, SMS o email antes y después del vencimiento, sin perseguir a nadie.',
    icon: '🔔',
  },
  {
    title: 'Flujo de caja proyectado',
    desc: 'Gráficos que muestran lo que vas a cobrar cada mes y qué facturas se están atrasando.',
    icon: '📈',
  },
  {
    title: 'Reportes de gestión',
    desc: 'Sabe cuánto recuperas, cuánto tienes vencido y cuál es tu tasa de cobro real.',
    icon: '🧮',
  },
  {
    title: 'Cada pyme con su cuenta',
    desc: 'Conecta tu propia cuenta de Wompi y recibe el dinero directo en tu banco, sin intermediarios.',
    icon: '🏦',
  },
];

const testimonials = [
  {
    name: 'Laura Martínez',
    role: 'Administradora, Textil Colores',
    text: 'Recuperamos el 60% de la cartera vencida en el primer mes. Los recordatorios automáticos nos ahorraron horas de llamadas.',
  },
  {
    name: 'Andrés Quintero',
    role: 'Gerente, Ferretería El Tornillo',
    text: 'Antes perdíamos el rastro de las facturas. Ahora cada cliente recibe su link de pago y el abono se refleja solo.',
  },
  {
    name: 'Carolina Vélez',
    role: 'Dueña, Café La Roca',
    text: 'El dashboard de proyección me dice cuánto va a entrar el próximo mes. Planificar nunca fue tan fácil.',
  },
];

const steps = [
  {
    num: '1',
    title: 'Crea tu cuenta',
    desc: 'Registra tu pyme con correo y contraseña. Empiezas con 14 días de prueba gratis.',
  },
  {
    num: '2',
    title: 'Carga clientes y facturas',
    desc: 'Agrégalos uno a uno o impórtalos desde Excel. El sistema calcula los estados automáticamente.',
  },
  {
    num: '3',
    title: 'Conecta tu Wompi',
    desc: 'Pega tus llaves de Wompi en Configuración y cada factura tendrá su link de pago con tu cuenta.',
  },
  {
    num: '4',
    title: 'Programa recordatorios',
    desc: 'Define reglas de cobro por WhatsApp, SMS o email y deja que el sistema cobre por ti.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      <header className="sticky top-0 z-20 bg-white border-b border-surface-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💼</span>
            <span className="font-bold text-tienda-500 text-xl">Pymes Cobranza</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-tienda-500 transition-colors font-medium">Funcionalidades</a>
            <a href="#pricing" className="hover:text-tienda-500 transition-colors font-medium">Precios</a>
            <a href="#how" className="hover:text-tienda-500 transition-colors font-medium">Cómo funciona</a>
            <a href="#testimonials" className="hover:text-tienda-500 transition-colors font-medium">Testimonios</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-tienda-500 px-4 py-2 font-medium transition-colors">
              Entrar
            </Link>
            <Link
              href="/login?mode=register"
              className="bg-tienda-500 text-white text-sm px-5 py-2.5 rounded-2xl font-semibold hover:bg-tienda-600 transition-all shadow-sm hover:shadow-md"
            >
              Registrar pyme
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <span className="tag mb-4">Cobranza inteligente</span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mt-4">
          La forma fácil de cobrarle a tus
          <span className="text-tienda-500"> clientes morosos</span>
        </h1>
        <p className="mt-5 text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
          Pymes Cobranza automatiza tus recordatorios, genera links de pago con Wompi y te
          muestra cuánto vas a recuperar. En minutos, no en días.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login?mode=register"
            className="btn-primary text-base px-8 py-4"
          >
            Empezar prueba gratis de 14 días
          </Link>
          <a
            href="#how"
            className="btn-secondary text-base px-8 py-4"
          >
            Ver cómo funciona
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-400">Sin tarjeta de crédito. Sin contratos.</p>
      </section>

      <section id="features" className="bg-surface-100 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="tag-coral mb-4">Funcionalidades</span>
            <h2 className="text-3xl font-bold mt-3">Todo lo que tu pyme necesita para cobrar</h2>
            <p className="text-gray-500 mt-3">
              Una sola herramienta para ordenar, cobrar y medir tu cartera.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="card">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="tag mb-4">Precios</span>
            <h2 className="text-3xl font-bold mt-3">Precios simples para pymes</h2>
            <p className="text-gray-500 mt-3">
              Plan mensual, cancela cuando quieras. Todos empiezan con 14 días de prueba.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl shadow-soft p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.id === 'pro' 
                    ? 'bg-gradient-to-br from-tienda-500 to-tienda-700 text-white md:-mt-4 shadow-lg' 
                    : 'bg-white border-2 border-surface-200'
                }`}
              >
                <h3 className={`font-bold text-xl ${plan.id === 'pro' ? 'text-white' : 'text-gray-800'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mt-2 ${plan.id === 'pro' ? 'text-white/80' : 'text-gray-500'}`}>
                  {plan.tagline}
                </p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-extrabold">{fmt(plan.price)}</span>
                  <span className={`text-sm mb-1 ${plan.id === 'pro' ? 'text-white/70' : 'text-gray-400'}`}>
                    /mes
                  </span>
                </div>
                <ul className={`mt-6 space-y-3 text-sm flex-1 ${plan.id === 'pro' ? 'text-white/90' : 'text-gray-600'}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className={`mt-0.5 ${plan.id === 'pro' ? 'text-white' : 'text-tienda-500'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login?mode=register"
                  className={`mt-8 text-center py-4 rounded-2xl font-semibold transition-all ${
                    plan.id === 'pro'
                      ? 'bg-white text-tienda-600 hover:bg-gray-100 shadow-md'
                      : 'bg-tienda-500 text-white hover:bg-tienda-600 shadow-sm hover:shadow-md'
                  }`}
                >
                  Empezar prueba gratis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-surface-100 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="tag mb-4">Proceso</span>
            <h2 className="text-3xl font-bold mt-3">Registra tu pyme en 4 pasos</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="card text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-tienda-400 to-tienda-600 text-white flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                  {s.num}
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="tag-coral mb-4">Testimonios</span>
            <h2 className="text-3xl font-bold mt-3">Lo que dicen las pymes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="card">
                <div className="text-amber-400 mb-4 text-lg">★★★★★</div>
                <p className="text-gray-600 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 pt-4 border-t border-surface-200">
                  <p className="font-bold text-gray-800">{t.name}</p>
                  <p className="text-sm text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-tienda-500 to-tienda-700 text-white py-20 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Recupera tu dinero esta semana</h2>
          <p className="text-white/80 mb-8 text-lg">
            14 días gratis. Configura tu cartera en menos de 10 minutos.
          </p>
          <Link
            href="/login?mode=register"
            className="bg-white text-tienda-600 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
          >
            Crear mi pyme gratis
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <span className="font-bold text-white text-lg">Pymes Cobranza</span>
          <span>© {new Date().getFullYear()} — Recupera tu cartera, mejora tu flujo de caja.</span>
          <a href="/super/login" className="hover:text-white text-xs transition-colors">
            Acceso de plataforma
          </a>
        </div>
      </footer>
    </main>
  );
}