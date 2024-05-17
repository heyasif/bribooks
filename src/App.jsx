import React, { useState, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { useDropzone } from "react-dropzone";
import axios from "axios";

function App() {
  const initialPages = [
    { id: "front", content: "", type: "cover", label: "Front Cover", text: "" },
  ];
  const [pages, setPages] = useState(
    () => JSON.parse(localStorage.getItem("pages")) || initialPages
  );
  const [currentId, setCurrentId] = useState("front");
  const [errorMessage, setErrorMessage] = useState("");
  const [fontSize, setFontSize] = useState(18);
  const [fontColor, setFontColor] = useState("#000000");
  const [textPosition, setTextPosition] = useState("center");

  useEffect(() => {
    localStorage.setItem("pages", JSON.stringify(pages));
  }, [pages]);

  const validateFileType = (file) => {
    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(
        "Unsupported file type. Please upload a JPEG or PNG image."
      );
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );
    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        formData
      );
      return response.data.url;
    } catch (error) {
      console.error("Failed to upload image to Cloudinary:", error);
      setErrorMessage("Failed to upload image to Cloudinary.");
      return null;
    }
  };

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      return;
    }
    const file = acceptedFiles[0];
    if (validateFileType(file)) {
      const imageUrl = await uploadImageToCloudinary(file);
      if (imageUrl) {
        setPages(
          pages.map((page) =>
            page.id === currentId ? { ...page, content: imageUrl } : page
          )
        );
      }
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => onDrop(files),
    accept: "image/jpeg, image/png",
    multiple: false,
  });

  const handleAddPage = () => {
    const currentPage = pages.find((page) => page.id === currentId);
    if (
      !currentPage.content ||
      (currentPage.type === "content" && !currentPage.text)
    ) {
      setErrorMessage(
        "Please complete the current page before adding a new one."
      );
      return;
    }
    if (currentPage.id === "front" && pages.length === 1) {
      const backCover = {
        id: "back",
        content: "",
        type: "cover",
        label: "Back Cover",
        text: "",
      };
      setPages([...pages, backCover]);
      setCurrentId(backCover.id);
    } else {
      const newPage = {
        id: `page${pages.length}`,
        content: "",
        type: "content",
        label: `Page ${pages.length}`,
        text: "",
      };
      setPages([...pages, newPage]);
      setCurrentId(newPage.id);
    }
    setErrorMessage("");
  };

  const handleClearAll = () => {
    setPages([...initialPages]);
    setCurrentId("front");
    setErrorMessage("");
  };

  const handleTextChange = (event) => {
    const newText = event.target.value;
    setPages(
      pages.map((page) =>
        page.id === currentId ? { ...page, text: newText } : page
      )
    );
  };

  const calculateTextY = (textPosition, pdfPage, margin, fontSize) => {
    let textY;
    if (textPosition === "top") {
      textY = pdfPage.getHeight() - margin - fontSize; // Top position
    } else if (textPosition === "center") {
      textY = (pdfPage.getHeight() - fontSize) / 2; // Center position
    } else if (textPosition === "bottom") {
      textY = margin; // Bottom position
    }
    return textY;
  };

  const drawTextOnPage = (pdfPage, text, fontSize, fontColor, textPosition) => {
    const margin = 20;
    const textWidth = pdfPage.getWidth() - 2 * margin;
    const textX = margin;
    const textY = calculateTextY(textPosition, pdfPage, margin, fontSize);

    pdfPage.drawText(text, {
      x: textX,
      y: textY,
      size: fontSize,
      color: rgb(
        parseInt(fontColor.slice(1, 3), 16) / 255,
        parseInt(fontColor.slice(3, 5), 16) / 255,
        parseInt(fontColor.slice(5, 7), 16) / 255
      ),
      maxWidth: textWidth,
      align: "center",
    });
  };

  const generatePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const inchToPoints = (inches) => inches * 72;

    // KDP Standard Dimensions
    const trimWidth = inchToPoints(6);
    const trimHeight = inchToPoints(9);
    const bleed = inchToPoints(0.125);

    // Ensure correct order: front cover, content pages, back cover
    const orderedPages = [
      ...pages.filter((page) => page.id === "front"),
      ...pages.filter((page) => page.type === "content"),
      ...pages.filter((page) => page.id === "back"),
    ];

    for (const page of orderedPages) {
      const pdfPage = pdfDoc.addPage([
        trimWidth + 2 * bleed,
        trimHeight + 2 * bleed,
      ]);

      // Embed image if it exists
      if (page.content) {
        const imageBytes = await fetch(page.content).then((res) =>
          res.arrayBuffer()
        );
        const image = await pdfDoc.embedJpg(imageBytes);
        pdfPage.drawImage(image, {
          x: -bleed,
          y: -bleed,
          width: pdfPage.getWidth(),
          height: pdfPage.getHeight(),
        });
      }

      // Draw text
      drawTextOnPage(
        pdfPage,
        page.text || "",
        fontSize,
        fontColor,
        textPosition
      );
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "book.pdf";
    link.click();
  };

  const previewPDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const inchToPoints = (inches) => inches * 72;

    // KDP Standard Dimensions
    const trimWidth = inchToPoints(6);
    const trimHeight = inchToPoints(9);
    const bleed = inchToPoints(0.125);

    // Ensure correct order: front cover, content pages, back cover
    const orderedPages = [
      ...pages.filter((page) => page.id === "front"),
      ...pages.filter((page) => page.type === "content"),
      ...pages.filter((page) => page.id === "back"),
    ];

    for (const page of orderedPages) {
      const pdfPage = pdfDoc.addPage([
        trimWidth + 2 * bleed,
        trimHeight + 2 * bleed,
      ]);

      // Embed image if it exists
      if (page.content) {
        const imageBytes = await fetch(page.content).then((res) =>
          res.arrayBuffer()
        );
        const image = await pdfDoc.embedJpg(imageBytes);
        pdfPage.drawImage(image, {
          x: -bleed,
          y: -bleed,
          width: pdfPage.getWidth(),
          height: pdfPage.getHeight(),
        });
      }

      // Draw text
      drawTextOnPage(
        pdfPage,
        page.text || "",
        fontSize,
        fontColor,
        textPosition
      );
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.target = "_blank";
    link.click();
  };

  const getCurrentPage = () =>
    pages.find((p) => p.id === currentId) || pages[0];

  return (
    <div style={{ display: "flex", padding: "20px" }}>
      <div
        style={{
          width: "20%",
          backgroundColor: "#f0f0f0",
          overflowY: "auto",
          paddingRight: "10px",
        }}
      >
        {pages.map((page, index) => (
          <div
            key={index}
            style={{
              padding: "10px",
              cursor: "pointer",
              fontWeight: currentId === page.id ? "bold" : "normal",
              marginBottom: "10px",
              border:
                currentId === page.id ? "2px solid #000" : "1px solid #ccc",
              width: "100px",
              textAlign: "center",
            }}
            onClick={() => setCurrentId(page.id)}
          >
            <img
              src={
                page.content ||
                "https://static.vecteezy.com/system/resources/previews/007/126/739/non_2x/question-mark-icon-free-vector.jpg"
              }
              alt={page.label}
              style={{ width: "100px", height: "auto" }}
            />
            <p style={{ textAlign: "center", fontSize: "small" }}>
              {page.label}
            </p>
          </div>
        ))}
      </div>
      <div style={{ width: "80%", padding: "20px" }}>
        <div
          {...getRootProps()}
          style={{
            border: "2px dashed black",
            padding: "20px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <input {...getInputProps()} />
          <p>Drag 'n' drop an image here, or click to select files</p>
        </div>
        {getCurrentPage().content && (
          <div
            style={{
              position: "relative",
              width: "60%",
              marginBottom: "20px",
              border: "1px solid #ccc",
              margin: "auto",
              height: "75vh",
              overflow: "hidden",
            }}
          >
            <img
              src={getCurrentPage().content}
              alt={getCurrentPage().label}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems:
                  textPosition === "top"
                    ? "flex-start"
                    : textPosition === "bottom"
                    ? "flex-end"
                    : "center",
                justifyContent: "center",
                color: fontColor,
                fontSize: `${fontSize}px`,
                padding: "20px",
                boxSizing: "border-box",
                textAlign: "center",
              }}
            >
              {getCurrentPage().text}
            </div>
          </div>
        )}
        {currentId !== "front" && currentId !== "back" && (
          <div>
            <textarea
              value={getCurrentPage().text}
              onChange={handleTextChange}
              style={{
                width: "100%",
                height: "100px",
                textAlign: "center",
                marginBottom: "20px",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <label style={{ marginRight: "10px" }}>
                Font Size:
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  style={{ marginLeft: "10px" }}
                />
              </label>
              <label style={{ marginRight: "10px" }}>
                Font Color:
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  style={{ marginLeft: "10px" }}
                />
              </label>
              <label style={{ marginRight: "10px" }}>
                Text Position:
                <select
                  value={textPosition}
                  onChange={(e) => setTextPosition(e.target.value)}
                  style={{ marginLeft: "10px" }}
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
              </label>
            </div>
          </div>
        )}
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={handleAddPage}
            style={{ padding: "10px 20px", marginRight: "10px" }}
          >
            Add New Page
          </button>
          <button
            onClick={generatePDF}
            style={{ padding: "10px 20px", marginRight: "10px" }}
          >
            Generate PDF
          </button>
          <button
            onClick={previewPDF}
            style={{ padding: "10px 20px", marginRight: "10px" }}
          >
            Preview PDF
          </button>
          <button onClick={handleClearAll} style={{ padding: "10px 20px" }}>
            Clear All
          </button>
        </div>
        {errorMessage && (
          <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>
        )}
      </div>
    </div>
  );
}

export default App;
