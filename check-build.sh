#!/bin/bash

echo "🔍 Running TypeScript type check..."
cd frontend
npm run type-check

echo -e "\n✅ Type check complete!"
echo -e "\n📋 Summary of fixes:"
echo "1. QuickStats - Fixed overlap and added theme awareness"
echo "2. DailyHabitTracker - Fixed NaN issue and added balloon theme support"
echo "3. Dashboard CSS - Enhanced balloon effects and readability"
echo "4. ImprovedDashboardPage - Added debug theme indicator with quick switch"
echo -e "\n🎈 To activate balloon theme:"
echo "   - Use the debug button at bottom-left (in dev mode)"
echo "   - OR run in console: localStorage.setItem('theme-preference', 'balloon'); location.reload();"