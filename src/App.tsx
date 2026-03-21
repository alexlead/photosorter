import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { FilteringPage } from './pages/FilteringPage';

function App() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />

      <FilteringPage />
    </div>
  );
}

export default App;