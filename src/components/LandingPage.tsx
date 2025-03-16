import React, { useState, useEffect } from 'react';
import {
  Wallet, Shield, ArrowRight, DollarSign, BarChart2, PiggyBank,
  TrendingUp, ChevronRight, CheckCircle, CreditCard, LineChart,
  Sparkles, PieChart, Star, BadgeCheck
} from 'lucide-react';

// Interfaces para os componentes
interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface TestimonialProps {
  author: string;
  role: string;
  quote: string;
  rating: number;
  image?: string;
}

interface StatProps {
  value: string;
  label: string;
  icon: React.ReactNode;
}

// Componentes de UI reutilizáveis
const AnimatedIcon: React.FC<{icon: React.ReactNode}> = ({ icon }) => {
  return (
    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full mb-4 transform hover:scale-110 transition-all duration-300">
      {icon}
    </div>
  );
};

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px]">
    <AnimatedIcon icon={icon} />
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Testimonial: React.FC<TestimonialProps> = ({ author, role, quote, rating, image }) => (
  <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
    <div className="flex items-center mb-4 text-yellow-400">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`h-5 w-5 ${i < rating ? 'fill-current' : ''}`} />
      ))}
    </div>
    <p className="text-gray-700 italic mb-6 text-lg">"{quote}"</p>
    <div className="flex items-center">
      <div className="flex-shrink-0 mr-3">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
          {image ? <img src={image} alt={author} className="w-12 h-12 rounded-full" /> : author.charAt(0)}
        </div>
      </div>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-gray-600">{role}</p>
      </div>
    </div>
  </div>
);

const Stat: React.FC<StatProps> = ({ value, label, icon }) => (
  <div className="flex flex-col items-center">
    <div className="flex items-center mb-2">
      <div className="mr-2 text-white">
        {icon}
      </div>
      <span className="text-3xl font-bold text-white">{value}</span>
    </div>
    <span className="text-white text-center font-medium">{label}</span>
  </div>
);

