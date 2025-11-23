import { Loader2 } from 'lucide-react';

interface FullPageLoaderProps {
  message?: string;
}

export function FullPageLoader({ message = "Be patient while we are processing your file..." }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6 p-8">
        {/* Animated loader */}
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-purple-600/20" />
        </div>
        
        {/* Message */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            Processing Your Profile
          </h2>
          <p className="text-base text-gray-600 max-w-md">
            {message}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 animate-[loading_2s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Custom animation - inline for component isolation */}
      <style>{`
        @keyframes loading {
          0%, 100% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 100%;
            margin-left: 0%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
