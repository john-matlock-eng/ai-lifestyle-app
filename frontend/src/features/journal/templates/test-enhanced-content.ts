// test-enhanced-content.ts
// This is a test script to verify the enhanced content format works correctly
// Run this in your browser console or Node.js environment to test

import { enhancedJournalContentUtils } from './enhanced-template-content-utils';
import { enhancedTemplates } from './enhanced-templates';
import type { SectionResponse } from '../types/enhanced-template.types';

// Test the enhanced content format
export function testEnhancedContentFormat() {
  console.log('Testing Enhanced Content Format\n');
  
  // Use the daily reflection template
  const template = enhancedTemplates.daily_reflection;
  
  // Create sample section responses
  const sectionResponses: SectionResponse[] = [
    {
      sectionId: 'gratitude',
      value: ['Morning coffee', 'Sunny weather', 'Good health'],
      metadata: { completedAt: new Date().toISOString() }
    },
    {
      sectionId: 'highlight',
      value: 'Had a productive meeting with the team and finalized the project roadmap.',
      metadata: { wordCount: 12 }
    },
    {
      sectionId: 'challenges',
      value: 'Struggled with a complex bug in the authentication system, but finally found the root cause.',
      metadata: { wordCount: 16 }
    },
    {
      sectionId: 'lessons',
      value: 'Taking breaks helps maintain focus. Sometimes stepping away from a problem brings clarity.',
      metadata: { wordCount: 13 }
    },
    {
      sectionId: 'tomorrow',
      value: {
        'Review code changes': false,
        'Update documentation': false,
        'Team standup': true
      },
      metadata: {}
    }
  ];
  
  // Convert to enhanced content format
  console.log('Converting sections to content...\n');
  const content = enhancedJournalContentUtils.sectionsToContent(template, sectionResponses);
  
  console.log('Generated Content:');
  console.log('==================');
  console.log(content);
  console.log('\n==================\n');
  
  // Parse back to sections
  console.log('Parsing content back to sections...\n');
  const parsedSections = enhancedJournalContentUtils.contentToSections(template, content);
  
  console.log('Parsed Sections:');
  console.log('================');
  parsedSections.forEach((section, index) => {
    const sectionDef = template.sections.find(s => s.id === section.sectionId);
    console.log(`\n${index + 1}. ${sectionDef?.title || 'Unknown'} (${section.sectionId})`);
    console.log('   Type:', sectionDef?.type);
    console.log('   Value:', JSON.stringify(section.value, null, 2));
    console.log('   Metadata:', section.metadata);
  });
  
  // Verify round-trip accuracy
  console.log('\n\nVerifying Round-Trip Accuracy:');
  console.log('==============================');
  
  let allMatch = true;
  sectionResponses.forEach((original, index) => {
    const parsed = parsedSections[index];
    const matches = JSON.stringify(original.value) === JSON.stringify(parsed.value);
    console.log(`Section ${original.sectionId}: ${matches ? '✓ Match' : '✗ Mismatch'}`);
    if (!matches) {
      allMatch = false;
      console.log('  Original:', original.value);
      console.log('  Parsed:', parsed.value);
    }
  });
  
  console.log(`\nOverall Result: ${allMatch ? '✓ All sections match!' : '✗ Some sections do not match'}`);
  
  // Test legacy content parsing
  console.log('\n\nTesting Legacy Content Parsing:');
  console.log('================================');
  
  const legacyContent = `## Gratitude List

I'm grateful for my morning coffee, the sunny weather, and my good health.

---

## Today's Highlight

Had a productive meeting with the team and finalized the project roadmap.

---

## Challenges Faced

Struggled with a complex bug in the authentication system, but finally found the root cause.`;
  
  console.log('Legacy Content:');
  console.log(legacyContent);
  console.log('\nParsing legacy content...');
  
  const legacyParsed = enhancedJournalContentUtils.contentToSections(template, legacyContent);
  console.log('\nParsed from legacy:', legacyParsed.length, 'sections found');
  legacyParsed.forEach(section => {
    const sectionDef = template.sections.find(s => s.id === section.sectionId);
    console.log(`- ${sectionDef?.title}: ${typeof section.value === 'string' ? section.value.substring(0, 50) + '...' : section.value}`);
  });
}

// Example of how to use in a component
/*
import { testEnhancedContentFormat } from './test-enhanced-content';

// In your component or console:
testEnhancedContentFormat();
*/