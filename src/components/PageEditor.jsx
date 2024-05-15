// src/components/PageEditor.js

import { useState } from "react";
import { useDropzone } from "react-dropzone";

function PageEditor({ onSave }) {
  const [background, setBackground] = useState(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => {
      const reader = new FileReader();
      reader.onload = (e) => setBackground(e.target.result);
      reader.readAsDataURL(acceptedFiles[0]);
    },
  });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed black",
          padding: 20,
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <input {...getInputProps()} />
        <p>Drag 'n' drop a background image, or click to select files</p>
      </div>
      {background && (
        <div style={{ margin: "10px", textAlign: "center" }}>
          <img
            src={background}
            alt="Background Preview"
            style={{ maxWidth: "100%", maxHeight: "300px" }}
          />
        </div>
      )}
      <button onClick={() => onSave(background)}>Save Page</button>
    </div>
  );
}

export default PageEditor;
