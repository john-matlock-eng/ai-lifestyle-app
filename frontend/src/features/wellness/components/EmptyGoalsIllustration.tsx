import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';

const EmptyGoalsIllustration: React.FC = () => (
  <div className="text-center py-10 text-[var(--color-text)]">
    <div className="text-6xl mb-4">🌱</div>
    <p className="mb-4 text-[color:var(--color-text-muted,theme(colors.gray.500))]">Start by creating your first wellness goal!</p>
    <Button
      as={Link}
      to="/goals/new"
      aria-label="Create Your First Goal"
      className="bg-gradient-to-r from-primary-500 to-primary-400 rounded-xl hover:-translate-y-0.5 transition-transform text-white"
    >
      Create Your First Goal
    </Button>
  </div>
);

export default EmptyGoalsIllustration;
