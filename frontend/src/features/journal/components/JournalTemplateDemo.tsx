import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/common';
import TemplatePicker from './TemplatePicker';
import JournalEditor from './JournalEditor';
import JournalEditorWithSections from './JournalEditorWithSections';
import type { JournalTemplate } from '../types/template.types';
import { purgeOldDrafts } from '../utils/drafts';

type SelectionState = { template: JournalTemplate } | 'scratch' | null;

const JournalTemplateDemo: React.FC = () => {
  const [selection, setSelection] = useState<SelectionState>(null);

  useEffect(() => {
    purgeOldDrafts();
  }, []);

  const handleBack = () => {
    setSelection(null);
  };

  const handleSave = (data: any) => {
    console.log('Saved journal entry:', data);
    // In a real app, this would save to your backend
    alert('Journal entry saved successfully!');
    setSelection(null);
  };

  if (selection === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-accent/10 text-accent">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-4xl font-bold text-gradient">
                Journal Editor Demo
              </h1>
            </div>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Experience our beautiful, theme-aware journal editor. Choose a template or start from scratch.
            </p>
          </div>

          {/* Template Picker */}
          <div className="animate-fadeInUp">
            <TemplatePicker
              onSelect={(t) => setSelection(t ? { template: t } : 'scratch')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="hover-lift"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>

        {/* Editor */}
        <div className="animate-fadeInUp">
          {selection === 'scratch' ? (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-theme mb-2">
                  Free Writing
                </h2>
                <p className="text-muted">
                  Start with a blank canvas and write whatever comes to mind
                </p>
              </div>
              <JournalEditor 
                initialContent="" 
                onSave={(content) => handleSave({ content, type: 'scratch' })} 
                draftId="demo-scratch"
              />
            </div>
          ) : (
            <JournalEditorWithSections
              template={selection.template}
              onSave={handleSave}
              draftId={`demo-${selection.template.id}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalTemplateDemo;