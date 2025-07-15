import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common';
import { JournalParsingDebug } from '../../features/journal/components/Debug/JournalParsingDebug';

const JournalDebugPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/journal')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Journal
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-theme mb-2">Journal Debug Tools</h1>
        <p className="text-muted mb-8">Test journal content parsing and template rendering</p>

        <JournalParsingDebug />
      </div>
    </div>
  );
};

export default JournalDebugPage;