import React, { useState } from 'react';
import LoginForm from '../../features/auth/components/LoginForm';
import { useEnhancedAuthShihTzu } from '../../hooks/useEnhancedAuthShihTzu';
import EnhancedShihTzu from '../../components/common/EnhancedShihTzu';

const AuthTestPage: React.FC = () => {
  const companion = useEnhancedAuthShihTzu();
  const [showDebugInfo, setShowDebugInfo] = useState(true);
  const [useEnhanced, setUseEnhanced] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<'default' | 'winter' | 'party' | 'workout' | 'balloon'>('balloon');

  const testPositioning = () => {
    const firstInput = document.querySelector('input[type="email"], input[type="text"]') as HTMLElement;
    if (firstInput) {
      companion.moveToElement(firstInput, 'above');
    }
  };

  const testThoughts = [
    "Hello there! 👋",
    "I'm learning new tricks! 🎓",
    "You're amazing! ⭐",
    "Let's have some fun! 🎉",
    "Time for a walk? 🚶"
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-theme">
        {/* Enhanced Debug Controls */}
        {showDebugInfo && (
          <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">Companion Debug Panel</h3>
              <button
                onClick={() => setUseEnhanced(!useEnhanced)}
                className={`text-xs px-2 py-1 rounded ${useEnhanced ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
              >
                {useEnhanced ? 'Enhanced ON' : 'Enhanced OFF'}
              </button>
            </div>
            
            {/* Companion Stats */}
            <div className="text-xs space-y-1 mb-3">
              <p>Mood: <span className="font-mono text-purple-600">{companion.mood}</span></p>
              <p>State: <span className="font-mono text-blue-600">{companion.companionState}</span></p>
              <p>Position: <span className="font-mono">({Math.round(companion.position.x)}, {Math.round(companion.position.y)})</span></p>
              <p>Field: <span className="font-mono text-green-600">{companion.currentField || 'none'}</span></p>
            </div>

            {/* Personality Stats */}
            {useEnhanced && (
              <div className="border-t pt-2 mb-3">
                <h4 className="text-xs font-semibold mb-1">Personality</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Happiness:</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${companion.personality.traits.happiness}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Attention:</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-pink-400 h-2 rounded-full transition-all"
                        style={{ width: `${companion.personality.needs.attention}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Bond Lvl:</span>
                    <span className="font-mono">{companion.personality.bond.level.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mood Controls */}
            <div className="border-t pt-2">
              <h4 className="text-xs font-semibold mb-2">Moods</h4>
              <div className="grid grid-cols-3 gap-1">
                {['idle', 'happy', 'curious', 'excited', 'playful', 'zen', 'proud', 'concerned', 'celebrating'].map(mood => (
                  <button
                    key={mood}
                    onClick={() => companion.setMood(mood as any)}
                    className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 capitalize"
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Features */}
            {useEnhanced && (
              <>
                {/* Particle Effects */}
                <div className="border-t pt-2 mt-2">
                  <h4 className="text-xs font-semibold mb-2">Particles</h4>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => companion.triggerParticleEffect('hearts')}
                      className="text-xs px-2 py-1 bg-red-200 rounded hover:bg-red-300"
                    >
                      ❤️ Hearts
                    </button>
                    <button
                      onClick={() => companion.triggerParticleEffect('sparkles')}
                      className="text-xs px-2 py-1 bg-yellow-200 rounded hover:bg-yellow-300"
                    >
                      ✨ Sparkles
                    </button>
                    <button
                      onClick={() => companion.triggerParticleEffect('treats')}
                      className="text-xs px-2 py-1 bg-orange-200 rounded hover:bg-orange-300"
                    >
                      🦴 Treats
                    </button>
                    <button
                      onClick={() => companion.triggerParticleEffect('zzz')}
                      className="text-xs px-2 py-1 bg-blue-200 rounded hover:bg-blue-300"
                    >
                      💤 Sleep
                    </button>
                  </div>
                </div>

                {/* Thoughts */}
                <div className="border-t pt-2 mt-2">
                  <h4 className="text-xs font-semibold mb-2">Thoughts</h4>
                  <select
                    onChange={(e) => companion.showThought(e.target.value, 3000)}
                    className="w-full text-xs p-1 border rounded"
                    defaultValue=""
                  >
                    <option value="">Show a thought...</option>
                    {testThoughts.map((thought, i) => (
                      <option key={i} value={thought}>{thought}</option>
                    ))}
                  </select>
                </div>

                {/* Variants */}
                <div className="border-t pt-2 mt-2">
                  <h4 className="text-xs font-semibold mb-2">Variants</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {(['default', 'winter', 'party', 'workout', 'balloon'] as const).map(variant => (
                      <button
                        key={variant}
                        onClick={() => setSelectedVariant(variant)}
                        className={`text-xs px-2 py-1 rounded capitalize ${
                          selectedVariant === variant ? 'bg-purple-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {variant === 'balloon' ? '🎈 Balloon' : variant}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="border-t pt-2 mt-2">
              <h4 className="text-xs font-semibold mb-2">Actions</h4>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => companion.handleError()}
                  className="text-xs px-2 py-1 bg-red-200 rounded hover:bg-red-300"
                >
                  Trigger Error
                </button>
                <button
                  onClick={() => companion.handleSuccess()}
                  className="text-xs px-2 py-1 bg-green-200 rounded hover:bg-green-300"
                >
                  Trigger Success
                </button>
                <button
                  onClick={testPositioning}
                  className="text-xs px-2 py-1 bg-indigo-200 rounded hover:bg-indigo-300"
                >
                  Test Position
                </button>
                <button
                  onClick={() => companion.celebrate()}
                  className="text-xs px-2 py-1 bg-purple-200 rounded hover:bg-purple-300"
                >
                  Celebrate
                </button>
                <button
                  onClick={() => companion.pet()}
                  className="text-xs px-2 py-1 bg-pink-200 rounded hover:bg-pink-300"
                >
                  Pet 🤚
                </button>
                <button
                  onClick={() => companion.encourage()}
                  className="text-xs px-2 py-1 bg-blue-200 rounded hover:bg-blue-300"
                >
                  Encourage
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Toggle Debug Info Button */}
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="fixed top-4 left-4 text-xs px-3 py-2 bg-gray-100 rounded-lg shadow hover:bg-gray-200 z-50"
        >
          {showDebugInfo ? 'Hide' : 'Show'} Debug
        </button>

        {/* Header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
          <h1 className="mt-6 text-center text-3xl font-extrabold text-theme">
            AI Lifestyle App
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Enhanced Companion Test Page
          </p>
          <p className="mt-1 text-center text-xs text-muted">
            {useEnhanced ? '✨ Enhanced companion with personality, particles, and thoughts!' : '🐕 Basic companion mode'}
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-8">
          <LoginForm companion={companion} />
        </div>

        {/* Instructions */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">🎮 Interactive Features:</h3>
            <ul className="text-xs space-y-1 text-muted">
              <li>• Click the companion to pet it (watch for hearts!)</li>
              <li>• Focus on form fields to see contextual thoughts</li>
              <li>• Type to see encouraging messages</li>
              <li>• Create a strong password for special celebration</li>
              <li>• Submit form to see victory dance</li>
              <li>• Watch personality stats change with interactions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enhanced Companion */}
      {useEnhanced ? (
        <EnhancedShihTzu
          mood={companion.mood}
          position={companion.position}
          onPositionChange={companion.setPosition}
          onPet={companion.pet}
          size="md"
          accessories={companion.accessories}
          showThoughtBubble={companion.thoughtBubble.show}
          thoughtText={companion.thoughtBubble.text}
          particleEffect={companion.particleEffect}
          variant={selectedVariant}
          className="z-20 drop-shadow-lg"
        />
      ) : (
        // Fallback to basic companion
        <div
          className="absolute cursor-pointer transition-all duration-1000 ease-in-out z-20"
          style={{
            left: `${companion.position.x}px`,
            top: `${companion.position.y}px`,
          }}
        >
          <div className="text-6xl animate-bounce">🐕</div>
        </div>
      )}
      
      {/* Animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-15px) translateX(-10px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite;
          animation-delay: 3s;
        }
      `}</style>
    </div>
  );
};

export default AuthTestPage;