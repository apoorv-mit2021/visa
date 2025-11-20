import { motion } from "framer-motion";

export default function Loader() {
    return (
        <div className="flex items-center justify-center h-screen w-full bg-gray-50 dark:bg-gray-900">
            <motion.div
                className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                    repeat: Infinity,
                    duration: 1,
                    ease: "linear",
                }}
            />
        </div>
    );
}
