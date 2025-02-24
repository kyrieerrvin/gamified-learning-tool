export default function Home() {
  return (
    <div className="min-h-screen bg-[#235390] relative overflow-hidden">
      {/* Stars Background - We'll use pseudo-elements in CSS */}
      <div className="absolute inset-0" 
        style={{
          backgroundImage: `radial-gradient(white 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          opacity: 0.15
        }}
      />

      {/* Header */}
      <header className="absolute top-0 w-full p-4 flex justify-between items-center">
        <div className="text-white text-2xl font-bold">
          TagalogLearn
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white">SITE LANGUAGE:</span>
          <button className="text-white hover:bg-white/10 px-3 py-1 rounded-lg flex items-center gap-2">
            ENGLISH
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        {/* Globe Illustration */}
        <div className="w-64 h-64 mb-8">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="45" fill="#7CB9E8" />
            <path d="M30,30 Q50,20 70,30 T90,50" fill="#90EE90" />
            <path d="M20,40 Q40,60 60,40 T80,60" fill="#90EE90" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#235390" strokeWidth="2" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-white text-4xl md:text-5xl font-bold text-center mb-12">
          The free, fun, and effective way to learn Tagalog!
        </h1>

        {/* Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-md">
          <button className="bg-[#58CC02] hover:bg-[#61E002] text-white font-bold py-3 rounded-2xl text-lg transition-colors">
            GET STARTED
          </button>
          <button className="bg-[#235390] hover:bg-[#1a3d6e] text-white font-bold py-3 rounded-2xl text-lg border-2 border-white transition-colors">
            I ALREADY HAVE AN ACCOUNT
          </button>
        </div>
      </main>

      {/* Language Selection */}
      <div className="absolute bottom-0 w-full bg-[#1b406e] py-4">
        <div className="flex justify-center items-center gap-4 overflow-x-auto px-4">
          <button className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-lg">
            <span className="w-6 h-6 bg-red-500 rounded"></span>
            TAGALOG
          </button>
          <button className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-lg">
            <span className="w-6 h-6 bg-yellow-500 rounded"></span>
            CEBUANO
          </button>
          <button className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-lg">
            <span className="w-6 h-6 bg-green-500 rounded"></span>
            ILOCANO
          </button>
          <button className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-lg">
            <span className="w-6 h-6 bg-blue-500 rounded"></span>
            HILIGAYNON
          </button>
        </div>
      </div>
    </div>
  );
}