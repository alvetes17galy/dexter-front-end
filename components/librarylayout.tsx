
import { useRouter } from 'next/router';


interface LayoutProps {
    children?: React.ReactNode;
}
export default function Layout({ children }: LayoutProps) {
    const router = useRouter(); // Initialize the router

    const redirectToPapers = () => {
        router.push('/'); // Redirect to the /papers route
    };
    return (
        <div className="mx-auto flex flex-col space-y-4">
            <header className="container sticky top-0 z-40 bg-white">
                <div className="w-full h-16 border-b border-b-slate-200 py-4">
                    <nav className="ml-4 pl-6">
                        <a
                            href="https://www.galy.co"
                            className="hover:text-slate-600 cursor-pointer"
                        >
                            Home
                        </a>
                        <a
                            href="#"
                            className="hover:text-slate-600 cursor-pointer ml-4" // Add margin here
                            onClick={redirectToPapers} // Call the redirection function
                        >
                            Dexter
                        </a>
                    </nav>
                </div>
            </header>
            <div className="mx-auto">
                <main className="flex w-full flex-1 flex-col overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}

