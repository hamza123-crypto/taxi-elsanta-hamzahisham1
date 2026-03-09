import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import ProfileSetup from "./components/ProfileSetup";
import Dashboard from "./components/Dashboard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="text-2xl">🛺</div>
          <h2 className="text-xl font-semibold text-blue-600">توك توك السنطة</h2>
        </div>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="flex-1">
        <Content />
      </main>
      <Toaster position="top-center" />
    </div>
  );
}

function Content() {
  const user = useQuery(api.users.getCurrentUser);

  return (
    <div className="w-full">
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🛺</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">توك توك السنطة</h1>
              <p className="text-gray-600">خدمة نقل سريعة وآمنة في مدينة السنطة</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        {user === undefined ? (
          <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : user === null || !user.profile ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-8">
            <ProfileSetup />
          </div>
        ) : (
          <Dashboard user={user} />
        )}
      </Authenticated>
    </div>
  );
}
