import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/common";
import { JournalParsingDebug } from "../../features/journal/components/Debug/JournalParsingDebug";
import { JournalEntryRendererDemo } from "../../features/journal";

const JournalDebugPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"parsing" | "renderer">("parsing");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/journal")}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Journal
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-theme mb-2">
          Journal Debug Tools
        </h1>
        <p className="text-muted mb-8">
          Test journal content parsing and template rendering
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab("parsing")}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === "parsing"
                ? "border-accent text-accent font-medium"
                : "border-transparent text-muted hover:text-theme"
            }`}
          >
            Parsing Debug
          </button>
          <button
            onClick={() => setActiveTab("renderer")}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === "renderer"
                ? "border-accent text-accent font-medium"
                : "border-transparent text-muted hover:text-theme"
            }`}
          >
            Renderer Test
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "parsing" ? (
          <JournalParsingDebug />
        ) : (
          <JournalEntryRendererDemo />
        )}
      </div>
    </div>
  );
};

export default JournalDebugPage;
