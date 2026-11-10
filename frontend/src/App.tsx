/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MealProgramProvider } from './context/MealProgramContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PageTransition } from './components/PageTransition';
import type { SupportTab } from './components/SupportModal';
import { useMealProgram } from './context/MealProgramContext';

const Home = lazy(() => import('./pages/Home').then(({ Home }) => ({ default: Home })));
const About = lazy(() => import('./pages/About').then(({ About }) => ({ default: About })));
const Projects = lazy(() => import('./pages/Projects').then(({ Projects }) => ({ default: Projects })));
const CSRTaxBenefits = lazy(() => import('./pages/CSRTaxBenefits').then(({ CSRTaxBenefits }) => ({ default: CSRTaxBenefits })));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(({ ProjectDetail }) => ({ default: ProjectDetail })));
const Contact = lazy(() => import('./pages/Contact').then(({ Contact }) => ({ default: Contact })));
const MealBox = lazy(() => import('./pages/MealBox').then(({ MealBox }) => ({ default: MealBox })));
const TrackMeal = lazy(() => import('./pages/TrackMeal').then(({ TrackMeal }) => ({ default: TrackMeal })));
const LiveTracking = lazy(() => import('./pages/LiveTracking').then(({ LiveTracking }) => ({ default: LiveTracking })));
const ZeptoTracking = lazy(() => import('./pages/ZeptoTracking').then(({ ZeptoTracking }) => ({ default: ZeptoTracking })));
const CelebrateAndGive = lazy(() => import('./pages/CelebrateAndGive').then(({ CelebrateAndGive }) => ({ default: CelebrateAndGive })));
const SupportModal = lazy(() => import('./components/SupportModal').then(({ SupportModal }) => ({ default: SupportModal })));
const CartModal = lazy(() => import('./components/CartModal').then(({ CartModal }) => ({ default: CartModal })));
const NotificationToast = lazy(() => import('./components/NotificationToast').then(({ NotificationToast }) => ({ default: NotificationToast })));

function AppContent() {
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportModalLoaded, setSupportModalLoaded] = useState(false);
  const [supportModalTab, setSupportModalTab] = useState<SupportTab>('donate');
  const [preselectedProject, setPreselectedProject] = useState<string>('all');
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cartModalLoaded, setCartModalLoaded] = useState(false);
  const { pathname } = useLocation();
  const { activeToast } = useMealProgram();

  const handleOpenSupport = (
    tab: SupportTab = 'donate',
    projectSlug: string = 'all'
  ) => {
    if (tab === 'cart') {
      setCartModalLoaded(true);
      setCartModalOpen(true);
    } else {
      setSupportModalTab(tab);
      setPreselectedProject(projectSlug);
      setSupportModalLoaded(true);
      setSupportModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#080808] selection:bg-[#D7262F] selection:text-white">
      <Navbar onOpenSupport={(tab) => handleOpenSupport(tab, 'all')} />

      <Suspense
        fallback={
          <div
            className="flex min-h-[50vh] flex-1 items-center justify-center text-sm text-[#6F6F6F]"
            role="status"
            aria-live="polite"
          >
            Loading page...
          </div>
        }
      >
        <>
          <div className="flex-1">
            <PageTransition>
              <Routes>
                <Route
                  path="/"
                  element={<Home onOpenSupport={handleOpenSupport} />}
                />
                <Route path="/meal-box" element={<MealBox />} />
                <Route path="/track-meal" element={<TrackMeal />} />
                <Route
                  path="/live-tracking/:orderNumber"
                  element={<LiveTracking />}
                />
                <Route
                  path="/zepto-tracking/:orderId"
                  element={<ZeptoTracking />}
                />
                <Route
                  path="/celebrate-and-give"
                  element={<CelebrateAndGive />}
                />
                <Route
                  path="/about"
                  element={<About onOpenSupport={handleOpenSupport} />}
                />
                <Route
                  path="/projects"
                  element={<Projects onOpenSupport={handleOpenSupport} />}
                />
                <Route
                  path="/projects/:slug"
                  element={<ProjectDetail onOpenSupport={handleOpenSupport} />}
                />
                <Route
                  path="/csr-tax-benefits"
                  element={<CSRTaxBenefits onOpenSupport={handleOpenSupport} />}
                />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PageTransition>
          </div>
          <Footer />
        </>
      </Suspense>

      {supportModalLoaded && (
        <Suspense fallback={null}>
          <SupportModal
            isOpen={supportModalOpen}
            onClose={() => setSupportModalOpen(false)}
            initialTab={supportModalTab}
            preselectedProjectSlug={preselectedProject}
          />
        </Suspense>
      )}
      {cartModalLoaded && (
        <Suspense fallback={null}>
          <CartModal
            isOpen={cartModalOpen}
            onClose={() => setCartModalOpen(false)}
          />
        </Suspense>
      )}
      {activeToast && (
        <Suspense fallback={null}>
          <NotificationToast />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MealProgramProvider>
        <AppContent />
      </MealProgramProvider>
    </BrowserRouter>
  );
}
