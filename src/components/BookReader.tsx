import React, { useState, useEffect } from 'react';
import { BookOpen, Columns, Columns2, ZoomIn, ZoomOut, Download, AlertCircle } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';


// Set up the worker for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function BookReader({ book }) {
  const [twoPageView, setTwoPageView] = useState(false);
  
  // PDF state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfError, setPdfError] = useState(false);

  const textContent = book.content?.trim();
  const driveLink = book.driveLink;

  // Function to build a proxy URL for the PDF
  const getPdfUrl = (url: string) => {
    let downloadUrl = url;
    // Attempt to parse drive link and convert to download link
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      downloadUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }
    // We proxy it to avoid CORS issues
    return `/api/proxy-pdf?url=${encodeURIComponent(downloadUrl)}`;
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPdfError(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setPdfError(true);
  }

  const nextPdfPage = () => {
    if (numPages && pageNumber + (twoPageView ? 2 : 1) <= numPages) {
      setPageNumber(pageNumber + (twoPageView ? 2 : 1));
    } else if (numPages && pageNumber < numPages) {
      setPageNumber(numPages);
    }
  };

  const prevPdfPage = () => {
    if (pageNumber - (twoPageView ? 2 : 1) >= 1) {
      setPageNumber(pageNumber - (twoPageView ? 2 : 1));
    } else {
      setPageNumber(1);
    }
  };

  // If we have a drive link but no text content, try rendering it as a PDF
  if (!textContent && driveLink) {
    // If react-pdf fails, we fallback to iframe
    if (pdfError) {
      let iframeSrc = driveLink;
      if (!iframeSrc.startsWith('http') && !iframeSrc.includes('/')) {
        iframeSrc = `https://drive.google.com/file/d/${iframeSrc}/preview`;
      } else {
        const driveMatch = iframeSrc.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || iframeSrc.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (driveMatch) {
          iframeSrc = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
        } else {
          const docsMatch = iframeSrc.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
          if (docsMatch) {
            iframeSrc = `https://docs.google.com/document/d/${docsMatch[1]}/preview`;
          }
        }
      }
      return (
        <div className="w-full h-full flex flex-col bg-white">
           <div className="flex-1 w-full flex items-center justify-center">
            <iframe 
              src={iframeSrc}
              className="w-full h-full border-0 bg-white"
              allow="autoplay; fullscreen" allowFullScreen
            />
           </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col bg-white text-[#003828]">
        <div className="flex justify-between items-center p-3 border-b border-stone-200 bg-white">
          <div className="text-sm font-medium text-stone-500">
            {numPages ? (
              <>Page {pageNumber} {twoPageView && pageNumber < numPages && `- ${pageNumber + 1}`} of {numPages}</>
            ) : (
              'Loading PDF...'
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex gap-2 bg-stone-100 p-1 rounded-lg">
              <button 
                onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                className="p-1.5 rounded-full transition-colors text-stone-400 hover:text-stone-600"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button 
                onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
                className="p-1.5 rounded-full transition-colors text-stone-400 hover:text-stone-600"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            <div className="flex gap-2 bg-stone-100 p-1 rounded-lg">
              <button 
                onClick={() => { setTwoPageView(false); setPageNumber(p => Math.max(1, p - (p % 2 === 0 ? 1 : 0))); }}
                className={`p-1.5 rounded-full transition-colors ${!twoPageView ? 'bg-white shadow-sm text-[#003828]' : 'text-stone-400 hover:text-stone-600'}`}
                title="Single Page View"
              >
                <Columns size={18} />
              </button>
              <button 
                onClick={() => { setTwoPageView(true); setPageNumber(p => p % 2 === 0 ? Math.max(1, p - 1) : p); }}
                className={`p-1.5 rounded-full transition-colors ${twoPageView ? 'bg-white shadow-sm text-[#003828]' : 'text-stone-400 hover:text-stone-600'}`}
                title="Two Page View"
              >
                <Columns2 size={18} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 md:p-8 flex items-center justify-center bg-white">
          <Document
            file={getPdfUrl(driveLink)}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-64 text-stone-500 animate-pulse">
                Preparing PDF...
              </div>
            }
            className="flex gap-8 justify-center max-w-full"
          >
            <div className="shadow-2xl flex">
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="bg-white"
              />
            </div>
            {twoPageView && pageNumber < (numPages || 1) && (
              <div className="shadow-2xl flex hidden md:flex">
                <Page 
                  pageNumber={pageNumber + 1} 
                  scale={scale} 
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="bg-white"
                />
              </div>
            )}
          </Document>
        </div>
        
        <div className="flex justify-between items-center p-4 border-t border-stone-200 bg-white">
          <button 
            onClick={prevPdfPage}
            disabled={pageNumber <= 1}
            className="px-6 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:hover:bg-stone-100 rounded-full font-medium transition-colors"
          >
            Previous
          </button>
          <button 
            onClick={nextPdfPage}
            disabled={numPages ? (twoPageView ? pageNumber + 1 >= numPages : pageNumber >= numPages) : true}
            className="px-6 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:hover:bg-stone-100 rounded-full font-medium transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // --- NATIVE TEXT RENDERER ---
  const content = textContent || "No text content provided for this book. Please edit the book and paste the text content to use the reader.";
  
  // Very simplistic page splitting based on character chunks for demo purposes
  const charsPerPage = 1200;
  const pages = [];
  for (let i = 0; i < content.length; i += charsPerPage) {
    pages.push(content.substring(i, i + charsPerPage));
  }
  
  const [currentTextPage, setCurrentTextPage] = useState(0);

  const nextTextPage = () => {
    if (twoPageView) {
      if (currentTextPage + 2 < pages.length) setCurrentTextPage(currentTextPage + 2);
    } else {
      if (currentTextPage + 1 < pages.length) setCurrentTextPage(currentTextPage + 1);
    }
  };

  const prevTextPage = () => {
    if (twoPageView) {
      if (currentTextPage - 2 >= 0) setCurrentTextPage(currentTextPage - 2);
    } else {
      if (currentTextPage - 1 >= 0) setCurrentTextPage(currentTextPage - 1);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white text-[#003828]">
      <div className="flex justify-between items-center p-3 border-b border-stone-200 bg-white">
        <div className="text-sm font-medium text-stone-500">
          Page {currentTextPage + 1} {twoPageView && currentTextPage + 1 < pages.length && `- ${currentTextPage + 2}`} of {pages.length}
        </div>
        <div className="flex gap-2 bg-stone-100 p-1 rounded-lg">
          <button 
            onClick={() => { setTwoPageView(false); setCurrentTextPage(Math.floor(currentTextPage/2)*2); }}
            className={`p-1.5 rounded-full transition-colors ${!twoPageView ? 'bg-white shadow-sm text-[#003828]' : 'text-stone-400 hover:text-stone-600'}`}
            title="Single Page View"
          >
            <Columns size={18} />
          </button>
          <button 
            onClick={() => setTwoPageView(true)}
            className={`p-1.5 rounded-full transition-colors ${twoPageView ? 'bg-white shadow-sm text-[#003828]' : 'text-stone-400 hover:text-stone-600'}`}
            title="Two Page View"
          >
            <Columns2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 md:p-8 flex items-center justify-center">
        <div className={`w-full max-w-5xl flex gap-8 h-full`}>
          {/* Page 1 */}
          <div className="flex-1 bg-white shadow-md p-8 md:p-12 rounded-lg relative min-h-[60vh] flex flex-col">
             <p className="text-justify leading-relaxed text-lg font-serif whitespace-pre-wrap text-[#003828]">
                {pages[currentTextPage]}
             </p>
             <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-stone-400">
               - {currentTextPage + 1} -
             </div>
          </div>
          
          {/* Page 2 */}
          {twoPageView && (
            <div className="flex-1 bg-white shadow-md p-8 md:p-12 rounded-lg relative min-h-[60vh] flex flex-col hidden md:flex">
              {currentTextPage + 1 < pages.length ? (
                <>
                  <p className="text-justify leading-relaxed text-lg font-serif whitespace-pre-wrap text-[#003828]">
                    {pages[currentTextPage + 1]}
                  </p>
                  <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-stone-400">
                    - {currentTextPage + 2} -
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-stone-300 italic">
                  End of book
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center p-4 border-t border-stone-200 bg-white">
        <button 
          onClick={prevTextPage}
          disabled={currentTextPage === 0}
          className="px-6 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:hover:bg-stone-100 rounded-full font-medium transition-colors"
        >
          Previous
        </button>
        <button 
          onClick={nextTextPage}
          disabled={twoPageView ? currentTextPage + 2 >= pages.length : currentTextPage + 1 >= pages.length}
          className="px-6 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:hover:bg-stone-100 rounded-full font-medium transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
