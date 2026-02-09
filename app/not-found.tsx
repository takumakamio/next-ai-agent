'use client'

import Link from 'next/link'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-neutral-800 text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Concrete wall texture */}
      <div className="absolute inset-0 bg-[url('/api/placeholder/400/400')] opacity-30"></div>

      {/* Brick pattern overlay */}
      <div className="absolute inset-0 border-t-8 border-b-8 border-neutral-700 opacity-40"></div>
      <div className="absolute left-0 top-32 w-full h-px bg-neutral-700"></div>
      <div className="absolute left-0 top-64 w-full h-px bg-neutral-700"></div>
      <div className="absolute left-0 bottom-32 w-full h-px bg-neutral-700"></div>

      {/* Raw spray paint marks */}
      <div className="absolute top-24 left-12 w-32 h-32 rounded-full bg-red-500 opacity-10 blur-xl"></div>
      <div className="absolute bottom-24 right-12 w-48 h-24 bg-blue-500 opacity-10 blur-xl"></div>
      <div className="absolute top-1/3 right-24 w-20 h-20 bg-yellow-500 opacity-10 blur-xl"></div>

      {/* Spray paint drips */}
      <div className="absolute top-0 left-1/5 w-2 h-32 bg-gradient-to-b from-red-500 to-transparent opacity-70"></div>
      <div className="absolute top-0 left-1/3 w-3 h-48 bg-gradient-to-b from-blue-500 to-transparent opacity-60"></div>
      <div className="absolute top-0 right-1/4 w-2 h-24 bg-gradient-to-b from-green-500 to-transparent opacity-70"></div>
      <div className="absolute top-0 right-2/5 w-1 h-16 bg-gradient-to-b from-yellow-500 to-transparent opacity-60"></div>

      {/* Street tags and markings */}
      <div className="absolute top-16 left-10 transform rotate-12 text-xl font-mono opacity-60">X-43</div>

      <div className="absolute bottom-24 left-12 border-l-2 border-red-500 pl-2 text-xs font-mono opacity-70 transform -rotate-3">
        NO TRESPASSING
      </div>

      {/* Torn articleer effect */}
      <div className="absolute bottom-40 right-8 bg-neutral-200 text-black py-2 px-4 text-sm opacity-60 transform -rotate-6">
        <span className="font-mono uppercase">ERROR</span>
        <div className="absolute top-0 left-0 w-10 h-10 bg-neutral-800 transform -translate-y-6 -translate-x-6 rotate-12"></div>
      </div>

      {/* Main content with vandalized style */}
      <div className="flex flex-col items-center gap-8 p-8 text-center z-10 max-w-xl relative">
        {/* Large "404" tag */}
        <div className="text-9xl font-extrabold tracking-tighter text-white relative">
          <span className="relative inline-block transform -skew-y-3">4</span>
          <span className="relative inline-block transform skew-y-3">0</span>
          <span className="relative inline-block transform -skew-y-6">4</span>
          <div className="absolute inset-0 bg-red-500 blur-md -z-10 opacity-40 transform translate-x-2 translate-y-2"></div>
          <div className="absolute top-1/2 w-full h-1 bg-white opacity-80"></div>
        </div>

        {/* Stenciled message */}
        <div className="my-4 relative bg-black bg-opacity-50 px-4 py-2 border border-white border-opacity-20">
          <p className="text-2xl font-mono tracking-tight uppercase">PAGE NOT FOUND</p>

          {/* Marker scribbles */}
          <div className="absolute -top-6 right-0 text-xl font-mono text-red-400 transform rotate-12">LOST</div>
          <div className="absolute -bottom-8 left-0 text-xl font-mono text-blue-400 transform -rotate-6">BROKEN</div>
        </div>

        <p className="text-xl max-w-lg font-mono text-left bg-white text-black p-4 transform -rotate-1">
          The URL you requested has been destroyed or never existed in the first place.
        </p>

        {/* Stencil-style button that looks spray painted */}
        <Link
          href="/"
          className="mt-6 py-3 px-6 border-2 border-white text-lg font-bold tracking-wider uppercase relative transform -rotate-1 group hover:bg-white hover:text-black transition-all duration-300"
        >
          <span className="relative z-10">GO BACK</span>
          <div className="absolute top-0 left-0 w-full h-full bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 -z-10"></div>
        </Link>

        {/* Street artist tag */}
        <div className="absolute bottom-0 right-0 transform rotate-90 origin-bottom-right text-sm font-mono opacity-80">
          <span className="text-red-400">D</span>
          <span className="text-blue-400">3</span>
          <span className="text-green-400">V</span>
          <span>-</span>
          <span className="ml-1 text-yellow-400">'24</span>
        </div>
      </div>

      {/* Circle-X symbol */}
      <div className="absolute left-12 top-1/3">
        <div className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold">X</span>
        </div>
      </div>

      {/* Crossed arrows */}
      <div className="absolute top-16 right-16 opacity-70">
        <div className="w-8 h-1 bg-white transform rotate-45"></div>
        <div className="w-8 h-1 bg-white transform -rotate-45"></div>
      </div>

      {/* Paint on the floor */}
      <div className="fixed bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-30"></div>
    </div>
  )
}

export default NotFound
