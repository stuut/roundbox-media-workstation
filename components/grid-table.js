import React, { useState } from "react";

const initialColDefs = [
  { field: "make", width: "100px" },
  { field: "model", width: "100px" },
  { field: "price", width: "100px" },
  { field: "electric", width: "100px" },
];

const initialRowData = [
  { make: "Tesla", model: "Model Y", price: "$64,950", electric: true },
  { make: "Ford", model: "F-Series", price: "$33,850", electric: false },
  { make: "Toyota", model: "Corolla", price: "$29,600", electric: false },
];

export default function GridTable() {
  const [colDefs] = useState(initialColDefs);
  const [rowData] = useState(initialRowData);

  const gridTemplate = colDefs.map((col) => col.width).join(" ");

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: gridTemplate,
    border: "1px solid #ddd",
  };

  const cellStyle = {
    padding: "8px",
    borderBottom: "1px solid #eee",
    borderRight: "1px solid #eee",
    fontSize: "14px",
  };

  return (
    <div style={{ fontFamily: "sans-serif", width: "100%", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ ...gridStyle, fontWeight: "bold", background: "#f8f8f8" }}>
        {colDefs.map((col) => (
          <div key={col.field} style={cellStyle}>
            {col.field}
          </div>
        ))}
      </div>

      {/* Rows */}
      {rowData.map((row, idx) => (
        <div key={idx} style={gridStyle}>
          {colDefs.map((col) => (
            <div key={col.field} style={cellStyle}>
              {String(row[col.field])}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
