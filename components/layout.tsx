
import { useRouter } from 'next/router';


interface LayoutProps {
  children?: React.ReactNode;
}
export default function Layout({ children }: LayoutProps) {
  const router = useRouter(); // Initialize the router

  const redirectToPapers = () => {
    router.push('/papers'); // Redirect to the /papers route
  };

  const redirectToKeywords = () => {
    router.push('/keywords'); // Redirect to the /papers route
  };


  return (
    <div className="mx-auto flex flex-col space-y-4">
      <header className="container sticky top-0 z-40 bg-white">
        <div className="h-16 border-b border-b-slate-200 py-4">
          <nav className="ml-4 pl-6">
            <a
              href="https://www.galy.co"
              className="hover:text-slate-600 cursor-pointer"
            >
              Home
            </a>
            <a
              href="#"
              className="hover:text-slate-600 cursor-pointer ml-4"
              onClick={redirectToPapers} // Call the redirection function
            >
              Library
            </a>

          </nav>
        </div>
      </header>
      <div>
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

