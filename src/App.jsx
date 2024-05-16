import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
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

  const handleTextChange = (text) => {
    setPages(
      pages.map((page) =>
        page.id === currentId ? { ...page, text: text } : page
      )
    );
  };

  const generatePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    for (const page of pages) {
      const pdfPage = pdfDoc.addPage();
      if (page.content) {
        const imageBytes = await fetch(page.content).then((res) =>
          res.arrayBuffer()
        );
        const image = await pdfDoc.embedJpg(imageBytes);
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: pdfPage.getWidth(),
          height: pdfPage.getHeight(),
        });
      }
      pdfPage.drawText(page.text || "", { x: 50, y: 50, size: 18 });
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "book.pdf";
    link.click();
  };

  const getCurrentPage = () =>
    pages.find((p) => p.id === currentId) || pages[0];

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => onDrop(files),
    accept: "image/jpeg, image/png",
    multiple: false,
  });

  return (
    <div style={{ display: "flex" }}>
      <div
        style={{ width: "20%", backgroundColor: "#f0f0f0", overflow: "auto" }}
      >
        {pages.map((page, index) => (
          <div
            key={index}
            style={{
              padding: "10px",
              cursor: "pointer",
              fontWeight: currentId === page.id ? "bold" : "normal",
            }}
            onClick={() => setCurrentId(page.id)}
          >
            <img
              src={
                page.content ||
                "https://static.vecteezy.com/system/resources/previews/007/126/739/non_2x/question-mark-icon-free-vector.jpg"
              } // Placeholder if no content
              alt={page.label}
              style={{ width: "100%", height: "auto" }}
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
          }}
        >
          <input {...getInputProps()} />
          <p>Drag 'n' drop an image here, or click to select files</p>
        </div>
        {getCurrentPage().content && (
          <img
            src={getCurrentPage().content}
            alt={getCurrentPage().label}
            style={{ maxWidth: "100%", maxHeight: "500px" }}
          />
        )}
        <textarea
          value={getCurrentPage().text}
          onChange={(e) => handleTextChange(e.target.value)}
          style={{ width: "100%", height: "100px" }}
        />
        <div style={{ marginTop: "20px" }}>
          <button onClick={handleAddPage} style={{ marginRight: "10px" }}>
            Add New Page
          </button>
          <button onClick={generatePDF} style={{ marginRight: "10px" }}>
            Generate PDF
          </button>
          <button onClick={handleClearAll}>Clear All</button>
        </div>
        {errorMessage && (
          <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>
        )}
      </div>
    </div>
  );
}

export default App;
