// src/components/PagePreview.js

function PagePreview({ pages, onSelectPage, currentPage }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {pages.map((page, index) => (
        <div
          key={index}
          onClick={() => onSelectPage(index)}
          style={{
            margin: "5px",
            border: currentPage === index ? "2px solid blue" : "2px solid grey",
            padding: "5px",
          }}
        >
          <img
            src={page.background || page.text}
            alt={`Page ${index + 1}`}
            style={{ width: "100px", height: "auto" }}
          />
        </div>
      ))}
    </div>
  );
}

export default PagePreview;
