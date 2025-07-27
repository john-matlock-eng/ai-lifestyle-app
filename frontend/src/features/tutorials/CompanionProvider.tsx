import React, { useRef, useEffect } from "react";
import { useEnhancedAuthShihTzu } from "../../hooks/useEnhancedAuthShihTzu";
import EnhancedShihTzu from "../../components/common/EnhancedShihTzu";

interface CompanionProviderProps {
  children: React.ReactNode;
  onCompanionReady?: (
    companion: ReturnType<typeof useEnhancedAuthShihTzu>,
  ) => void;
}

export const CompanionProvider: React.FC<CompanionProviderProps> = ({
  children,
  onCompanionReady,
}) => {
  const companion = useEnhancedAuthShihTzu();
  const readyCallbackRef = useRef(false);

  useEffect(() => {
    if (onCompanionReady && !readyCallbackRef.current) {
      readyCallbackRef.current = true;
      console.log('[CompanionProvider] Companion ready, calling callback');
      onCompanionReady(companion);
    }
  }, [companion, onCompanionReady]);

  return (
    <>
      {children}
      
      {/* Enhanced Animated Shih Tzu */}
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
        className="z-[100] drop-shadow-lg"
        style={{
          position: "fixed" as const,
          pointerEvents: "auto" as const,
        }}
      />
    </>
  );
};

export default CompanionProvider;
