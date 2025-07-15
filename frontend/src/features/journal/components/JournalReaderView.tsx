import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Edit,
  Minimize2,
  Maximize2,
  Type,
  Moon,
  Sun,
  Coffee,
  BookOpen,
  Clock,
  Calendar,
  Hash,
  Target,
  FileText,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/common';
import { JournalEntryRenderer } from './JournalEntryRenderer';
import { getTemplateIcon } from '../templates/template-utils';
import { getEmotionById, getEmotionEmoji } from './EmotionSelector/emotionData';
import { JournalEntry } from '@/types/journal';

interface JournalReaderViewProps {
  entry: JournalEntry;
  onEdit: () => void;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

type ReadingMode = 'light' | 'dark' | 'sepia';
type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

export const JournalReaderView: React.FC<JournalReaderViewProps> = ({
  entry,
  onEdit,
  onClose,
  onNavigate,
  hasPrevious,
  hasNext
}) => {
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>('dark');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate reading time (average 200 words per minute)
  useEffect(() => {
    if (entry?.wordCount) {
      setReadingTime(Math.ceil(entry.wordCount / 200));
    }
  }, [entry?.wordCount]);

  // Handle scroll progress
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    }
  }, []);

  // Auto-hide controls after inactivity
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showSettings) {
        setShowControls(false);
      }
    }, 3000);
  }, [showSettings]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Handle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          if (hasPrevious) onNavigate('prev');
          break;
        case 'ArrowRight':
          if (hasNext) onNavigate('next');
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
        case ' ':
          e.preventDefault();
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
              top: window.innerHeight * 0.8,
              behavior: 'smooth'
            });
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [hasPrevious, hasNext, onNavigate, onClose, isFullscreen, toggleFullscreen]);

  const getMoodDisplay = (mood?: string) => {
    if (!mood) return null;
    
    const emotion = getEmotionById(mood);
    if (emotion) {
      return {
        emoji: getEmotionEmoji(mood),
        label: emotion.label
      };
    }
    
    // Fallback for old mood values
    const legacyMoodMap: Record<string, { emoji: string; label: string }> = {
      amazing: { emoji: '🤩', label: 'Amazing' },
      good: { emoji: '😊', label: 'Good' },
      okay: { emoji: '😐', label: 'Okay' },
      stressed: { emoji: '😰', label: 'Stressed' },
      sad: { emoji: '😢', label: 'Sad' }
    };
    
    return legacyMoodMap[mood] || { emoji: '💭', label: mood };
  };

  // Reading mode styles
  const getReadingModeStyles = () => {
    switch (readingMode) {
      case 'light':
        return 'bg-white text-gray-900';
      case 'sepia':
        return 'bg-[#f4ecd8] text-[#5c4b37]';
      case 'dark':
      default:
        return 'bg-gray-900 text-gray-100';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-base leading-relaxed';
      case 'large':
        return 'text-xl leading-relaxed';
      case 'xlarge':
        return 'text-2xl leading-loose';
      case 'medium':
      default:
        return 'text-lg leading-relaxed';
    }
  };

  const getSettingsButtonStyles = () => {
    switch (readingMode) {
      case 'light':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300';
      case 'sepia':
        return 'bg-[#e8dcc3] hover:bg-[#ddd0b8] text-[#5c4b37] border-[#d4c4aa]';
      case 'dark':
      default:
        return 'bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700';
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden transition-colors duration-300 ${getReadingModeStyles()}`}
      onMouseMove={resetControlsTimeout}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-opacity-20 bg-current z-50">
        <div 
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header Controls */}
      <div className={`absolute top-0 left-0 right-0 z-40 transition-all duration-300 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}>
        <div className={`backdrop-blur-md ${
          readingMode === 'dark' ? 'bg-black/50' : readingMode === 'sepia' ? 'bg-[#f4ecd8]/90' : 'bg-white/90'
        } px-6 py-4`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className={getSettingsButtonStyles()}
              >
                <X className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTemplateIcon(entry.template)}</span>
                <h1 className="text-xl font-semibold truncate max-w-md">{entry.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className={getSettingsButtonStyles()}
              >
                <Settings className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className={getSettingsButtonStyles()}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className={getSettingsButtonStyles()}
              >
                <Edit className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`backdrop-blur-md ${
            readingMode === 'dark' ? 'bg-black/50' : readingMode === 'sepia' ? 'bg-[#f4ecd8]/90' : 'bg-white/90'
          } px-6 py-4 border-t ${
            readingMode === 'dark' ? 'border-gray-800' : readingMode === 'sepia' ? 'border-[#d4c4aa]' : 'border-gray-200'
          }`}>
            <div className="max-w-6xl mx-auto flex items-center justify-center gap-8">
              {/* Font Size */}
              <div className="flex items-center gap-3">
                <Type className="w-4 h-4 opacity-60" />
                <div className="flex items-center gap-1">
                  {(['small', 'medium', 'large', 'xlarge'] as FontSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`px-3 py-1 rounded transition-colors ${
                        fontSize === size 
                          ? 'bg-accent text-white' 
                          : `${getSettingsButtonStyles()} border`
                      }`}
                    >
                      {size === 'small' ? 'A' : size === 'medium' ? 'A' : size === 'large' ? 'A' : 'A'}
                      <span className={`${
                        size === 'small' ? 'text-xs' : 
                        size === 'medium' ? 'text-sm' : 
                        size === 'large' ? 'text-base' : 
                        'text-lg'
                      }`}></span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reading Mode */}
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 opacity-60" />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReadingMode('light')}
                    className={`p-2 rounded transition-colors ${
                      readingMode === 'light' 
                        ? 'bg-accent text-white' 
                        : `${getSettingsButtonStyles()} border`
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setReadingMode('sepia')}
                    className={`p-2 rounded transition-colors ${
                      readingMode === 'sepia' 
                        ? 'bg-accent text-white' 
                        : `${getSettingsButtonStyles()} border`
                    }`}
                  >
                    <Coffee className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setReadingMode('dark')}
                    className={`p-2 rounded transition-colors ${
                      readingMode === 'dark' 
                        ? 'bg-accent text-white' 
                        : `${getSettingsButtonStyles()} border`
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div 
        ref={scrollContainerRef}
        className="h-full overflow-y-auto scroll-smooth"
        style={{ paddingTop: showSettings ? '140px' : '80px' }}
      >
        <article className="max-w-4xl mx-auto px-6 pb-24">
          {/* Entry Header */}
          <header className="mb-12 pt-8">
            <h1 className={`font-serif font-bold mb-6 ${
              fontSize === 'small' ? 'text-3xl' : 
              fontSize === 'medium' ? 'text-4xl' : 
              fontSize === 'large' ? 'text-5xl' : 
              'text-6xl'
            }`}>
              {entry.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm opacity-70">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(entry.createdAt), 'MMMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readingTime} min read
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {entry.wordCount} words
              </span>
              {entry.tags.length > 0 && (
                <span className="flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                  {entry.tags.join(', ')}
                </span>
              )}
              {(() => {
                const moodDisplay = getMoodDisplay(entry.mood);
                return moodDisplay ? (
                  <span className="flex items-center gap-1">
                    <span className="text-base">{moodDisplay.emoji}</span>
                    <span>{moodDisplay.label}</span>
                  </span>
                ) : null;
              })()}
            </div>
          </header>

          {/* Content with Typography */}
          <div 
            ref={contentRef}
            className={`prose prose-lg max-w-none ${getFontSizeClass()} ${
              readingMode === 'dark' ? 'prose-invert' : ''
            }`}
            style={{
              fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
              lineHeight: fontSize === 'xlarge' ? '2' : '1.8'
            }}
          >
            <JournalEntryRenderer 
              entry={entry} 
              showMetadata={false}
              className={`${
                readingMode === 'sepia' ? 'text-[#5c4b37]' : ''
              }`}
            />
          </div>

          {/* Goal Progress Section */}
          {entry.goalProgress && entry.goalProgress.length > 0 && (
            <div className={`mt-16 p-8 rounded-lg ${
              readingMode === 'dark' ? 'bg-gray-800' : 
              readingMode === 'sepia' ? 'bg-[#e8dcc3]' : 
              'bg-gray-100'
            }`}>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Target className="w-6 h-6" />
                Goal Progress
              </h2>
              <div className="space-y-4">
                {entry.goalProgress.map((progress, index) => (
                  <div key={index} className={`p-4 rounded ${
                    readingMode === 'dark' ? 'bg-gray-700' : 
                    readingMode === 'sepia' ? 'bg-[#ddd0b8]' : 
                    'bg-white'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        progress.completed ? 'bg-green-500 text-white' : 'bg-gray-400'
                      }`}>
                        {progress.completed && '✓'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Goal #{index + 1}</p>
                        {progress.notes && (
                          <p className="text-sm opacity-70 mt-1">{progress.notes}</p>
                        )}
                      </div>
                      {progress.progressValue !== undefined && (
                        <div className="text-right">
                          <p className="text-2xl font-bold">{progress.progressValue}</p>
                          <p className="text-xs opacity-60">Progress</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>

      {/* Navigation Controls */}
      <div className={`absolute bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
      }`}>
        <div className={`backdrop-blur-md ${
          readingMode === 'dark' ? 'bg-black/50' : readingMode === 'sepia' ? 'bg-[#f4ecd8]/90' : 'bg-white/90'
        } px-6 py-4`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('prev')}
              disabled={!hasPrevious}
              className={`${getSettingsButtonStyles()} ${!hasPrevious ? 'opacity-50' : ''}`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous Entry
            </Button>

            <div className="flex items-center gap-4 text-sm opacity-60">
              <span>Use arrow keys to navigate</span>
              <span>•</span>
              <span>Press space to scroll</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('next')}
              disabled={!hasNext}
              className={`${getSettingsButtonStyles()} ${!hasNext ? 'opacity-50' : ''}`}
            >
              Next Entry
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalReaderView;