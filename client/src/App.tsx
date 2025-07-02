import { QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import { ThemeProvider } from './components/ThemeProvider';
import { queryClient } from './lib/queryClient';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import Analytics from './pages/Analytics';
import './index.css';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="tiktok-bot-theme">
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background text-foreground">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/create" component={CreatePost} />
            <Route path="/analytics" component={Analytics} />
            <Route>
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                  <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
                </div>
              </div>
            </Route>
          </Switch>
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;