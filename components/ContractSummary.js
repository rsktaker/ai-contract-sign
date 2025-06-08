// components/ContractSummary.js
"use client";

import { useState, useEffect, useRef } from "react";

export default function ContractSummary({ contractJson }) {
  const [summary, setSummary] = useState("Generating summary…");
  const [isLoading, setIsLoading] = useState(false);
  const lastContractRef = useRef(null);

  useEffect(() => {
    // Prevent duplicate calls by checking if contractJson actually changed
    const contractString = JSON.stringify(contractJson);
    if (!contractJson || contractString === lastContractRef.current || isLoading) {
      return;
    }
    
    lastContractRef.current = contractString;
    
    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching summary for contract...");
        const res = await fetch("/api/generateSummary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractJson }),
        });
        const data = await res.json();
        console.log("Summary API response:", data);
        console.log("Raw summary text:", JSON.stringify(data.summary));
        
        // The summary should now come properly formatted from the AI
        const processedSummary = data.summary.trim();
        console.log("Final summary:", JSON.stringify(processedSummary));
        console.log("Summary split by newlines:", processedSummary.split("\n"));
        setSummary(processedSummary);
      } catch (err) {
        console.error("Summary generation error:", err);
        setSummary("Failed to generate summary.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSummary();
  }, [contractJson]); // Simplified dependencies

// XXX: Hopefully this is a bulleted list
  const summaryLines = summary
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 4); // Limit to 4 bullets
  
  console.log("Final processed summary lines:", summaryLines);

  if (isLoading) {
    // XXX: I want a skeleton loading screen here.
    return <div className="text-gray-500">Generating summary...</div>;
  }

  return (
    <ul className="list-disc list-inside space-y-2 text-gray-700">
      {summaryLines.map((line, i) => {
        // Clean the line (no need for complex processing now)
        const cleanLine = line.trim();
        console.log(`Line ${i}:`, JSON.stringify(cleanLine));
        return <li key={i}>{cleanLine}</li>;
      })}
    </ul>
  );
}
