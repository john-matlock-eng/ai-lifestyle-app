import React, { useState } from "react";
import { Brain, Shield, Clock, X, AlertCircle } from "lucide-react";
import { getEncryptionService } from "../../services/encryption";
import { analysisTypes } from "./analysisTypes";

interface ShareableItem {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  encrypted: boolean;
}

interface AIShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShareableItem[];
  onAnalysisComplete: (analysisId: string) => void;
}

const AIShareDialog: React.FC<AIShareDialogProps> = ({
  isOpen,
  onClose,
  items,
  onAnalysisComplete,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState("");
  const [context, setContext] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (selectedItems.length === 0) {
      setError("Please select at least one item to analyze");
      return;
    }

    if (!selectedAnalysis) {
      setError("Please select an analysis type");
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      const encryptionService = getEncryptionService();

      // Create AI shares
      const result = await encryptionService.shareWithAI(
        items[0].type, // Assuming all items are of the same type
        selectedItems,
        selectedAnalysis,
        context || undefined,
      );

      // Close dialog and notify parent
      onAnalysisComplete(result.analysisRequestId);
      resetForm();
      onClose();
    } catch (err) {
      setError("Failed to create AI analysis. Please try again.");
      console.error("AI share error:", err);
    } finally {
      setIsSharing(false);
    }
  };

  const resetForm = () => {
    setSelectedItems([]);
    setSelectedAnalysis("");
    setContext("");
    setError(null);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-[var(--accent)]" />
            <h2 className="text-xl font-semibold text-[var(--text)]">
              AI Analysis
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-[var(--danger-bg)] text-[var(--danger)] rounded-md text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Items Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text)] mb-3">
              Select items to analyze
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-[var(--surface-muted)] rounded-lg hover:bg-[var(--surface)] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="w-4 h-4 text-[var(--accent)] rounded focus:ring-[var(--accent)]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text)]">
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {item.encrypted && (
                    <Shield className="w-4 h-4 text-[var(--success)]" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Analysis Type */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text)] mb-3">
              Choose analysis type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysisTypes.map((type) => (
                <label
                  key={type.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAnalysis === type.id
                      ? "border-[var(--accent)] bg-[var(--accent-bg)]"
                      : "border-[var(--surface-muted)] hover:border-[var(--border)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="analysisType"
                    value={type.id}
                    checked={selectedAnalysis === type.id}
                    onChange={(e) => setSelectedAnalysis(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text)]">
                      {type.name}
                    </p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      {type.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Context */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Additional context (optional)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Provide any specific questions or areas of focus for the AI analysis..."
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-none"
              rows={3}
            />
          </div>

          {/* Privacy Notice */}
          <div className="p-4 bg-[var(--info-bg)] rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 mt-0.5">
                <Shield className="w-5 h-5 text-[var(--info)]" />
                <Clock className="w-5 h-5 text-[var(--info)]" />
              </div>
              <div className="text-sm text-[var(--info)]">
                <p className="font-medium mb-1">
                  Privacy-preserving AI analysis
                </p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Your data remains encrypted during analysis</li>
                  <li>AI has temporary access only (30 minutes)</li>
                  <li>Single-use access tokens that expire after analysis</li>
                  <li>No data is stored or used for AI training</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-[var(--surface-muted)]">
          <button
            onClick={onClose}
            disabled={isSharing}
            className="px-4 py-2 text-[var(--text)] hover:bg-[var(--surface)] rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={
              isSharing || selectedItems.length === 0 || !selectedAnalysis
            }
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSharing && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSharing ? "Analyzing..." : "Start Analysis"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIShareDialog;
