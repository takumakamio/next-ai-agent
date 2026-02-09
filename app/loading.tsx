export default function Loading() {
  return (
    <div className="relative w-full h-screen overflow-hidden animate-pulse">
      {/* Background placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />

      {/* Message board skeleton */}
      <div className="absolute top-4 left-4 md:top-[150px] md:left-[8%] z-20">
        <div className="relative max-w-md md:max-w-lg lg:max-w-xl">
          <div className="bg-slate-800/95 backdrop-blur-sm border-amber-900/80 rounded-lg border-4 md:border-8 shadow-2xl p-4 md:p-6">
            {/* Message skeleton lines */}
            <div className="space-y-3">
              <div className="h-4 bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-700 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom menu skeleton */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="flex gap-2">
          <div className="w-12 h-12 bg-slate-700 rounded-full" />
          <div className="w-12 h-12 bg-slate-700 rounded-full" />
          <div className="w-12 h-12 bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  )
}
