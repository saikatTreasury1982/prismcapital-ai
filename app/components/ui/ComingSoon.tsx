import { getFeatureMessage } from '@/app/config/features';

interface ComingSoonProps {
  featureName: string;
  title?: string;
}

export function ComingSoon({ featureName, title }: ComingSoonProps) {
  const message = getFeatureMessage(featureName);
  
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        
        {title && (
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
        )}
        
        <p className="text-lg text-gray-600 mb-8">{message}</p>
        
        <div className="inline-flex items-center gap-2 text-blue-600">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Under Development</span>
        </div>
      </div>
    </div>
  );
}