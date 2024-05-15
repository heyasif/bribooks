// src/components/TextEditor.js

import { useState } from "react";

function TextEditor({ onSave }) {
  const [text, setText] = useState("");

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", minHeight: "100px" }}
        placeholder="Start typing here..."
      />
      <button onClick={() => onSave(text)}>Save Text</button>
    </div>
  );
}

export default TextEditor;
