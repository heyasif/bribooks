// src/components/CoverUpload.js

import { useDropzone } from "react-dropzone";

function CoverUpload({ onUpload, label }) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => {
      onUpload(acceptedFiles[0]);
    },
  });

  return (
    <div
      {...getRootProps()}
      style={{ border: "2px dashed gray", padding: 20, textAlign: "center" }}
    >
      <input {...getInputProps()} />
      <p>{label}</p>
    </div>
  );
}

export default CoverUpload;
