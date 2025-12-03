import {Plus, RefreshCw} from "lucide-react";

 type CollectionHeaderProps = {
     onAddCollection: () => void;
     onRefresh: () => void;
 };

 export default function CollectionHeader({onAddCollection, onRefresh}: CollectionHeaderProps) {
     return (
         <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
             <div>
                 <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                     Collection Management
                 </h1>
                 <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                     Manage your team members and their performance
                 </p>
             </div>
             <div className="flex gap-3">
                 <button
                     type="button"
                     onClick={onRefresh}
                     className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                 >
                     <RefreshCw className="w-4 h-4 mr-2"/>
                     Refresh
                 </button>
                 <button
                     type="button"
                     onClick={onAddCollection}
                     className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                 >
                     <Plus className="w-4 h-4 mr-2"/>
                     Add Collection
                 </button>
             </div>
         </div>
     );
 }