import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User, BookOpen } from 'lucide-react';
import React, { ReactNode } from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state';

const menuItems = [
  { label: 'My Profile', icon: User, to: '/profile' },
  { label: 'My Courses', icon: BookOpen, to: '/learner/courses' },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

const LearnerLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { user, userDetails, signOut } = useAuth();

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* This layout will contain the learner dashboard navigation */}
      <div className="flex flex-col">
        <header className="border-b bg-white">
          <div className="container mx-auto py-4 px-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Learner Dashboard</h1>
            <div className="relative" ref={dropdownRef}>
              <button
                className="focus:outline-none group"
                onClick={() => setOpen((v: boolean) => !v)}
                aria-label="Open user menu"
              >
                <Avatar className="transition-shadow duration-200 group-hover:shadow-lg border border-gray-200">
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userDetails?.name}`} 
                    alt={userDetails?.name || "User"} 
                  />
                  <AvatarFallback>
                    {userDetails?.name ? getInitials(userDetails.name) : <User size={14} />}
                  </AvatarFallback>
                </Avatar>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-white ring-1 ring-black/5 z-50 animate-fade-in">
                  <div className="py-2">
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium leading-none">{userDetails?.name || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {userDetails?.email || ""}
                      </p>
                      {userDetails?.role && (
                        <div className="inline-block px-2 py-1 mt-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
                          {userDetails.role}
                        </div>
                      )}
                    </div>
                    <div className="border-t my-1"></div>
                    {menuItems.map((item) => (
                      <button
                        key={item.label}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => { setOpen(false); navigate(item.to); }}
                      >
                        <item.icon className="h-4 w-4 text-gray-400" />
                        {item.label}
                      </button>
                    ))}
                    <div className="border-t my-2" />
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      onClick={async () => { 
                        setOpen(false);
                        try {
                          await signOut();
                          navigate('/login');
                        } catch (error) {
                          console.error('Error signing out:', error);
                        }
                      }}
                    >
                      <LogOut className="h-4 w-4 text-red-400" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="container mx-auto py-6 px-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LearnerLayout;
