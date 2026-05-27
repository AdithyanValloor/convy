'use client'

import { Search } from "lucide-react";
import SearchInput from "../GlobalComponents/SearchInput";

export default function CallSection() {

    return (
        <div className="h-full w-full p-3 flex flex-col gap-3 shadow">
            
            {/* Title */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-base-content p-1">Calls</h1>
            </div>

            {/* Search Bar */}
            <SearchInput/>

            {/* Messages Section */}
            <div className="flex-1 overflow-y-auto">
                <div className="rounded-lg shadow-sm h-full">
                   
                </div>
            </div>
        </div>
    )
}
