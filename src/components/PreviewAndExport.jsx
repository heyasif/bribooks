// src/components/PreviewAndExport.js

import { PDFDownloadLink, Document, Page, Image } from "@react-pdf/renderer";

const PreviewAndExport = ({ pages }) => {
  const MyDocument = () => (
    <Document>
      {pages.map((page, index) => (
        <Page size="A4" key={index}>
          <Image
            src={page.background}
            style={{ width: "100%", height: "100%" }}
          />
        </Page>
      ))}
    </Document>
  );

  return (
    <div>
      <PDFDownloadLink document={<MyDocument />} fileName="book.pdf">
        {({ blob, url, loading, error }) =>
          loading ? "Loading document..." : "Download PDF"
        }
      </PDFDownloadLink>
      <button onClick={() => window.print()}>Print</button>
    </div>
  );
};

export default PreviewAndExport;
