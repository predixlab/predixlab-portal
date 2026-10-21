import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";

// Public pages
import HomePage from "@/pages/HomePage";
import PricingPage from "@/pages/PricingPage";
import QuantitativeStockScreenerPage from "@/pages/QuantitativeStockScreenerPage";
import AboutPage from "@/pages/AboutPage";
import LegalPage from "@/pages/LegalPage";
import NotFoundPage from "@/pages/NotFoundPage";
import StockSignalsPage from "@/pages/StockSignalsPage";
import UnusualOptionsActivityPage from "@/pages/UnusualOptionsActivityPage";
import MarkdownPage from "@/pages/MarkdownPage";
import BlogPage from "@/pages/BlogPage";
import { sitePages, type PageKey } from "@/routing";

const pages: Record<PageKey, ReactNode> = {
  home: <HomePage />,
  pricing: <PricingPage />,
  about: <AboutPage />,
  stockSignals: <StockSignalsPage />,
  stockScreener: <QuantitativeStockScreenerPage />,
  unusualOptions: <UnusualOptionsActivityPage />,
  terms: <LegalPage type="terms" />,
  privacy: <LegalPage type="privacy" />,
  methodology: <MarkdownPage />,
  openSource: <MarkdownPage />,
  blog: <BlogPage />,
  blogPost: <MarkdownPage />,
};

function App() {
  return (
    <Layout>
      <Routes>
        {sitePages.map((page) => (
          <Route key={page.path} path={page.path} element={pages[page.key]} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
