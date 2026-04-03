import { WifiOff, X } from 'lucide-react';


interface Port25WarningBannerProps {
    message: string;
    onDismiss: () => void;
}


/**
 * Warning banner component for blocked port 25 status
 * Displays inline below navigation with recommendation message
 * User can dismiss to hide until next check
 */
export function Port25WarningBanner({ message, onDismiss }: Port25WarningBannerProps) {
    return (
        <div className="bg-orange-50 border-l-4 border-orange-400 px-4 py-3 relative">
            <div className="flex items-start gap-3 max-w-7xl mx-auto">


                {/* Warning Icon */}
                <div className="flex-shrink-0 mt-0.5">
                    <WifiOff className="h-5 w-5 text-orange-600" />
                </div>


                {/* Message Content */}
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-orange-800 mb-1">
                        Port 25 Connectivity Issue
                    </h3>
                    <p className="text-sm text-orange-700">
                        {message}
                    </p>
                </div>


                {/* Dismiss Button */}
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 text-orange-600 hover:text-orange-800 transition-colors cursor-pointer"
                    aria-label="Dismiss warning"
                >
                    <X className="h-5 w-5" />
                </button>

            </div>
        </div>
    );
}
