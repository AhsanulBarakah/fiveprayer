import { Outlet } from 'react-router';
import SidebarDoc from './SidebarDoc';
import React, { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';

type Props = {}

const DocPage = (props: Props) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleScroll = () => {
      setShowScrollTop(content.scrollTop > 300);
    };

    content.addEventListener('scroll', handleScroll);
    return () => content.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex" style={{ height: 'calc(100vh - 52px)' }}>
      <SidebarDoc contentRef={contentRef} />
      <div ref={contentRef} className="flex-1 p-6 overflow-y-auto relative">
        <Outlet />
        <button
          onClick={scrollToTop}
          type="button"
          title={__('Scroll to top', 'fiveprayer')}
          aria-label={__('Scroll to top', 'fiveprayer')}
          className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
            showScrollTop
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : 'translate-y-4 opacity-0 pointer-events-none'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      <style>{`
        /* Hide scrollbar on the content area only */
        .overflow-y-auto::-webkit-scrollbar { display: none; }
        .overflow-y-auto { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default DocPage;