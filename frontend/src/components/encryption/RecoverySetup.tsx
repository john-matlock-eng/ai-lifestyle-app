import React, { useState } from 'react';
import { Key, Users, HelpCircle, Copy, Check } from 'lucide-react';
import { getEncryptionService } from '../../services/encryption';

interface RecoverySetupProps {
  onComplete: () => void;
}

type RecoveryMethod = 'mnemonic' | 'social' | 'questions';

const RecoverySetup: React.FC<RecoverySetupProps> = ({ onComplete }) => {
  const [selectedMethod, setSelectedMethod] = useState<RecoveryMethod | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mnemonic state
  const [mnemonicPhrase, setMnemonicPhrase] = useState('');
  const [phraseConfirmed, setPhraseConfirmed] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  
  // Social recovery state
  const [guardians, setGuardians] = useState<string[]>(['', '', '']);
  const [threshold, setThreshold] = useState(2);
  
  // Security questions state
  const [questions, setQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);

  const recoveryMethods = [
    {
      id: 'mnemonic' as RecoveryMethod,
      name: 'Recovery Phrase',
      description: '24-word recovery phrase you can write down and store safely',
      icon: Key,
      color: 'text-[var(--success)]',
      bgColor: 'bg-[var(--success-bg)]',
    },
    {
      id: 'social' as RecoveryMethod,
      name: 'Social Recovery',
      description: 'Trusted friends or family can help you recover access',
      icon: Users,
      color: 'text-[var(--accent)]',
      bgColor: 'bg-[var(--button-hover-bg)]',
    },
    {
      id: 'questions' as RecoveryMethod,
      name: 'Security Questions',
      description: 'Answer personal questions only you know',
      icon: HelpCircle,
      color: 'text-[var(--accent)]',
      bgColor: 'bg-[var(--button-hover-bg)]',
    },
  ];

  const generateMnemonicPhrase = async () => {
    try {
      const encryptionService = getEncryptionService();
      const phrase = await encryptionService.generateRecoveryPhrase();
      setMnemonicPhrase(phrase);
    } catch (err) {
      setError('Failed to generate recovery phrase');
      console.error('Mnemonic generation error:', err);
    }
  };

  const copyPhrase = () => {
    navigator.clipboard.writeText(mnemonicPhrase);
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 2000);
  };

  const setupRecovery = async () => {
    if (!selectedMethod) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const encryptionService = getEncryptionService();
      let recoveryData = {};

      switch (selectedMethod) {
        case 'mnemonic': {
          if (!phraseConfirmed) {
            setError('Please confirm you have saved the recovery phrase');
            setIsProcessing(false);
            return;
          }
          recoveryData = { mnemonicPhrase };
          break;
        }
          
        case 'social': {
          const validGuardians = guardians.filter(g => g.trim());
          if (validGuardians.length < 3) {
            setError('Please add at least 3 guardians');
            setIsProcessing(false);
            return;
          }
          recoveryData = {
            socialGuardians: validGuardians,
            socialThreshold: threshold,
          };
          break;
        }
          
        case 'questions': {
          const validQuestions = questions.filter(q => q.question && q.answer);
          if (validQuestions.length < 3) {
            setError('Please complete all 3 security questions');
            setIsProcessing(false);
            return;
          }
          recoveryData = { securityQuestions: validQuestions };
          break;
        }
      }

      await encryptionService.setupRecovery(selectedMethod, recoveryData);
      onComplete();
    } catch (err) {
      setError('Failed to set up recovery method');
      console.error('Recovery setup error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
        Choose a recovery method
      </h3>
      
      {recoveryMethods.map((method) => {
        const Icon = method.icon;
        return (
          <button
            key={method.id}
            onClick={() => {
              setSelectedMethod(method.id);
              setCurrentStep(2);
              if (method.id === 'mnemonic') {
                generateMnemonicPhrase();
              }
            }}
            className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all hover:border-[var(--accent)] ${
              selectedMethod === method.id
                ? 'border-[var(--accent)] ' + method.bgColor
                : 'border-[var(--surface-muted)]'
            }`}
          >
            <div className={`p-3 rounded-lg ${method.bgColor}`}>
              <Icon className={`w-6 h-6 ${method.color}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-[var(--text)]">{method.name}</h4>
              <p className="text-sm text-[var(--text-muted)] mt-1">{method.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderMnemonicSetup = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
          Your Recovery Phrase
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Write down these 24 words in order and store them in a safe place.
        </p>
      </div>

      <div className="bg-[var(--surface-muted)] rounded-lg p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {mnemonicPhrase.split(' ').map((word, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] w-6">{index + 1}.</span>
              <span className="font-mono text-sm text-[var(--text)]">{word}</span>
            </div>
          ))}
        </div>
        
        <button
          onClick={copyPhrase}
          className="flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
        >
          {copiedPhrase ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy phrase
            </>
          )}
        </button>
      </div>

      <div className="bg-[var(--warning-bg)] border border-[var(--warning)] rounded-lg p-4">
        <p className="text-sm text-[var(--warning)]">
          <strong>Important:</strong> This is the only time you'll see this phrase. 
          If you lose it, you won't be able to recover your encrypted data.
        </p>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={phraseConfirmed}
          onChange={(e) => setPhraseConfirmed(e.target.checked)}
          className="w-4 h-4 text-[var(--accent)] rounded"
        />
        <span className="text-sm text-[var(--text)]">
          I have written down and safely stored my recovery phrase
        </span>
      </label>
    </div>
  );

  const renderSocialSetup = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
          Add Recovery Guardians
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Choose trusted people who can help you recover access. They cannot access 
          your data, only help with recovery.
        </p>
      </div>

      <div className="space-y-3">
        {guardians.map((guardian, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Guardian {index + 1}
            </label>
            <input
              type="email"
              value={guardian}
              onChange={(e) => {
                const newGuardians = [...guardians];
                newGuardians[index] = e.target.value;
                setGuardians(newGuardians);
              }}
              placeholder="guardian@example.com"
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
            />
          </div>
        ))}
        
        <button
          onClick={() => setGuardians([...guardians, ''])}
          className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          + Add another guardian
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Recovery threshold
        </label>
        <select
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
        >
          {Array.from({ length: Math.max(2, guardians.filter(g => g).length - 1) }, (_, i) => i + 2).map(n => (
            <option key={n} value={n}>
              {n} out of {guardians.filter(g => g).length} guardians
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Number of guardians required to approve recovery
        </p>
      </div>
    </div>
  );

  const renderQuestionsSetup = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
          Security Questions
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Choose questions with answers only you would know. Avoid information that 
          could be found on social media.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text)]">
              Question {index + 1}
            </label>
            <input
              type="text"
              value={q.question}
              onChange={(e) => {
                const newQuestions = [...questions];
                newQuestions[index].question = e.target.value;
                setQuestions(newQuestions);
              }}
              placeholder="Enter your security question"
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
            />
            <input
              type="text"
              value={q.answer}
              onChange={(e) => {
                const newQuestions = [...questions];
                newQuestions[index].answer = e.target.value;
                setQuestions(newQuestions);
              }}
              placeholder="Your answer"
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
            />
          </div>
        ))}
      </div>

      <div className="bg-[var(--button-hover-bg)] border border-[var(--accent)] rounded-lg p-4">
        <p className="text-sm text-[var(--accent)]">
          <strong>Tip:</strong> Use answers that are memorable to you but not easily 
          guessable. Consider using full sentences rather than single words.
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">
          Set Up Account Recovery
        </h2>
        <p className="text-[var(--text-muted)]">
          Protect your encrypted data by setting up a recovery method in case you 
          forget your password.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[var(--error-bg)] border border-[var(--error)] rounded-lg">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      {currentStep === 1 && renderMethodSelection()}
      
      {currentStep === 2 && selectedMethod === 'mnemonic' && renderMnemonicSetup()}
      {currentStep === 2 && selectedMethod === 'social' && renderSocialSetup()}
      {currentStep === 2 && selectedMethod === 'questions' && renderQuestionsSetup()}

      {currentStep === 2 && (
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => {
              setCurrentStep(1);
              setSelectedMethod(null);
              setError(null);
            }}
            className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-md transition-colors"
          >
            Back
          </button>
          
          <button
            onClick={setupRecovery}
            disabled={isProcessing}
            className="px-6 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isProcessing ? 'Setting up...' : 'Complete Setup'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RecoverySetup;
