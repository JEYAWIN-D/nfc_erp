import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';

interface WsHeartbeatProps {
  connected: boolean;
}

export function WsHeartbeat({ connected }: WsHeartbeatProps) {
  return (
    <div className="flex items-center gap-1.5">
      {connected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium hidden sm:inline">Live</span>
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <WifiOff className="w-3 h-3 text-red-400" />
          <span className="text-[10px] text-red-400 font-medium hidden sm:inline">Disconnected</span>
        </>
      )}
    </div>
  );
}
