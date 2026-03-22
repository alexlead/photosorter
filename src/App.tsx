import { Header } from './components/Header';
import { FilteringPage } from './pages/FilteringPage';

function App() {

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />

      <FilteringPage />
    </div>
  );
}

export default App;