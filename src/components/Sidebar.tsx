import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SidebarProps {
  currentPath: string;
  userEmail: string;
}

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: '🎯', label: 'Generuj', href: '/generate' },
  { icon: '📚', label: 'Moje fiszki', href: '/flashcards' },
  { icon: '🎓', label: 'Sesja nauki', href: '/study' },
  { icon: '📊', label: 'Historia', href: '/history' },
  { icon: '👤', label: 'Profil', href: '/profile' },
];

export default function Sidebar({ currentPath, userEmail }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const isActive = (href: string) => currentPath === href;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Nie udało się wylogować');
      }

      toast.success('Wylogowano pomyślnie');
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      toast.error('Wystąpił błąd podczas wylogowania');
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-background border rounded-md md:hidden"
        aria-label="Toggle menu"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-background border-r flex flex-col transition-all duration-300 z-40',
          // Desktop styles
          'hidden md:flex',
          isExpanded ? 'md:w-64' : 'md:w-16',
          // Mobile styles
          'md:translate-x-0',
          isMobileOpen
            ? 'flex translate-x-0 w-64'
            : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {isExpanded && (
            <h1 className="font-bold text-lg">10x-Cards</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-accent rounded-md hidden md:block"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <span className="text-sm">{isExpanded ? '←' : '→'}</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4" aria-label="Main navigation">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    isActive(item.href)
                      ? 'bg-accent font-semibold'
                      : 'hover:bg-accent/50',
                    !isExpanded && 'justify-center'
                  )}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <span className="text-xl" aria-hidden="true">
                    {item.icon}
                  </span>
                  {isExpanded && (
                    <span className="text-sm">{item.label}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t p-4 mt-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold">
                {userEmail ? userEmail[0].toUpperCase() : '?'}
              </span>
            </div>
            {isExpanded && (
              <div className="text-sm overflow-hidden flex-1 min-w-0">
                <p className="truncate font-medium">{userEmail}</p>
              </div>
            )}
          </div>
          {isExpanded && (
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj się'}
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
