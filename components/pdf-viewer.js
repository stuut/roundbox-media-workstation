"use client"
import { useCallback, useState, useEffect } from "react"
import { useResizeObserver } from "@wojtekmaj/react-hooks"
import { pdfjs, Document, Page } from "react-pdf"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"

//import "./Sample.css"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

const options = {
  cMapUrl: "/cmaps/",
  standardFontDataUrl: "/standard_fonts/"
}

const resizeObserverOptions = {}


export const PDFViewer = ({pdfUrl, sizeCallBack, setPageNumberCallBack}) => {

  const [numPages, setNumPages] = useState()
  const [containerRef, setContainerRef] = useState(null)
  const [containerWidth, setContainerWidth] = useState()
  const [pageNumber, setPageNumber] = useState(1);
  const [maxWidth, setMaxWidth] = useState(800)

  const loader = 'pdf loading'




  function onDocumentLoadSuccess(pdfDocument) {
    setNumPages(pdfDocument.numPages);

    // Ensure pdfDocument has the `getPage` method
    if (pdfDocument && pdfDocument.getPage) {
      pdfDocument.getPage(1).then((page) => {
        const { width, height } = page.getViewport({ scale: 1 });
        console.log(width, height)


      });
    } else {
      console.error("PDF document is undefined or missing getPage method.");
    }
  }

  function renderLoader(){
    return(
      <div style={{position:'relative', minHeight:'200px'}}>
        <div className="lds-ring pdf"><div></div><div></div><div></div><div></div></div>
      </div>
    )
  }

  function changePage(offset) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);

  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }


  useEffect(()=>{

    setPageNumberCallBack(pageNumber)

  },[pageNumber])



  const proxiedUrl = `/api/image-proxy?url=${encodeURIComponent(pdfUrl)}`;


  return (
      <>
        <div ref={setContainerRef} style={{position:'relative'}}>

          <Document
            file={proxiedUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={() => renderLoader()}
          >

          <Page pageNumber={pageNumber}
            onRenderSuccess={(page) => {
              console.log('page', page);
              // page.width and page.height are the rendered dimensions
              //setPdfDimensions({ width: page.width, height: page.height });
            }}
          scale={1}

        />
          </Document>
        </div>
        <div className='pdf-buttons' style={{textAlign:'center'}}>
          <p style={{margin:'0px 0px 15px 0px'}}>
            Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
          </p>
          <button
            style={{margin: '0 5px'}}
            className={'btn secondary'}
            disabled={pageNumber <= 1}
            onClick={previousPage}
          >
            Previous
          </button>
          <button
            style={{margin: '0 5px'}}
            className={'btn secondary'}
            disabled={pageNumber >= numPages}
            onClick={nextPage}
          >
            Next
          </button>
        </div>
    </>
  )
}