const HeroAnimation = () => {
  // Simulação de componentes de gráficos e estatísticas
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-lg transform rotate-6 animate-pulse"></div>
      <div className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl shadow-lg transform -rotate-3 animate-pulse" style={{animationDelay: "1s"}}></div>
      <div className="absolute bottom-10 right-20 w-28 h-28 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-lg transform rotate-12 animate-pulse" style={{animationDelay: "1.5s"}}></div>
      <div className="absolute bottom-20 left-20 w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl shadow-lg transform -rotate-6 animate-pulse" style={{animationDelay: "0.5s"}}></div>
      <div className="relative z-10 w-full h-full bg-white/50 backdrop-blur-sm rounded-2xl shadow-2xl p-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-xl"></div>
          <div className="bg-white p-4 rounded-b-xl shadow-inner">
            <div className="w-full h-6 bg-gray-100 rounded-full mb-3"></div>
            <div className="w-2/3 h-6 bg-gray-100 rounded-full mb-3"></div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="h-16 bg-blue-50 rounded-lg"></div>
              <div className="h-16 bg-green-50 rounded-lg"></div>
            </div>
            <div className="h-24 bg-gray-50 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  
  useEffect(() => {
    setShowAnimation(true);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navbar */}
      <header className="relative z-10 py-4 px-6 md:px-10 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/treqy-logo.svg" alt="Treqy Logo" className="h-20" />
        </div>
        <button
          onClick={onGetStarted}
          className="px-4 py-2 rounded-full bg-blue-100 text-blue-600 font-medium hover:bg-blue-200 transition-colors flex items-center text-sm"
        >
          Iniciar Sessão
          <ChevronRight className="ml-1 h-4 w-4" />
        </button>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${showAnimation ? 'animate-fadeIn' : 'opacity-0'}`} style={{animationDuration: '1s'}}>
          <div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="block">Controle Total das</span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Suas Finanças</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Revolucione a forma como gere o seu dinheiro com uma plataforma completa de gestão financeira. Monitorize despesas, defina orçamentos e alcance os seus objetivos financeiros.  
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border border-blue-200 hover:bg-blue-50 transition-all"
              >
                Ver Demonstração
                <LineChart className="ml-2 h-5 w-5" />
              </button>
            </div>
            <div className="mt-8 flex items-center space-x-6">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-${200 + i*100} to-indigo-${200 + i*100} flex items-center justify-center text-xs text-white`}>U</div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">+100</span> utilizadores satisfeitos
              </div>
            </div>
          </div>
          <div className="h-[500px] relative hidden lg:block">
            <HeroAnimation />
          </div>
        </div>
      </div>



      {/* Main Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-3">
            <Sparkles className="h-4 w-4 inline-block mr-1" />
            Funcionalidades Poderosas
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Tudo o que precisa para gerir as suas finanças</h2>
          <p className="text-xl text-gray-600">A nossa plataforma completa inclui todas as ferramentas necessárias para maximizar o seu potencial financeiro.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Feature
            icon={<Wallet className="h-8 w-8 text-blue-600" />}
            title="Gestão de Despesas"
            description="Registe todas as suas compras com categorização detalhada e acompanhe o seu progresso orçamental em tempo real."
          />
          <Feature
            icon={<DollarSign className="h-8 w-8 text-blue-600" />}
            title="Controlo de Rendimentos"
            description="Acompanhe todas as suas fontes de rendimento e mantenha um registo claro das suas entradas de dinheiro mensais."
          />
          <Feature
            icon={<PiggyBank className="h-8 w-8 text-blue-600" />}
            title="Gestão de Poupanças"
            description="Estabeleça objetivos de poupança e monitorize o seu progresso para alcançar a estabilidade financeira."
          />
          <Feature
            icon={<BarChart2 className="h-8 w-8 text-blue-600" />}
            title="Análises Detalhadas"
            description="Visualize os seus padrões de gastos através de gráficos interativos e relatórios personalizados."
          />
          <Feature
            icon={<TrendingUp className="h-8 w-8 text-blue-600" />}
            title="Previsões Financeiras"
            description="Antecipe tendências futuras com base nos seus hábitos de gastos e defina metas realistas de poupança."
          />
          <Feature
            icon={<CreditCard className="h-8 w-8 text-blue-600" />}
            title="Gestão de Cartões"
            description="Mantenha-se a par dos seus gastos com cartões e identifique facilmente os padrões de consumo para otimizar gastos."
          />
        </div>
      </div>

      {/* How it works section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mb-3">
              <CheckCircle className="h-4 w-4 inline-block mr-1" />
              Processo Simples
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Como funciona</h2>
            <p className="text-xl text-gray-600">Em poucos passos simples, comece a organizar e otimizar a sua vida financeira.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/4 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            
            <div className="relative z-10">
              <div className="bg-white rounded-xl shadow-lg p-8 h-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mb-6">1</div>
                <h3 className="text-xl font-bold mb-4">Crie a sua conta</h3>
                <p className="text-gray-600 mb-4">Registre-se gratuitamente em menos de 1 minuto e aceda à plataforma completa de finanças pessoais.</p>
                <div className="flex items-center text-blue-600 font-medium">
                  <span>Comece Agora</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="bg-white rounded-xl shadow-lg p-8 h-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mb-6">2</div>
                <h3 className="text-xl font-bold mb-4">Configure o seu perfil</h3>
                <p className="text-gray-600 mb-4">Defina os seus orçamentos, categorias personalizadas e objetivos financeiros para maximizar os resultados.</p>
                <div className="flex items-center text-blue-600 font-medium">
                  <span>Personalizar</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="bg-white rounded-xl shadow-lg p-8 h-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mb-6">3</div>
                <h3 className="text-xl font-bold mb-4">Acompanhe e Otimize</h3>
                <p className="text-gray-600 mb-4">Monitorize o seu progresso, obtenha insights personalizados e veja o seu dinheiro crescer.</p>
                <div className="flex items-center text-blue-600 font-medium">
                  <span>Ver Resultados</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Benefits Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Benefícios Adicionais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md flex items-start">
              <div className="p-3 bg-blue-50 rounded-full mr-4">
                <BarChart2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Orçamentos Mensais e Anuais</h3>
                <p className="text-gray-600">Planeie as suas finanças com orçamentos flexíveis que se adaptam às suas necessidades ao longo do tempo.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex items-start">
              <div className="p-3 bg-blue-50 rounded-full mr-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Segurança e Privacidade</h3>
                <p className="text-gray-600">Os seus dados financeiros são protegidos com segurança de nível empresarial e encriptação avançada.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex items-start">
              <div className="p-3 bg-blue-50 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Analise de Extratos Bancários</h3>
                <p className="text-gray-600">Obtenha informações diretamente dos seus extratos bancários e veja onde gasta o seu dinheiro.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex items-start">
              <div className="p-3 bg-blue-50 rounded-full mr-4">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Visão Global das Finanças</h3>
                <p className="text-gray-600">Tenha uma visão completa de toda a sua situação financeira num só lugar, facilitando a tomada de decisões.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Confiado por utilizadores em todo o País
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {['100+', '87%', '24/7', '18'].map((stat, index) => (
                <div key={index} className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-blue-600">{stat}</span>
                  <span className="text-gray-600 mt-2">
                    {index === 0 && 'Utilizadores Ativos'}
                    {index === 1 && 'Satisfação'}
                    {index === 2 && 'Suporte'}
                    {index === 3 && 'Distritos'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mb-3">
            <Star className="h-4 w-4 inline-block mr-1" />
            O Que Dizem os Nossos Utilizadores
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Confiança de milhares de utilizadores</h2>
          <p className="text-xl text-gray-600">Veja como a nossa plataforma tem ajudado pessoas reais a transformar a sua relação com o dinheiro.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Testimonial
            quote="Desde que comecei a usar esta aplicação, finalmente consegui atingir as minhas metas de poupança. Interface intuitiva e excelentes ferramentas de análise!"
            author="Ana Silva"
            role="Designer, Lisboa"
            rating={5}
          />
          <Testimonial
            quote="Excelente para gerir as finanças familiares! Consigo acompanhar todos os gastos e partilhar com o meu parceiro. Finalmente encontramos equilíbrio no orçamento!"
            author="Carlos Oliveira"
            role="Engenheiro, Porto"
            rating={5}
          />
          <Testimonial
            quote="A melhor parte são os gráficos de análise que mostram exatamente para onde está a ir o meu dinheiro. As notificações ajudam-me a manter o foco."
            author="Marta Santos"
            role="Professora, Coimbra"
            rating={4}
          />
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-500 bg-opacity-30 text-white mb-3">
              <BadgeCheck className="h-4 w-4 inline-block mr-1" />
              Resultados Comprovados
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Números que falam por si</h2>
            <p className="text-xl text-blue-100">Explore o impacto que temos nas finanças pessoais dos nossos utilizadores.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Stat 
              value="1.5K+" 
              label="Transações Monitorizadas" 
              icon={<PieChart className="h-6 w-6 text-white" />}
            />
            <Stat 
              value="87%" 
              label="Satisfação dos Utilizadores" 
              icon={<Star className="h-6 w-6 text-white" />}
            />
            <Stat 
              value="15%" 
              label="Aumento Médio de Poupanças" 
              icon={<TrendingUp className="h-6 w-6 text-white" />}
            />
            <Stat 
              value="100+" 
              label="Utilizadores Ativos" 
              icon={<Shield className="h-6 w-6 text-white" />}
            />
          </div>
        </div>
      </div>

      {/* Call-to-Action Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-8 md:p-16 shadow-lg relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-100 opacity-20"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-indigo-100 opacity-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para tomar controlo das suas finanças?</h2>
              <p className="text-xl text-gray-600 mb-8">
                Junte-se aos nossos primeiros utilizadores e comece a poupar mais e a gastar de forma mais inteligente. Comece hoje mesmo, é gratuito!  
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border border-blue-200 hover:bg-blue-50 transition-all"
                >
                  Ver Demonstração
                </button>
              </div>
            </div>
            <div className="hidden md:block w-64 h-64 bg-white rounded-2xl shadow-xl transform rotate-3 p-4">
              <div className="h-full w-full bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Wallet className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <p className="font-bold text-lg text-blue-800">Comece Hoje</p>
                  <p className="text-blue-600 text-sm">Sua jornada financeira espera</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src="/treqy-logo.svg" alt="Treqy Logo" className="h-16" />
            </div>
            <div className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Treqy. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;