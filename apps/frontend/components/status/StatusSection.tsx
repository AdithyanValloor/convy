'use client'

export default function StatusSection() {


    return (
        <div className="h-full w-full p-3 flex flex-col gap-3 shadow">
            
            {/* Title */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-base-content">Status</h1>
            </div>

            {/* Messages Section */}
            <div className="flex-1 overflow-y-auto">
                <div className="rounded-lg shadow-sm h-full">
                   
                </div>
            </div>
        </div>
    )
}
