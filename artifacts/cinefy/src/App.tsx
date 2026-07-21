import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { initTheme } from '@/lib/theme';

import { Navbar } from '@/components/Navbar';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { MovieDetailPage } from '@/pages/MovieDetailPage';
import { ReviewsPage } from '@/pages/ReviewsPage';
import { FavoritesPage } from '@/pages/FavoritesPage';

const queryClient = new QueryClient();

function Router() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/movie/:id" component={MovieDetailPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/reviews" component={ReviewsPage} />
        <Route path="/favorites" component={FavoritesPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
