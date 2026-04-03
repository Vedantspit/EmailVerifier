import { Wifi, WifiOff, Loader2, HelpCircle } from 'lucide-react';


export type Port25Status = 'checking' | 'open' | 'closed' | 'unknown';


interface Port25BadgeProps {
    status: Port25Status;
    onClick: () => void;
    disabled?: boolean;
}


/**
 * Port 25 connectivity status badge component
 * Displays current port 25 status with appropriate icon and color
 * Clickable to trigger re-check
 */
export function Port25Badge({ status, onClick, disabled = false }: Port25BadgeProps) {


    // Get badge configuration based on status
    const getBadgeConfig = () => {
        switch (status) {
            case 'checking':
                return {
                    icon: Loader2,
                    label: 'Checking...',
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-700',
                    borderColor: 'border-blue-300',
                    iconClass: 'animate-spin'
                };
            case 'open':
                return {
                    icon: Wifi,
                    label: 'Port 25 Open',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-700',
                    borderColor: 'border-green-300',
                    iconClass: ''
                };
            case 'closed':
                return {
                    icon: WifiOff,
                    label: 'Port 25 Blocked',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-700',
                    borderColor: 'border-red-300',
                    iconClass: ''
                };
            case 'unknown':
            default:
                return {
                    icon: HelpCircle,
                    label: 'Check Port 25',
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-600',
                    borderColor: 'border-gray-300',
                    iconClass: ''
                };
        }
    };

    const config = getBadgeConfig();
    const Icon = config.icon;


    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                inline-flex items-center gap-1.5
                px-3 py-1.5
                rounded-md
                border
                ${config.bgColor}
                ${config.textColor}
                ${config.borderColor}
                text-xs md:text-sm
                font-medium
                transition-all duration-300
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80 active:scale-[0.98]'}
            `}
            title={`Port 25 Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`}
        >
            <Icon
                size={16}
                className={config.iconClass}
            />
            <span className="hidden md:inline">
                {config.label}
            </span>
        </button>
    );
}
