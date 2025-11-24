export default function AlertCardSkeleton() {
    return (
        <div className="card border border-base-300 border-l-4 shadow-sm animate-pulse" style={{ backgroundColor: '#161616' }}>
            <div className="card-body p-4">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-[280px] space-y-3">
                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="h-5 w-20 bg-[#2C2C2C] rounded"></div>
                            <div className="h-5 w-24 bg-[#2C2C2C] rounded"></div>
                            <div className="h-5 w-20 bg-[#2C2C2C] rounded"></div>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <div className="h-4 bg-[#2C2C2C] rounded w-full"></div>
                            <div className="h-4 bg-[#2C2C2C]/60 rounded w-3/4"></div>
                        </div>

                        {/* Publisher info */}
                        <div className="h-4 bg-[#2C2C2C]/40 rounded w-2/3"></div>

                        {/* Timestamps */}
                        <div className="space-y-1">
                            <div className="h-3 bg-[#2C2C2C]/30 rounded w-1/2"></div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-24 bg-[#2C2C2C] rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
