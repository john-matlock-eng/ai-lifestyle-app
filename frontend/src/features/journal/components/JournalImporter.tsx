import React, { useState } from "react";
import { Calendar, FileText, Save, X, Upload, Hash } from "lucide-react";
import { Button, Input } from "@/components/common";
import { EmotionSelector } from "./EmotionSelector";
import { JournalTemplate } from "@/types/journal";
import type { CreateJournalEntryRequest } from "@/types/journal";
import { getEmotionById, getEmotionEmoji } from "./EmotionSelector/emotionData";

interface JournalImporterProps {
  onImport: (entry: CreateJournalEntryRequest) => Promise<void>;
  onCancel: () => void;
  isEncryptionEnabled?: boolean;
}

export const JournalImporter: React.FC<JournalImporterProps> = ({
  onImport,
  onCancel,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [tags, setTags] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const validateForm = () => {
    const newErrors: { title?: string; content?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!content.trim()) {
      newErrors.content = "Content is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
      const tagsList = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      // Create the entry with the selected date
      // Note: The backend will handle the actual date when creating the entry
      
      const entry: CreateJournalEntryRequest = {
        title: title.trim(),
        content: content.trim(),
        template: JournalTemplate.BLANK,
        wordCount,
        tags: tagsList,
        mood: selectedMoods[0] || undefined,
        isEncrypted: false, // Will be handled by the parent component if encryption is enabled
        linkedGoalIds: [],
        goalProgress: [],
      };

      await onImport(entry);
    } catch (error) {
      console.error("Failed to import journal entry:", error);
      // You might want to show an error toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const selectedEmotion = selectedMoods[0] ? getEmotionById(selectedMoods[0]) : null;

  // Format date for display
  const formatDisplayDate = (dateString: string): string => {
    const date = new Date(dateString + 'T12:00:00');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Get today's date in YYYY-MM-DD format for max date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-theme mb-2 flex items-center">
          <Upload className="w-8 h-8 mr-3 text-accent" />
          Import Journal Entry
        </h1>
        <p className="text-muted">
          Import your existing journal entry with a custom date and mood
        </p>
      </div>

      {/* Form Container */}
      <div className="glass rounded-xl p-8 space-y-6">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-theme mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Title
          </label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your journal entry"
            error={errors.title}
          />
        </div>

        {/* Date Picker */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-theme mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Date
          </label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={today}
          />
          <p className="text-xs text-muted mt-1">
            Set the original date of your journal entry
          </p>
        </div>

        {/* Mood Selector */}
        <div>
          <label className="block text-sm font-medium text-theme mb-2">How were you feeling?</label>
          <EmotionSelector
            value={selectedMoods}
            onChange={setSelectedMoods}
            maxSelections={1}
          />
        </div>

        {/* Content Textarea */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-theme mb-2 flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Journal Content
            </span>
            <span className="text-xs text-muted">{wordCount} words</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or type your journal entry here..."
            rows={12}
            className="block w-full rounded-md shadow-sm transition-all duration-200 sm:text-sm text-theme bg-surface placeholder-text-muted px-4 py-3 border border-surface-muted focus:outline-none focus:border-accent focus:shadow-focus hover:border-accent/50 resize-none"
          />
          {errors.content && (
            <p className="mt-1 text-sm text-error-theme">{errors.content}</p>
          )}
        </div>

        {/* Tags Input */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-theme mb-2 flex items-center">
            <Hash className="w-4 h-4 mr-2" />
            Tags (optional)
          </label>
          <Input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags separated by commas (e.g., personal, reflection, goals)"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-gradient"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Importing..." : "Import Entry"}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Preview Section */}
      {(title || content) && (
        <div className="mt-8 glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Preview</h3>
          <div className="space-y-3">
            {title && (
              <h4 className="text-xl font-bold text-theme">{title}</h4>
            )}
            <div className="flex items-center gap-4 text-sm text-muted">
              <span>{formatDisplayDate(selectedDate)}</span>
              {selectedEmotion && (
                <span className="flex items-center">
                  <span className="mr-1">{getEmotionEmoji(selectedEmotion.id)}</span>
                  <span>{selectedEmotion.label}</span>
                </span>
              )}
            </div>
            {content && (
              <p className="text-theme whitespace-pre-wrap line-clamp-6">{content}</p>
            )}
            {tags && (
              <div className="flex flex-wrap gap-2">
                {tags.split(',').map((tag) => tag.trim()).filter(tag => tag.length > 0).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-surface-muted rounded-full text-xs text-muted">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalImporter;
